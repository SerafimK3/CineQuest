
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

  const TIMEOUT_MS = 3500; // Aggressive 3.5s Limit

  try {
    const { prompt } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    const tmdbKey = process.env.VITE_TMDB_API_KEY;

    if (!apiKey || !tmdbKey) {
      return new Response(JSON.stringify({ error: 'Missing API Keys' }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash", // Using 2.0 Flash as it is the functional Flash model in this env.
        generationConfig: { 
            response_mime_type: "application/json",
            temperature: 0.1 // Precise, non-creative
        }
    });

    const systemInstruction = `
      You are a JSON machine. Convert user text to TMDB API parameters.
      
      Rules:
      * Default 'vote_count.gte' to 300 (Avoid garbage).
      * Default 'sort_by' to 'popularity.desc' (Relevance).
      * Map 'Netflix' to provider ID 8, 'Disney+' to 337, 'Amazon' to 119.
      * CRITIAL: If user names a specific movie (e.g. 'Avenger'), return strategy: 'search' and the specific title.
      * If user describes a vibe, return strategy: 'discover' with filters (genres, keywords).
      * Output JSON only.

      Example Search: { "strategy": "search", "query": "Avengers: Endgame" }
      Example Discover: { "strategy": "discover", "params": { "with_genres": "27", "vote_count.gte": "300", "sort_by": "popularity.desc" } }

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
