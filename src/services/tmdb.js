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

const filterValidMovies = (results) => {
    return results.filter(movie => movie.poster_path && movie.backdrop_path);
};

export const getTrending = async (type = 'all', timeWindow = 'day', page = 1) => {
  const response = await tmdb.get(`/trending/${type}/${timeWindow}`, {
    params: { page },
  });
  return filterValidMovies(response.data.results);
};

export const getGenres = async (type = 'movie') => {
  const response = await tmdb.get(`/genre/${type}/list`);
  return response.data.genres;
};

// Re-use pagination logic but return only results for backward compatibility
export const discover = async (type, params, region = null) => {
    const data = await discoverWithPagination(type, params, region);
    return data.results;
};

export const discoverWithPagination = async (type, params, region = null) => {
  const finalParams = { ...params };
  
  if (region) {
      finalParams.watch_region = region;
      finalParams.with_watch_monetization_types = 'flatrate|free|ads|rent|buy';
  }

  const response = await tmdb.get(`/discover/${type}`, { params: finalParams });
  
  return {
      results: filterValidMovies(response.data.results),
      total_results: response.data.total_results,
      total_pages: response.data.total_pages
  };
};

// Helper to sort by Weighted Relevance
// Logic: Rating (Quality) is the primary driver, with Structural Bonuses for exactness.
const smartSort = (results, query) => {
    const q = query.toLowerCase().trim();
    
    return results.map(item => {
        const title = (item.title || item.name || '').toLowerCase();
        let score = 0;
        
        // --- 1. Quality Boost (Rating) ---
        // Primary Driver: 0 to 10,000 points.
        if (item.vote_average) {
            score += (item.vote_average * 1000); 
        }

        // --- 2. Structural Relevance ---
        // Tie-Breakers / Specificity Bonuses
        if (title === q) {
            score += 2000; // Exact Match
        } else if (title.startsWith(q)) {
            score += 500;  // Starts With
        } else if (title.includes(` ${q}`)) { 
            score += 250;  // Word Match
        }
        
        // --- 3. Popularity Tie-Breaker ---
        if (item.popularity) {
            score += (item.popularity * 0.1);
        }
        
        return { item, score };
    })
    .sort((a, b) => b.score - a.score) 
    .map(entry => entry.item);
};

// --- 3. Keyword Chaining (The "Smart" Logic) ---
// --- 3. Keyword Chaining (The "Smart" Logic) ---
export const searchKeywords = async (query) => {
    try {
        const response = await tmdb.get('/search/keyword', {
            params: { query, page: 1 }
        });
        return response.data.results;
    } catch (error) {
        console.warn("Keyword search failed", error);
        return [];
    }
};

// Helper: Client-side filter for Search Results (since /search API lacks robust filters)
const applyClientSideFilters = (results, filters) => {
    return results.filter(movie => {
        // 1. Rating
        if (filters['vote_average.gte'] && movie.vote_average < filters['vote_average.gte']) return false;
        
        // 2. Runtime (if available in list results, sometimes it's not present without details?)
        // TMDB list results usually DON'T have runtime. We might skip this or fetch details (expensive).
        // Skipping runtime for text search to avoid N+1 fetches. Valid tradeoff.

        // 3. Genres (with_genres is "12,28")
        if (filters.with_genres) {
            const requiredGenres = filters.with_genres.split(',').map(Number);
            // Must have at least one or all? typically 'with_genres' means AND in discover, 
            // but effectively let's say "Must have at least one of selected" or "All"?
            // TMDB 'with_genres' is AND. 'with_genres=12,28' (Adventure AND Action).
            // 'with_genres=12|28' (Adventure OR Action).
            // FilterBar passes comma (AND).
            const hasAll = requiredGenres.every(g => movie.genre_ids && movie.genre_ids.includes(g));
            if (!hasAll) return false;
        }

        // 4. Region/Provider (Hard to filter client side without details). Skipping.

        // 5. Year
        if (filters['primary_release_date.gte']) {
            const year = parseInt(filters['primary_release_date.gte'].split('-')[0]);
            const movieYear = parseInt((movie.release_date || '').split('-')[0]);
            if (!movieYear || movieYear < year) return false;
        }
         if (filters['primary_release_date.lte']) {
            const year = parseInt(filters['primary_release_date.lte'].split('-')[0]);
            const movieYear = parseInt((movie.release_date || '').split('-')[0]);
            if (!movieYear || movieYear > year) return false;
        }

        return true;
    });
};

