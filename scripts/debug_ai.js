
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function testPrompt(prompt) {
  console.log(`\n--- Testing: "${prompt}" ---`);
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
      console.error("No API Key found");
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

  try {
      const start = Date.now();
      const result = await model.generateContent(systemInstruction);
      const output = JSON.parse(result.response.text());
      const end = Date.now();
      
      console.log(`Time: ${end - start}ms`);
      console.log("Raw Output:", JSON.stringify(output, null, 2));
      
      if (output.strategy === 'search') {
          console.log("Strategy: SEARCH -> Correct for specific franchise.");
      } else {
          console.log("Strategy: DISCOVER -> WRONG for specific franchise!");
      }

  } catch (error) {
      console.error("Error:", error);
  }
}

testPrompt("Pick one of the Avengers movies");
