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
            req.on('data', chunk => { body += chunk.toString() });
            req.on('end', async () => {
              try {
                console.log("AI: Request received");
                const { prompt } = JSON.parse(body);
                const apiKey = env.GEMINI_API_KEY; // Try VITE_ prefix if standard fails? No, loadEnv('') allows all.
                
                console.log("AI: API Key Present?", !!apiKey, "Length:", apiKey ? apiKey.length : 0);
                
                if (!apiKey) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: "Missing API Key" }));
                  return;
                }

                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

                const systemInstruction = `
                  You are an expert movie recommender system. Your job is to translate natural language user requests ("vibes") into a structured JSON object compatible with The Movie Database (TMDB) API filters.
                  Output ONLY raw JSON. No markdown.
                  Target: { "with_genres": "ids", "primary_release_date.gte": "date", "primary_release_date.lte": "date", "sort_by": "popularity.desc" }
                  Input: "${prompt}"
                `;

                const result = await model.generateContent(systemInstruction);
                const response = await result.response;
                let text = response.text();
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                
                console.log("AI: Success", text);
                res.setHeader('Content-Type', 'application/json');
                res.end(text);
              } catch (error) {
                console.error("AI Error:", error); // Make sure this prints
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
