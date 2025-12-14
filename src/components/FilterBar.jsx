import React, { useEffect, useState } from 'react';
import { getGenres } from '../services/tmdb';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FilterBar = ({ onFilterChange }) => {
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [minRuntime, setMinRuntime] = useState(0);
  const [maxRuntime, setMaxRuntime] = useState(400);
  const [minRating, setMinRating] = useState(0);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [isGenreOpen, setIsGenreOpen] = useState(false);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const genreList = await getGenres('movie');
        setGenres(genreList);
      } catch (error) {
        console.error("Failed to fetch genres:", error);
      }
    };
    fetchGenres();
  }, []);

  // Debounce filter updates to avoid too many API calls while sliding
  useEffect(() => {
    const timer = setTimeout(() => {
      const filters = {
        with_genres: selectedGenres.join(','),
        'with_runtime.gte': minRuntime,
        'with_runtime.lte': maxRuntime,
        'vote_average.gte': minRating,
      };

      if (yearFrom) {
        filters['primary_release_date.gte'] = `${yearFrom}-01-01`;
      }
      if (yearTo) {
        filters['primary_release_date.lte'] = `${yearTo}-12-31`;
      }

      onFilterChange(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedGenres, minRuntime, maxRuntime, minRating, yearFrom, yearTo]);

  const handleGenreToggle = (genreId) => {
    const updatedGenres = selectedGenres.includes(genreId)
      ? selectedGenres.filter(id => id !== genreId)
      : [...selectedGenres, genreId];
    setSelectedGenres(updatedGenres);
  };

  return (
    <div className="bg-surface p-6 rounded-lg mb-6 shadow-lg border border-gray-800">
      <h3 className="text-xl font-bold mb-6 text-text-primary border-b border-gray-700 pb-2">Filters</h3>
      
      {/* Genre Section */}
      <div className="mb-6 border-b border-gray-700 pb-6 last:border-0 last:pb-0">
        <button 
          onClick={() => setIsGenreOpen(!isGenreOpen)}
          className="w-full flex justify-between items-center text-text-primary font-semibold mb-4 hover:text-accent transition"
        >
          <span>Genres {selectedGenres.length > 0 && <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full ml-2">{selectedGenres.length}</span>}</span>
          {isGenreOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {isGenreOpen && (
          <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-200">
            {genres.map(genre => (
              <div 
                key={genre.id} 
                onClick={() => handleGenreToggle(genre.id)}
                className={`cursor-pointer p-2 rounded transition text-sm text-center select-none ${
                    selectedGenres.includes(genre.id) 
                    ? 'text-accent font-bold bg-accent/10' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {genre.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Year Section */}
      <div className="mb-6 border-b border-gray-700 pb-6 last:border-0 last:pb-0">
        <h4 className="text-text-primary font-semibold mb-4">Release Year</h4>
        <div className="flex gap-4">
          <div className="w-1/2">
            <input
              type="number"
              placeholder="From"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              className="w-full bg-gray-700 text-text-primary px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-accent border border-gray-600 placeholder-gray-500"
              min="1900"
              max="2099"
            />
          </div>
          <div className="w-1/2">
            <input
              type="number"
              placeholder="To"
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              className="w-full bg-gray-700 text-text-primary px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-accent border border-gray-600 placeholder-gray-500"
              min="1900"
              max="2099"
            />
          </div>
        </div>
      </div>

      {/* Runtime Section */}
      <div className="mb-6 border-b border-gray-700 pb-6 last:border-0 last:pb-0">
        <h4 className="text-text-primary font-semibold mb-4">Runtime</h4>
        <div className="px-1">
          <div className="flex justify-between text-xs text-text-secondary mb-2">
            <span>{minRuntime}m</span>
            <span>{maxRuntime}m</span>
          </div>
          <div className="space-y-4">
              <div>
                  <label className="text-xs text-gray-500 mb-1 block">Minimum</label>
                  <input
                      type="range"
                      min="0"
                      max="400"
                      value={minRuntime}
                      onChange={(e) => setMinRuntime(Number(e.target.value))}
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent"
                  />
              </div>
              <div>
                  <label className="text-xs text-gray-500 mb-1 block">Maximum</label>
                  <input
                      type="range"
                      min="0"
                      max="400"
                      value={maxRuntime}
                      onChange={(e) => setMaxRuntime(Number(e.target.value))}
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent"
                  />
              </div>
          </div>
        </div>
      </div>

      {/* Rating Section */}
      <div>
        <h4 className="text-text-primary font-semibold mb-4 flex justify-between">
          <span>Min Rating</span>
          <span className="text-accent">{minRating}+</span>
        </h4>
        <div className="px-1">
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent"
          />
          <div className="flex justify-between text-xs text-text-secondary mt-2">
            <span>0</span>
            <span>10</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
