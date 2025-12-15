export default async function handler(req, res) {
  try {
    const API_KEY = process.env.VITE_TMDB_API_KEY;
    if (!API_KEY) {
      throw new Error('Missing API Key');
    }

    // Fetch trending movies
    const response = await fetch(
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`
    );
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error('No results found');
    }

    // Get the first movie's backdrop or poster
    const movie = data.results[0];
    const imagePath = movie.backdrop_path || movie.poster_path;

    if (!imagePath) {
      // Fallback to a static default if API fails or no image
      return res.redirect(307, 'https://cine-quest.vercel.app/app-icon.png');
    }

    // Redirect to the actual image URL
    // w1280 is a good size for social cards
    const imageUrl = `https://image.tmdb.org/t/p/w1280${imagePath}`;
    
    // Set cache control for performance (cache for 1 hour)
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    
    return res.redirect(307, imageUrl);
  } catch (error) {
    console.error('OG Image Error:', error);
    // Fallback on error
    return res.redirect(307, 'https://cine-quest.vercel.app/app-icon.png');
  }
}
