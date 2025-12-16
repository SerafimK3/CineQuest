import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { GoogleGenerativeAI } from '@google/generative-ai'

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
                  generationConfig: { response_mime_type: "application/json" }
                });

                const systemInstruction = `
                  You are a movie expert and API translator.
                  ### JOB
                  1. Analyze input.
                  2. Decide Strategy: "search" (specific title/franchise) OR "discover" (vibe/genre).
                  3. Output JSON.

                  ### MAPPINGS
                  Genres: Action=28, Horror=27, Comedy=35, Drama=18, Sci-Fi=878, Romance=10749, Family=10751.
                  Providers: Netflix=8, Disney+=337, Amazon=119.
                  Regions: US=US, Austria=AT, Germany=DE.

                  ### OUTPUT JSON
                  Strategy SEARCH: { "strategy": "search", "query": "Movie Title", "year": "optional" }
                  Strategy DISCOVER: { "strategy": "discover", "params": { "with_genres": "27", "etc": "..." } }
                  
                  Input: "${prompt}"
                `;

                const result = await model.generateContent(systemInstruction);
                const aiResponse = JSON.parse(result.response.text());
                
                console.log("AI Strategy:", aiResponse);

                // Execute TMDB Fetch
                let tmdbData;
                const baseUrl = 'https://api.themoviedb.org/3';

                if (aiResponse.strategy === 'search') {
                   const query = encodeURIComponent(aiResponse.query);
                   const u = `${baseUrl}/search/movie?api_key=${tmdbKey}&query=${query}&language=en-US`;
                   const r = await fetch(u);
                   tmdbData = await r.json();
                } else {
                   const params = new URLSearchParams({
                       api_key: tmdbKey,
                       language: 'en-US',
                       include_adult: 'false',
                       ...aiResponse.params
                   });
                   const u = `${baseUrl}/discover/movie?${params.toString()}`;
                   const r = await fetch(u);
                   tmdbData = await r.json();
                }

                if (!tmdbData.results?.length) {
                    const fallback = await fetch(`${baseUrl}/trending/movie/week?api_key=${tmdbKey}`);
                    tmdbData = await fallback.json();
                }

                const candidates = tmdbData.results.slice(0, 5);
                const winner = candidates[Math.floor(Math.random() * candidates.length)];

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ movie: winner, aiContext: aiResponse }));

              } catch (error) {
                console.error("AI Error:", error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "AI Failed", details: error.toString() }));
              }
            });
          });
        }
      }
    ],
  }
})
