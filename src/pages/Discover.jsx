import React, { useState, useEffect } from 'react';
import { discover } from '../services/tmdb';
import MovieCard from '../components/MovieCard';
import FilterBar from '../components/FilterBar';

const Discover = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    sort_by: 'popularity.desc',
    include_adult: false,
    include_video: false,
    page: 1,
  });

  const fetchMovies = async (currentFilters, append = false) => {
    setLoading(true);
    try {
      const { media_type = 'movie', ...apiFilters } = currentFilters;
      const type = media_type === 'all' ? 'movie' : media_type; // Default to movie if 'all' passed, though FilterBar toggles logic

      // Remap params for TV
      if (type === 'tv') {
          if (apiFilters['primary_release_date.gte']) {
              apiFilters['first_air_date.gte'] = apiFilters['primary_release_date.gte'];
              delete apiFilters['primary_release_date.gte'];
          }
          if (apiFilters['primary_release_date.lte']) {
              apiFilters['first_air_date.lte'] = apiFilters['primary_release_date.lte'];
              delete apiFilters['primary_release_date.lte'];
          }
      }

      const results = await discover(type, apiFilters);
      if (append) {
        setMovies(prev => {
          const newMovies = results.filter(newMovie => !prev.some(m => m.id === newMovie.id));
          return [...prev, ...newMovies];
        });
      } else {
        setMovies(results);
      }
    } catch (error) {
      console.error("Failed to discover movies:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMovies(filters);
  }, []);

  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    fetchMovies(updatedFilters, false);
  };

  const handleLoadMore = () => {
    const nextPage = filters.page + 1;
    const updatedFilters = { ...filters, page: nextPage };
    setFilters(updatedFilters);
    fetchMovies(updatedFilters, true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full md:w-1/4">
          <FilterBar onFilterChange={handleFilterChange} />
        </div>

        {/* Results Grid */}
        <div className="w-full md:w-3/4">
          <h1 className="text-3xl font-bold mb-6 text-text-primary">Discover Movies</h1>
          
          {movies.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {movies.map(movie => (
                  <MovieCard 
                    key={movie.id} 
                    movie={movie} 
                    type={filters.media_type === 'tv' ? 'tv' : 'movie'} 
                  />
                ))}
              </div>
              
              <div className="flex justify-center pb-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="bg-surface hover:bg-gray-700 text-text-primary font-semibold py-3 px-8 rounded-full transition shadow-lg border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                      Loading...
                    </>
                  ) : (
                    'Show 20 More'
                  )}
                </button>
              </div>
            </>
          ) : !loading && (
            <div className="text-center text-text-secondary py-12">
              No movies found matching your criteria.
            </div>
          )}

          {loading && movies.length === 0 && (
             <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discover;
