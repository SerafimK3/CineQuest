
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

export const config = {
  runtime: 'edge', 
};

// Vercel Serverless Function
export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  const TIMEOUT_MS = 5500; // Increased to 5.5s to handle Free Tier latency

  try {
    const { prompt } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    const tmdbKey = process.env.VITE_TMDB_API_KEY;

    if (!apiKey || !tmdbKey) {
      return new Response(JSON.stringify({ error: 'Missing API Keys' }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash", 
        generationConfig: { 
            response_mime_type: "application/json",
            temperature: 0.1 
        }
    });

    const systemInstruction = `
  You are a TMDB API Expert. Convert user text into precise JSON parameters.

  ### CHEAT SHEET (Use these exact IDs):
  - GENRES: Action=28, Adventure=12, Animation=16, Comedy=35, Crime=80, Documentary=99, Drama=18, Family=10751, Fantasy=14, History=36, Horror=27, Music=10402, Mystery=9648, Romance=10749, Sci-Fi=878, TV Movie=10770, Thriller=53, War=10752, Western=37.
  - PROVIDERS: Netflix=8, Disney+=337, Amazon Prime=119, Apple TV=2, HBO Max=384.
  - REGIONS: Austria=AT, Germany=DE, USA=US, UK=GB. (Default to 'US' if provider is set but no region specified).

  ### RULES:
  1. **Strategy Selection:**
     - If user names a SPECIFIC movie/franchise (e.g., "Harry Potter", "Inception"), use strategy: "search".
     - If user asks for a VIBE/CATEGORY (e.g., "Scary movie", "Something from the 80s"), use strategy: "discover".

  2. **Filtering Logic (For 'discover'):**
     - **Garbage Filter:** ALWAYS set "vote_count.gte": "300" (unless user asks for 'new' or 'upcoming').
     - **Sorting:** Default "sort_by": "popularity.desc". If user says "best" or "top rated", use "vote_average.desc".
     - **Dates:** If user says "80s", set "primary_release_date.gte": "1980-01-01" and "primary_release_date.lte": "1989-12-31".
     - **Providers:** If a provider is mentioned (e.g. "Netflix"), you MUST set "with_watch_providers": "ID" AND "watch_region": "CountryCode".

  ### OUTPUT FORMAT (JSON ONLY):
  Example 1 (Search): { "strategy": "search", "query": "The Dark Knight" }
  Example 2 (Discover): { "strategy": "discover", "params": { "with_genres": "27,35", "watch_region": "AT", "with_watch_providers": "8", "vote_count.gte": "300", "sort_by": "popularity.desc" } }

  Input: "${prompt}"
`;
    // Race Condition: AI vs Clock
    const aiPromise = model.generateContent(systemInstruction);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), TIMEOUT_MS));

    let aiContext = {};
    let tmdbData;
    const baseUrl = 'https://api.themoviedb.org/3';

    try {
        const result = await Promise.race([aiPromise, timeoutPromise]);
        const aiResponse = JSON.parse(result.response.text());
        aiContext = aiResponse;

        if (aiResponse.strategy === 'search') {
            const query = encodeURIComponent(aiResponse.query);
            const u = `${baseUrl}/search/movie?api_key=${tmdbKey}&query=${query}&language=en-US&page=1`;
            const r = await fetch(u);
            tmdbData = await r.json();
        } else {
            const params = new URLSearchParams({
                api_key: tmdbKey,
                language: 'en-US',
                include_adult: 'false',
                include_video: 'false',
                'vote_count.gte': '300', // Hard safety
                sort_by: 'popularity.desc', // Default sort
                ...aiResponse.params
            });
            const u = `${baseUrl}/discover/movie?${params.toString()}`;
            const r = await fetch(u);
            tmdbData = await r.json();
        }

    } catch (err) {
        console.log("AI/Fetch Failed or Timed out, switching to Fallback:", err.message);
        // Fallback Logic immediately
        const fallbackUrl = `${baseUrl}/trending/movie/day?api_key=${tmdbKey}`;
        const fallbackRes = await fetch(fallbackUrl);
        tmdbData = await fallbackRes.json();
        aiContext = { strategy: 'fallback', reason: err.message };
    }

    // Selection Logic
    if (!tmdbData.results || tmdbData.results.length === 0) {
        // Double fallback if search yielded 0
        const fallbackUrl = `${baseUrl}/trending/movie/day?api_key=${tmdbKey}`;
        const fallbackRes = await fetch(fallbackUrl);
        tmdbData = await fallbackRes.json();
    }

    let winner;
    if (aiContext.strategy === 'search' && tmdbData.results.length > 0) {
        winner = tmdbData.results[0]; // Top relevance for specific search
    } else {
        // For discover/trending, pick top 5
        const candidates = tmdbData.results.slice(0, 5);
        winner = candidates[Math.floor(Math.random() * candidates.length)];
    }

    return new Response(JSON.stringify({ 
        movie: winner, 
        aiContext 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (criticalError) {
    console.error('Critical Error:', criticalError);
    return new Response(JSON.stringify({ error: 'Internal Error' }), { status: 500 });
  }
}