export const searchMovies = async (query, page = 1, type = 'movie', filters = {}) => {
  if (type !== 'movie' && type !== 'multi') {
       // Fallback for TV or strict type
       return basicSearch(query, page, type);
  }

  // PARALLEL REQUESTS
  // 1. Standard Title Search
  const titleSearchPromise = basicSearch(query, page, type);
  
  // 2. Keyword Search (concept searching)
  let keywordPromise = Promise.resolve(null);
  if (page === 1) {
      keywordPromise = searchKeywords(query);
  }

  const [titleResultsData, keywords] = await Promise.all([titleSearchPromise, keywordPromise]);
  
  let finalResults = titleResultsData.results;
  
  // Apply Client-Side Filters to Title Results (Since API didn't filter them)
  finalResults = applyClientSideFilters(finalResults, filters);
  
  // --- INTERCEPTOR LOGIC (Smart Graph Search) ---
  if (keywords && keywords.length > 0) {
      const bestKeyword = keywords.find(k => 
          k.name.toLowerCase() === query.toLowerCase() || 
          k.name.toLowerCase().startsWith(query.toLowerCase())
      );

      if (bestKeyword) {
          // Found a concept match
          
          try {
              // Fetch movies for this keyword
              // WE PASS FILTERS HERE! (Native API Support)
              // This ensures if you selected "Comedy", we only fetch "Concept Comedy" movies.
              const smartParams = {
                  ...filters, // Spread active filters (genres, years, rating)
                  with_keywords: bestKeyword.id,
                  sort_by: 'vote_average.desc', // Use Quality logic combined with filters
                  'vote_count.gte': 300, 
                  page: 1
              };
              
              // Remove params that clash or shouldn't be here?
              // `primary_release_date` is fine. `vote_average` is fine.
              
              const keywordMovies = await tmdb.get('/discover/movie', {
                  params: smartParams
              });
              
              const conceptResults = keywordMovies.data.results;
              
              // MERGE STRATEGY: Concept (Smart) > Title (Literal)
              const combined = [...conceptResults, ...finalResults];
              const uniqueMap = new Map();
              combined.forEach(m => {
                  if (!uniqueMap.has(m.id)) {
                      uniqueMap.set(m.id, m);
                  }
              });
              
              finalResults = Array.from(uniqueMap.values());
              
              // Use smart sort to order them
              finalResults = smartSort(finalResults, query);
              
          } catch (err) {
              console.warn("Keyword discovery failed", err);
          }
      }
  }

  return {
      results: finalResults, 
      total_results: titleResultsData.total_results, // Note: Total count might be inaccurate after client filtering
      total_pages: titleResultsData.total_pages
  };
};

// Original Search Wrapper (renamed)
const basicSearch = async (query, page, type) => {
  const params = { query, page };
  let endpoint = '/search/movie'; 
  
  if (type === 'tv') endpoint = '/search/tv';
  else if (type === 'all' || type === 'multi') endpoint = '/search/multi';
  
  const response = await tmdb.get(endpoint, { params });
  
  let rawResults = response.data.results.filter(item => {
      if (item.media_type === 'person') return false;
      return item.poster_path || item.backdrop_path;
  });

  return {
      results: smartSort(rawResults, query), 
      total_results: response.data.total_results,
      total_pages: response.data.total_pages
  };
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
