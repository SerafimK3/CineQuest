import axios from 'axios';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

const tmdb = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
    language: 'en-US',
  },
});

export const getTrending = async (type = 'all', timeWindow = 'day', page = 1) => {
  const response = await tmdb.get(`/trending/${type}/${timeWindow}`, {
    params: { page },
  });
  return response.data.results.filter(movie => movie.poster_path && movie.backdrop_path);
};

export const getGenres = async (type = 'movie') => {
  const response = await tmdb.get(`/genre/${type}/list`);
  return response.data.genres;
};

export const discover = async (type, params, region = null) => {
  const finalParams = { ...params };
  
  if (region) {
      finalParams.watch_region = region;
      finalParams.with_watch_monetization_types = 'flatrate|free|ads|rent|buy';
  }

  const response = await tmdb.get(`/discover/${type}`, { params: finalParams });
  return response.data.results.filter(movie => movie.poster_path && movie.backdrop_path);
};

export const searchMovies = async (query, region = null) => {
  const params = { query };
  
  // NOTE: Search endpoint doesn't support watch_region filtering natively in V3 without discover magic.
  // We will assume search just finds the movie, and we filter availability on the Client or just let it be.
  // However, users asked for "filters only for that country".
  // True "Search with Region" usually requires 2 steps: Search -> Get ID -> Check Availability.
  // For MVP, we will stick to basic search but prioritized by popularity which correlates.
  // OR: We can use 'discover' with 'with_text_query' if available (not standard V3).
  // Implementation Decision: For direct "Search", we return all results. The availability check happens on Details page.
  // BUT: For "Discover/AI", we MUST filter.

  const response = await tmdb.get('/search/movie', { params });
  return response.data.results.filter(movie => movie.poster_path && movie.backdrop_path);
};

export const getDetails = async (type, id) => {
  const response = await tmdb.get(`/${type}/${id}`, {
    params: {
      append_to_response: 'watch/providers,videos,credits,reviews,similar',
    },
  });
  return response.data;
};

export const getConfiguration = async () => {
    const response = await tmdb.get('/configuration');
    return response.data;
}

export const getCountries = async () => {
    const response = await tmdb.get('/configuration/countries');
    return response.data;
};

export const getWatchProviders = async (type = 'movie', region = 'US') => {
    const response = await tmdb.get(`/watch/providers/${type}`, {
        params: { watch_region: region }
    });
    return response.data.results;
};

export const getImageUrl = (path, size = 'original') => {
    if (!path) return '';
    return `https://image.tmdb.org/t/p/${size}${path}`;
}

export default tmdb;
