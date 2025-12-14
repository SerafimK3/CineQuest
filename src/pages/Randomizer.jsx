import React, { useState } from 'react';
import { discover } from '../services/tmdb';
import MovieCard from '../components/MovieCard';
import FilterBar from '../components/FilterBar';
import { Shuffle } from 'lucide-react';

const Randomizer = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(1);
  const [filters, setFilters] = useState({
    include_adult: false,
    include_video: false,
  });

  const handleRandomize = async () => {
    setLoading(true);
    setMovies([]);
    try {
      // First, get the total number of pages for these filters
      // We only need the first page to know the total_pages (or just guess like before)
      const randomPage = Math.floor(Math.random() * 50) + 1;
      let results = await discover('movie', { ...filters, page: randomPage });
      
      if (results.length === 0) {
        // Fallback to page 1
        results = await discover('movie', { ...filters, page: 1 });
      }

      if (results.length > 0) {
        // Shuffle the results array
        const shuffled = [...results].sort(() => 0.5 - Math.random());
        // Take the requested number of movies
        setMovies(shuffled.slice(0, Math.min(count, results.length)));
      }
    } catch (error) {
      console.error("Failed to randomize:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-text-primary flex items-center gap-2">
        <Shuffle /> Movie Randomizer
      </h1>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/4">
          <FilterBar onFilterChange={handleFilterChange} />
          
          <div className="bg-surface p-4 rounded-lg mb-4 border border-gray-800">
             <label className="text-text-secondary font-semibold mb-2 block">Number of Suggestions</label>
             <input 
                type="number" 
                min="1" 
                max="20" 
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value))))}
                className="w-full bg-gray-700 text-text-primary px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-accent border border-gray-600"
             />
          </div>

          <button
            onClick={handleRandomize}
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 px-4 rounded-lg transition flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <Shuffle size={20} />
                <span>Randomize</span>
              </>
            )}
          </button>
        </div>

        <div className="w-full md:w-3/4">
          {movies.length > 0 ? (
            <div>
              <h2 className="text-xl text-text-secondary mb-6 text-center">
                We found {movies.length} gems for you:
              </h2>
              <div className={movies.length === 1 ? "flex justify-center" : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6"}>
                 {movies.map(movie => (
                    <div key={movie.id} className={movies.length === 1 ? "w-full max-w-sm" : ""}>
                       <MovieCard movie={movie} />
                    </div>
                 ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-text-secondary mt-20">
              {loading ? (
                 <p className="text-xl">Rolling the dice...</p>
              ) : (
                 <p className="text-xl">Set your filters, choose how many, and click Randomize!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Randomizer;
