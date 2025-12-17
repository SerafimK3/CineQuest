import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { VitePWA } from 'vite-plugin-pwa'
import apiHandler from './api/analyze-vibe.js'
import trendingHandler from './api/trending-image.js'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      {
        name: 'configure-server',
        configureServer(server) {

          // Middleware to proxy/handle API requests locally using the same code as production
          server.middlewares.use('/api', async (req, res, next) => {
            // Inject Environment Variables
            // Inject Environment Variables (Support both VITE_ prefixed and standard names)
            const geminiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
            const tmdbKey = env.VITE_TMDB_API_KEY || env.TMDB_API_KEY;

            process.env.GEMINI_API_KEY = geminiKey;
            process.env.VITE_TMDB_API_KEY = tmdbKey;
            
            console.log(`🔑 Keys Check: Gemini=${geminiKey ? 'OK' : 'MISSING'}, TMDB=${tmdbKey ? 'OK' : 'MISSING'}`);

            // Polyfill Express/Vercel response methods
            res.status = (code) => { res.statusCode = code; return res; };
            res.json = (data) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
            };
            res.redirect = (status, url) => {
                if (typeof status === 'string') { url = status; status = 302; }
                res.statusCode = status;
                res.setHeader('Location', url);
                res.end();
            };

            // Route: /api/analyze-vibe
            if (req.url.includes('/analyze-vibe') && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              try {
                // Parse Body
                req.body = JSON.parse(body);
                
                // Call the actual API handler
                await apiHandler(req, res);

              } catch (e) {
                console.error("Local Middleware Error:", e);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Local Server Error", details: e.message }));
              }
            });
            return;
            }

            // Route: /api/trending-image
            if (req.url.includes('/trending-image')) {
              await trendingHandler(req, res);
              return;
            }

            next();
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
