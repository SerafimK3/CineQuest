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

export const discover = async (type, params) => {
  const response = await tmdb.get(`/discover/${type}`, { params });
  return response.data.results.filter(movie => movie.poster_path && movie.backdrop_path);
};

export const searchMovies = async (query) => {
  const response = await tmdb.get('/search/movie', {
    params: { query },
  });
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

export const getImageUrl = (path, size = 'original') => {
    if (!path) return '';
    return `https://image.tmdb.org/t/p/${size}${path}`;
}

export default tmdb;
