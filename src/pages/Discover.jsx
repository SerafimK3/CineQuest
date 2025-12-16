import React, { useState, useEffect } from 'react';
import { discoverWithPagination } from '../services/tmdb';
import MovieCard from '../components/MovieCard';
import FilterBar from '../components/FilterBar';
import { useRegion } from '../contexts/RegionContext';

const Discover = () => {
  const { userRegion } = useRegion();
  const [movies, setMovies] = useState([]);
  const [totalPages, setTotalPages] = useState(0); // Track max pages
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
      const type = media_type === 'all' ? 'movie' : media_type; 

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

      const data = await discoverWithPagination(type, apiFilters, userRegion);
      
      if (append) {
        // Filter unique
        let addedCount = 0;
        setMovies(prev => {
          const newMovies = data.results.filter(newMovie => !prev.some(m => m.id === newMovie.id));
          addedCount = newMovies.length;
          return [...prev, ...newMovies];
        });

        // RECURSION CHECK: If we got results from API but filtered them all out (addedCount 0), 
        // and we have more pages, try next page immediately.
        if (data.results.length === 0 && apiFilters.page < data.total_pages) {
            console.log("Empty page found, skipping to next...");
            const nextFilters = { ...currentFilters, page: currentFilters.page + 1 };
            setFilters(nextFilters);
            // Small delay to prevent stack overflow/rapid fire
            setTimeout(() => fetchMovies(nextFilters, true), 100); 
        }

      } else {
        setMovies(data.results);
        setTotalPages(data.total_pages);
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
  }, [userRegion]); // Re-fetch when region changes

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
              
              {filters.page < totalPages && (
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
                        'Show More'
                      )}
                    </button>
                  </div>
              )}
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
