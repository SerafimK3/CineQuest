import React, { useState, useEffect, useCallback } from 'react';
import { discoverWithPagination, searchMovies } from '../services/tmdb';
import MovieCard from '../components/MovieCard';
import FilterBar from '../components/FilterBar';
import { useRegion } from '../contexts/RegionContext';

const Discover = () => {
  const { userRegion } = useRegion();
  const [movies, setMovies] = useState([]);
  const [totalPages, setTotalPages] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [filters, setFilters] = useState({
    sort_by: 'popularity.desc',
    include_adult: false,
    include_video: false,
    page: 1,
  });

  // Stable Fetch Function
  const fetchMovies = useCallback(async (currentFilters, append = false) => {
    console.log(`🎬 Fetching: P${currentFilters.page} Append=${append} Query="${searchQuery}"`);
    setLoading(true);
    try {
      let data;
      
      const { media_type = 'movie', ...apiFilters } = currentFilters;
      
      if (searchQuery.trim()) {
          const searchType = media_type === 'all' ? 'multi' : media_type;
          // Pass apiFilters (Genre, Rating, Year etc) to the Search Engine
          data = await searchMovies(searchQuery, currentFilters.page, searchType, apiFilters);
      } else {
          const type = media_type === 'all' ? 'movie' : media_type; 
          
          if (type === 'tv') {
              // ... TV mapping logic remains same, abstracted or inline ...
              if (apiFilters['primary_release_date.gte']) {
                  apiFilters['first_air_date.gte'] = apiFilters['primary_release_date.gte'];
                  delete apiFilters['primary_release_date.gte'];
              }
              if (apiFilters['primary_release_date.lte']) {
                  apiFilters['first_air_date.lte'] = apiFilters['primary_release_date.lte'];
                  delete apiFilters['primary_release_date.lte'];
              }
          }
          
          data = await discoverWithPagination(type, apiFilters, userRegion);
      }
      
      if (append) {
        let addedCount = 0;
        setMovies(prev => {
          const newMovies = data.results.filter(newMovie => !prev.some(m => m.id === newMovie.id));
          addedCount = newMovies.length;
          console.log(`➕ Appending ${newMovies.length} movies.`);
          return [...prev, ...newMovies];
        });
        
        // Recursion check (using currentFilters from arg, safe)
        if (!searchQuery && data.results.length === 0 && currentFilters.page < data.total_pages) {
             // We can't update state inside here easily without triggering re-render, 
             // but fetchMovies is recursive-friendly if we pass args.
             // We need to update filters state too? Yes.
             // setFilters is safe. 
             const nextFilters = { ...currentFilters, page: currentFilters.page + 1 };
             setFilters(nextFilters); 
             setTimeout(() => fetchMovies(nextFilters, true), 100); 
        }

      } else {
        console.log(`🔄 Replacing list with ${data.results.length} items`);
        setMovies(data.results);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error("Failed to fetch movies:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, userRegion]); // Dependencies: searchQuery, userRegion. 

  // Debounce Search Trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      console.log("🔍 Search Effect Trigger:", searchQuery);
      if (searchQuery.trim().length === 0) {
           if (movies.length === 0 || searchQuery === '') {
                fetchMovies({ ...filters, page: 1 });
           }
      } 
      else if (searchQuery.length >= 3) {
        setFilters(prev => ({ ...prev, page: 1 }));
        fetchMovies({ ...filters, page: 1 });
      }
    }, 800); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, fetchMovies]); // fetchMovies is now stable

  // Initial fetch & Region Change
  useEffect(() => {
    if (!searchQuery) {
        fetchMovies(filters);
    }
  }, [userRegion, fetchMovies]); 

  // Handler to passed to FilterBar - MUST BE STABLE
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => {
        const updatedFilters = { ...prev, ...newFilters, page: 1 };
        fetchMovies(updatedFilters, false);
        return updatedFilters;
    });
  }, [fetchMovies]);

  const handleLoadMore = useCallback(() => {
    setFilters(prev => {
        const nextPage = prev.page + 1;
        const updatedFilters = { ...prev, page: nextPage };
        fetchMovies(updatedFilters, true);
        return updatedFilters;
    });
  }, [fetchMovies]);

  // Filters Visibility (Mobile/Tablet)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full lg:w-1/4">
           {/* Mobile Toggle Button */}
           <button 
             onClick={() => setIsFiltersOpen(!isFiltersOpen)}
             className="w-full lg:hidden flex justify-between items-center bg-surface border border-gray-700 px-6 py-4 rounded-xl text-text-primary font-bold mb-4 shadow-lg active:scale-[0.98] transition-all"
           >
              <span className="flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                 Filters
              </span>
              <span className={`transform transition-transform duration-300 ${isFiltersOpen ? 'rotate-180' : 'rotate-0'}`}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </span>
           </button>

           {/* Collapsible Container */}
           <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isFiltersOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'} lg:grid-rows-[1fr] lg:block`}>
             <div className="overflow-hidden">
                <FilterBar onFilterChange={handleFilterChange} />
             </div>
           </div>
        </div>

        {/* Results Grid */}
        <div className="w-full lg:w-3/4">
          <h1 className="text-3xl font-bold mb-6 text-text-primary">Discover Movies</h1>
          
          {/* SEARCH BAR */}
          <div className="relative mb-8">
            <input 
                type="text" 
                placeholder="Search specific titles (min 3 chars)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-gray-700 rounded-xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors shadow-sm"
            />
            {/* Search Icon (Optional CSS or unicode) */}
             <div className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
             </div>
          </div>

          {movies.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {movies.map(movie => (
                  <MovieCard 
                    key={movie.id} 
                    movie={movie} 
                    type={movie.media_type || (filters.media_type === 'tv' ? 'tv' : 'movie')} 
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
              {searchQuery ? `No results for "${searchQuery}"` : "No movies found."}
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
