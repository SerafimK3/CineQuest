
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

export const config = {
  runtime: 'edge', // Or 'nodejs' if axios needs it, but standard fetch is better in edge. modifying to use fetch for edge compatibility or axios if node.
};

// Vercel Serverless Function
export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { prompt } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    const tmdbKey = process.env.VITE_TMDB_API_KEY;

    if (!apiKey || !tmdbKey) {
      return new Response(JSON.stringify({ error: 'Missing API Keys' }), { status: 500 });
    }

    // 1. Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash", // User requested 1.5-flash but we validated 2.0 is available only? Reverting to requested 1.5-flash if 2.0 fails, but we proved 2.0 works. Sticking to 2.0-flash as verified.
        generationConfig: { response_mime_type: "application/json" }
    });

    // 2. System Instruction (The Brain)
    const systemInstruction = `
      You are a movie expert and API translator. Your goal is to find the perfect movie for the user by translating their natural language request into The Movie Database (TMDB) API parameters.

      ### YOUR JOB
      1. Analyze the input.
      2. Decide the Strategy: "search" (for specific titles/franchises) or "discover" (for vibes/genres).
      3. Output valid JSON to execute the strategy.

      ### CRITICAL: HANDLING "PICK ONE"
      - If the user asks to "Pick one of the [Franchise] movies", YOU must choose a specific popular installment.
      - DO NOT return the franchise name. Return the SPECIFIC TITLE.
      - Example: "Pick one of the Avengers" -> { "strategy": "search", "query": "The Avengers" } OR { "strategy": "search", "query": "Avengers: Infinity War" }.
      - Example: "Pick a Harry Potter movie" -> { "strategy": "search", "query": "Harry Potter and the Prisoner of Azkaban" }.

      ### MAPPINGS (Use these IDs)
      - Genres: Action=28, Adventure=12, Animation=16, Comedy=35, Crime=80, Documentary=99, Drama=18, Family=10751, Fantasy=14, History=36, Horror=27, Music=10402, Mystery=9648, Romance=10749, Sci-Fi=878, TV Movie=10770, Thriller=53, War=10752, Western=37.
      - Providers: Netflix=8, Disney+=337, Amazon Prime=119, HBO Max=384, Hulu=15, Apple TV=350.
      - Regions: Austria=AT, Germany=DE, USA=US, UK=GB. (Default to US if unknown).

      ### OUTPUT FORMAT (JSON ONLY)
      
      **Scenario A: User asks for a specific movie or franchise (e.g., "Scary Movie", "Harry Potter", "Inception")**
      {
        "strategy": "search",
        "query": "Scary Movie", 
        "year": "optional_year"
      }

      **Scenario B: User asks for a vibe/genre (e.g., "Scary movie from the 90s on Netflix")**
      {
        "strategy": "discover",
        "params": {
          "with_genres": "27",
          "primary_release_date.gte": "1990-01-01",
          "primary_release_date.lte": "1999-12-31",
          "watch_region": "US",
          "with_watch_providers": "8",
          "sort_by": "popularity.desc"
        }
      }

      User Input: "${prompt}"
    `;

    // 3. Ask Gemini
    const result = await model.generateContent(systemInstruction);
    const aiResponse = JSON.parse(result.response.text());
    
    // 4. Execute TMDB Fetch based on Strategy
    let tmdbData;
    const baseUrl = 'https://api.themoviedb.org/3';
    
    if (aiResponse.strategy === 'search') {
        // Strategy: SEARCH
        const query = encodeURIComponent(aiResponse.query);
        const yearParam = aiResponse.year ? `&year=${aiResponse.year}` : '';
        const url = `${baseUrl}/search/movie?api_key=${tmdbKey}&query=${query}${yearParam}&language=en-US&page=1`;
        
        const fetchRes = await fetch(url);
        tmdbData = await fetchRes.json();
    } else {
        // Strategy: DISCOVER
        const params = new URLSearchParams({
            api_key: tmdbKey,
            language: 'en-US',
            page: '1',
            include_adult: 'false',
            include_video: 'false',
            ...aiResponse.params
        });
        
        const url = `${baseUrl}/discover/movie?${params.toString()}`;
        const fetchRes = await fetch(url);
        tmdbData = await fetchRes.json();
    }

    // 5. Select Winning Movie
    if (!tmdbData.results || tmdbData.results.length === 0) {
         // Fallback to trending
         const fallbackUrl = `${baseUrl}/trending/movie/week?api_key=${tmdbKey}`;
         const fallbackRes = await fetch(fallbackUrl);
         tmdbData = await fallbackRes.json();
    }

    let winner;
    if (aiResponse.strategy === 'search') {
        // For specific searches, the Top Result is usually the one requested.
        // If the AI said "Avengers: Infinity War", result[0] will be that movie.
        winner = tmdbData.results[0];
    } else {
        // For vibes (Discover), keep it random/spicy from the top 5.
        const candidates = tmdbData.results.slice(0, 5);
        winner = candidates[Math.floor(Math.random() * candidates.length)];
    }

    return new Response(JSON.stringify({ 
        movie: winner, 
        aiContext: aiResponse 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI Spin Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.toString() }), { status: 500 });
  }
}
