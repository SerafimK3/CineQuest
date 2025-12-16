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
                  generationConfig: { 
                      response_mime_type: "application/json",
                      temperature: 0.1 
                  }
                });

                const systemInstruction = `
                  You are a JSON machine. Convert user text to TMDB API parameters.
                  Rules:
                  * Default 'vote_count.gte' to 300 (Avoid garbage).
                  * Default 'sort_by' to 'popularity.desc'.
                  * Map 'Netflix' to provider ID 8.
                  * If specific movie, return strategy: 'search'.
                  * If vibe, return strategy: 'discover'.
                  * Output JSON only.

                  Input: "${prompt}"
                `;

                const TIMEOUT_MS = 3500;
                
                try {
                // Race: AI vs 3.5s Clock
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
                    console.log("AI Timeout or Fail, using fallback:", err.message);
                    // Fallback
                    const fallback = await fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${tmdbKey}`);
                    const tmdbData = await fallback.json();
                    
                    const candidates = tmdbData.results.slice(0, 5);
                    const winner = candidates[Math.floor(Math.random() * candidates.length)];

                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ movie: winner, aiContext: { strategy: 'fallback' } }));
                }

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
