
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { prompt } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing API Key' }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemInstruction = `
      You are an expert movie recommender system. Your job is to translate natural language user requests ("vibes") into a structured JSON object compatible with The Movie Database (TMDB) API filters.
      
      Output ONLY raw JSON. No markdown. No comments.
      
      Target Structure:
      {
        "with_genres": "string (comma separated ids)",
        "primary_release_date.gte": "YYYY-MM-DD",
        "primary_release_date.lte": "YYYY-MM-DD",
        "sort_by": "popularity.desc or vote_average.desc",
        "vote_count.gte": number (default 100),
        "with_keywords": "string (pipe separated ids for OR logic, comma for AND)" 
        // Note: For keywords, do NOT invent them. Only use if absolutely sure of common IDs (e.g. 1701 for 'hero'). Prefer Genres and Dates.
      }

      Reference Genre IDs:
      Action: 28, Adventure: 12, Animation: 16, Comedy: 35, Crime: 80, Documentary: 99, Drama: 18, Family: 10751, Fantasy: 14, History: 36, Horror: 27, Music: 10402, Mystery: 9648, Romance: 10749, Science Fiction: 878, TV Movie: 10770, Thriller: 53, War: 10752, Western: 37.

      Examples:
      Input: "Scary 90s movie"
      Output: { "with_genres": "27", "primary_release_date.gte": "1990-01-01", "primary_release_date.lte": "1999-12-31" }

      Input: "Funny animated movie for kids"
      Output: { "with_genres": "35,16,10751" }
      
      Input: "Cyberpunk sci-fi like Blade Runner"
      Output: { "with_genres": "878", "sort_by": "vote_average.desc" }

      User Input: "${prompt}"
    `;

    const result = await model.generateContent(systemInstruction);
    const response = await result.response;
    let text = response.text();
    
    // Clean up markdown code blocks if the model puts them in
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const filters = JSON.parse(text);

    return new Response(JSON.stringify(filters), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate vibe' }), { status: 500 });
  }
}
