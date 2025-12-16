
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function benchmark() {
  console.log("🏎️  Starting Speed Test...");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { console.error("No API Key"); return; }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash", 
      generationConfig: { response_mime_type: "application/json" }
  });

  const prompt = "Pick one of the Avengers movies";
  const start = Date.now();

  try {
      const result = await model.generateContent(prompt);
      const output = JSON.parse(result.response.text());
      const aiEnd = Date.now();
      
      console.log(`⏱️ AI Latency: ${aiEnd - start}ms`);

      // Mock TMDB Fetch (Search)
      const tmdbKey = process.env.VITE_TMDB_API_KEY;
      const query = encodeURIComponent(output.query || "Avengers");
      const u = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbKey}&query=${query}&language=en-US`;
      
      const r = await fetch(u);
      await r.json();
      
      const totalEnd = Date.now();
      const totalDuration = totalEnd - start;

      console.log(`✅ Total Duration (AI + TMDB): ${totalDuration}ms`);
      
      if (totalDuration > 3500) {
          console.log(`⚠️ CRITICAL: Total time EXCEEDS 3.5s timeout!`);
      } else {
          console.log(`🚀 Total Fits!`);
      }

  } catch (error) {
      console.error("❌ Error:", error.message);
  }
}

benchmark();
