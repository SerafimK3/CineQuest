import { GoogleGenerativeAI } from '@google/generative-ai';

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

    // --- STEP 1: PROPOSER (AI) ---
    // Ask for a simple array of strings. Harder to break.
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: { response_mime_type: "application/json" } 
    });
    
    // Explicit Instruction for List format
    const systemPrompt = `
      Task: Recommend 10 movies matching this vibe: "${prompt}".
      Output: JSON Array of strings (Exact English Titles).
      Rules: 
      1. No explanations. 
      2. If user mentions a franchise ("All Avengers"), list them ALL.
      3. Precise English Titles only.
      
      Example Output: ["The Matrix", "Inception", "Interstellar"]
    `;

    console.log("🤖 Asking Gemini for candidates...");
    const aiResult = await model.generateContent(systemPrompt);
    const text = aiResult.response.text();
    
    let candidates = [];
    try {
        // Robust Extraction
        const jsonMatch = text.match(/\[[\s\S]*\]/); 
        if (!jsonMatch) throw new Error("No List found");
        candidates = JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.error("AI Parse Failed:", text);
        // Fallback list to at least try something
        candidates = ["Parasite", "Whiplash", "Mad Max: Fury Road", "The Grand Budapest Hotel", "Spider-Man: Into the Spider-Verse"];
    }

    // --- SHUFFLE STEP ---
    // Prevent "Order Bias" (always picking the first movie in a franchise list)
    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    console.log(`📋 AI Candidates (${candidates.length} - Shuffled):`, candidates);

    // --- STEP 2: VALIDATOR (Code) ---
    // We check batches to be fast but sequential enough to stop early.
    let winner = null;
    let winnerProvider = null;
    const BATCH_SIZE = 3;

    // Helper to check one movie
    const checkAvailability = async (title) => {
        try {
            // A. Search ID
            const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbKey}&query=${encodeURIComponent(title)}`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();
            
            if (!searchData.results || searchData.results.length === 0) return null;
            const movie = searchData.results[0];

            // B. Check Providers in Region
            const providerUrl = `https://api.themoviedb.org/3/movie/${movie.id}/watch/providers?api_key=${tmdbKey}`;
            const providerRes = await fetch(providerUrl);
            const providerData = await providerRes.json();
            
            const regionData = providerData.results && providerData.results[userRegion];
            
            // C. Criteria: Can we watch it? (Stream, Rent, or Buy)
            if (regionData && (regionData.flatrate || regionData.rent || regionData.buy)) {
                return { movie, provider: regionData };
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
    return res.status(200).json({ 
        movie: winner, 
        aiContext: { 
            reason: reason,
            strategy: "proposer-validator",
            candidates_checked: candidates.length
        }
    });

  } catch (error) {
    console.error("🔥 HANDLER CRASH:", error);
    return res.status(500).json({ error: error.message });
  }
}
