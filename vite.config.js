import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      {
        name: 'configure-server',
        configureServer(server) {
          server.middlewares.use('/api/analyze-vibe', async (req, res, next) => {
            if (req.method !== 'POST') return next();

            let body = '';
            req.on('end', async () => {
              try {
                console.log("AI: Request received");
                const { prompt } = JSON.parse(body);
                const apiKey = env.GEMINI_API_KEY;
                const tmdbKey = env.VITE_TMDB_API_KEY;
                
                if (!apiKey || !tmdbKey) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: "Missing API Keys" }));
                  return;
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

                const TIMEOUT_MS = 5500;
                
                try {
                // Race: AI vs 5.5s Clock
                const aiPromise = model.generateContent(systemInstruction);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), TIMEOUT_MS));

                const result = await Promise.race([aiPromise, timeoutPromise]);
                const aiResponse = JSON.parse(result.response.text());
                
                console.log("AI Strategy:", aiResponse);

                let tmdbData;
                const baseUrl = 'https://api.themoviedb.org/3';

                if (aiResponse.strategy === 'search') {
                   const query = encodeURIComponent(aiResponse.query);
                   const u = `${baseUrl}/search/movie?api_key=${tmdbKey}&query=${query}&language=en-US`;
                   const r = await fetch(u);
                   tmdbData = await r.json();
                } else {
                   // Discover
                   const params = new URLSearchParams({
                       api_key: tmdbKey,
                       language: 'en-US',
                       include_adult: 'false',
                       'vote_count.gte': '300',
                       sort_by: 'popularity.desc',
                       ...aiResponse.params
                   });
                   const u = `${baseUrl}/discover/movie?${params.toString()}`;
                   const r = await fetch(u);
                   tmdbData = await r.json();
                }

                if (!tmdbData.results?.length) throw new Error("No results");

                let winner;
                if (aiResponse.strategy === 'search') {
                    winner = tmdbData.results[0];
                } else {
                    const candidates = tmdbData.results.slice(0, 5);
                    winner = candidates[Math.floor(Math.random() * candidates.length)];
                }

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ movie: winner, aiContext: aiResponse }));

                } catch (err) {
                    console.error("❌ Middleware Error:", err);
                    console.error("Stack:", err.stack);
                    
                    // Fallback
                    const fallback = await fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${tmdbKey}`);
                    const tmdbData = await fallback.json();
                    
                    const candidates = tmdbData.results.slice(0, 5);
                    const winner = candidates[Math.floor(Math.random() * candidates.length)];

                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ movie: winner, aiContext: { strategy: 'fallback', reason: err.toString() } }));
                }

              } catch (error) {
                console.error("AI Error:", error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "AI Failed", details: error.toString() }));
              }
            });
          });
        }
      },
      VitePWA({ 
        registerType: 'autoUpdate',
        includeAssets: ['app-icon.png'],
        manifest: {
          name: 'CineQuest: Vibe Coder',
          short_name: 'CineQuest',
          description: 'Spin the wheel, play trivia, and find your next favorite movie.',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          icons: [
            {
              src: 'app-icon.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'app-icon.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
  }
})
