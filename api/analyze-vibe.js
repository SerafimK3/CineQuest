import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCachedVibe, setCachedVibe } from './cache-manager.js';

// Node.js Runtime (Stable, allows loops/multiple fetches)
export const config = {
  maxDuration: 60, // Give it time to check availability (Vercel Limit)
};

export default async function handler(req, res) {
  // 1. CORS & Methods
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { prompt, region } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    const tmdbKey = process.env.VITE_TMDB_API_KEY;
    const userRegion = region || 'US'; 

    if (!apiKey || !tmdbKey) return res.status(500).json({ error: 'Missing Keys' });

    // --- STEP 0: CHECK CACHE ---
    let candidates = [];
    const cached = getCachedVibe(prompt, userRegion);
    
    if (cached && cached.candidates) {
        console.log("⚡ RAM Cache HIT: Loading Candidate List");
        candidates = cached.candidates;
    } else {
        // --- STEP 1: PROPOSER (AI - Only if not cached) ---
        console.log("🤖 MISS: Asking Gemini...");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            generationConfig: { response_mime_type: "application/json" } 
        });
        
        // Explicit Instruction for List format
        const systemPrompt = `
          Task: recommend 10 movies OR TV series based on input: "${prompt}".
          
          CRITICAL LOGIC:
          1. **DETECTIVE MODE**: If the user describes a specific plot, scene, or actor (e.g. "DiCaprio sinking ship"), the FIRST item in your list MUST be that exact title ("Titanic").
          2. **FRANCHISE MODE**: If the user mentions a series ("Avengers"), list all of them.
          3. **VIBE MODE**: If the input is vague ("sad 90s movie"), suggest 10 varied recommendations.
          4. **FORMAT**: If it is a TV Series, just output the title (e.g. "The Office", "Breaking Bad").

          Output: JSON Array of strings (Exact English Titles).
          Rules: No explanations. Precise English Titles only.
          
          Example Output: ["Titanic", "The Office", "Breaking Bad", "The Beach"]
        `;

        const aiResult = await model.generateContent(systemPrompt);
        const text = aiResult.response.text();
        
        try {
            // Robust Extraction
            const jsonMatch = text.match(/\[[\s\S]*\]/); 
            if (!jsonMatch) throw new Error("No List found");
            candidates = JSON.parse(jsonMatch[0]);
            
            // Save Valid List to Cache immediately
            setCachedVibe(prompt, userRegion, { candidates });
            
        } catch (e) {
            console.error("AI Parse Failed:", text);
            // Fallback list to at least try something
            candidates = ["Parasite", "The Office", "Mad Max: Fury Road", "Breaking Bad", "Spider-Man: Into the Spider-Verse"];
        }
    }

    console.log(`📋 Candidates Worklist (${candidates.length}):`, candidates);

    // --- SHUFFLE STEP ---
    // Runs on BOTH Cached and Fresh lists to ensure variety
    // Prevent "Order Bias" (always picking the first movie in a franchise list)
    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }


    // --- STEP 2: VALIDATOR (Code) ---
    // We check batches to be fast but sequential enough to stop early.
    let winner = null;
    let winnerProvider = null;
    const BATCH_SIZE = 3;

    // Helper to check one movie
    const checkAvailability = async (title) => {
        try {
            // A. Search ID (USE MULTI SEARCH NOW)
            const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&query=${encodeURIComponent(title)}`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();
            
            if (!searchData.results || searchData.results.length === 0) return null;
            
            // Find first Movie OR TV result
            const match = searchData.results.find(item => item.media_type === 'movie' || item.media_type === 'tv');
            if (!match) return null;

            // B. Check Providers in Region
            // Dynamic Endpoint based on media_type
            const providerUrl = `https://api.themoviedb.org/3/${match.media_type}/${match.id}/watch/providers?api_key=${tmdbKey}`;
            const providerRes = await fetch(providerUrl);
            const providerData = await providerRes.json();
            
            const regionData = providerData.results && providerData.results[userRegion];
            
            // C. Criteria: Can we watch it? (Stream, Rent, or Buy)
            if (regionData && (regionData.flatrate || regionData.rent || regionData.buy)) {
                return { movie: match, provider: regionData };
            }
            return null; // Not available
        } catch (e) {
            return null;
        }
    };

    // Batch Loop
    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
        const batch = candidates.slice(i, i + BATCH_SIZE);
        console.log(`🔍 Checking Batch ${i/BATCH_SIZE + 1}:`, batch);
        
        // Run batch in parallel
        const results = await Promise.all(batch.map(title => checkAvailability(title)));
        
        // Did we find a winner?
        const found = results.find(r => r !== null);
        if (found) {
            winner = found.movie;
            winnerProvider = found.provider;
            console.log("✅ Winner Found:", winner.title);
            break; // STOP LOOP
        }
    }

    // --- STEP 3: FAILSAFE ---
    let reason = "Found a match available to watch!";
    if (!winner) {
        console.log("❌ No AI candidates available. Switching to Trending.");
        const fallbackUrl = `https://api.themoviedb.org/3/trending/movie/week?api_key=${tmdbKey}`;
        const fbRes = await fetch(fallbackUrl);
        const fbData = await fbRes.json();
        
        // Random from top 5 trending
        winner = fbData.results[Math.floor(Math.random() * 5)];
        reason = `AI picks weren't streamable in ${userRegion}, so here is a Trending hit!`;
    } else {
        const providers = winnerProvider.flatrate || winnerProvider.rent || winnerProvider.buy;
        const providerName = providers ? providers[0].provider_name : "Streaming";
        reason = `Selected from AI list & Available on ${providerName}`;
    }

    // --- STEP 4: RETURN ---
    const resultObj = { 
        movie: winner, 
        aiContext: { 
            reason: reason,
            strategy: "proposer-validator",
            candidates_checked: candidates.length,
            source: cached ? 'cache-list' : 'ai-fresh'
        }
    };

    return res.status(200).json(resultObj);

  } catch (error) {
    console.error("🔥 HANDLER CRASH:", error);
    return res.status(500).json({ error: error.message });
  }
}
