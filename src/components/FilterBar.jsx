import React, { useEffect, useState } from 'react';
import { getGenres, getCountries } from '../services/tmdb';
import { ChevronDown, ChevronUp, Globe, Clock, Calendar, Star } from 'lucide-react';

// Countries with known active film industries to avoid empty results
const RELEVANT_COUNTRY_CODES = [
  'US', 'GB', 'FR', 'DE', 'JP', 'KR', 'IN', 'CN', 'ES', 'IT', 'CA', 'AU', 'BR', 'MX', 
  'SE', 'DK', 'NO', 'NL', 'PL', 'RU', 'IE', 'GR', 'HK', 'TW', 'TH', 'ID', 'PH', 
  'AR', 'CO', 'NZ', 'IR', 'TR', 'IL', 'EG', 'ZA', 'NG', 'BE', 'AT', 'CH', 'CZ',
  'FI', 'HU', 'PT', 'RO', 'UA' 
];

const FilterBar = ({ onFilterChange }) => {
  const [genres, setGenres] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  
  // Runtime (Dual Slider State)
  const [minRuntime, setMinRuntime] = useState(0);
  const [maxRuntime, setMaxRuntime] = useState(300);
  
  const [minRating, setMinRating] = useState(0);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  
  const [isGenreOpen, setIsGenreOpen] = useState(false);

  // Media Type Selection Logic
  const [mediaType, setMediaType] = useState('all'); // all, movie, tv
  const handleMediaTypeChange = (type) => {
      // If clicking the already selected type, unselect it (go to 'all')
      if (mediaType === type) {
          setMediaType('all');
      } else {
          setMediaType(type);
      }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [genreList, countryList] = await Promise.all([
            getGenres('movie'),
            getCountries()
        ]);
        setGenres(genreList);
        
        // Filter out countries without significant film output and sort
        const validCountries = countryList
            .filter(c => RELEVANT_COUNTRY_CODES.includes(c.iso_3166_1))
            .sort((a, b) => a.english_name.localeCompare(b.english_name));
            
        setCountries(validCountries);
      } catch (error) {
        console.error("Failed to fetch filter data:", error);
      }
    };
    fetchData();
  }, []);

  // Debounce filter updates
  useEffect(() => {
    const timer = setTimeout(() => {
      const filters = {
        media_type: mediaType, 
        with_genres: selectedGenres.join(',') || undefined,
        'with_runtime.gte': minRuntime,
        'with_runtime.lte': maxRuntime,
        'vote_average.gte': minRating > 0 ? minRating : undefined,
        'with_origin_country': selectedCountry || undefined,
        'primary_release_date.gte': yearFrom ? `${yearFrom}-01-01` : undefined,
        'primary_release_date.lte': yearTo ? `${yearTo}-12-31` : undefined,
      };

      onFilterChange(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedGenres, minRuntime, maxRuntime, minRating, yearFrom, yearTo, selectedCountry, mediaType]);

  const handleGenreToggle = (genreId) => {
    const updatedGenres = selectedGenres.includes(genreId)
      ? selectedGenres.filter(id => id !== genreId)
      : [...selectedGenres, genreId];
    setSelectedGenres(updatedGenres);
  };
  
  // Logic for dual thumb slider
  const handleMinRuntimeChange = (e) => {
      const value = Math.min(Number(e.target.value), maxRuntime - 10);
      setMinRuntime(value);
  };

  const handleMaxRuntimeChange = (e) => {
      const value = Math.max(Number(e.target.value), minRuntime + 10);
      setMaxRuntime(value);
  };




  return (
    <div className="bg-surface rounded-lg mb-6 shadow-lg border border-gray-800 text-sm">
      
      {/* 0. Media Type Row */}
      <div className="p-4 border-b border-gray-700">
         <h4 className="text-gray-400 text-xs font-bold uppercase mb-3 flex items-center gap-2">
            <Globe size={12} /> Media Type
         </h4>
         <div className="flex gap-2">
             <button 
                onClick={() => handleMediaTypeChange('movie')}
                className={`flex-1 py-2 rounded-md font-bold transition-all border ${mediaType === 'movie' ? 'bg-accent text-black border-accent' : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'}`}
             >
                 Movies
             </button>
             <button 
                onClick={() => handleMediaTypeChange('tv')}
                className={`flex-1 py-2 rounded-md font-bold transition-all border ${mediaType === 'tv' ? 'bg-accent text-black border-accent' : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'}`}
             >
                 Series
             </button>
         </div>
      </div>

      {/* 1. Country & Genres Row */}
      <div className="p-4 border-b border-gray-700">
        <label className="text-gray-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
            <Globe size={12} /> Origin Country
        </label>
        <select 
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-700 focus:outline-none focus:border-accent"
        >
            <option value="">All Countries</option>
            {countries.map(c => (
                <option key={c.iso_3166_1} value={c.iso_3166_1}>{c.english_name}</option>
            ))}
        </select>
      </div>

      <div className="p-4 border-b border-gray-700">
        <button 
          onClick={() => setIsGenreOpen(!isGenreOpen)}
          className="w-full flex justify-between items-center text-white font-semibold hover:text-accent transition"
        >
          <span className="flex items-center gap-2 text-xs uppercase text-gray-400 font-bold">
             Filter by Genre {selectedGenres.length > 0 && <span className="bg-accent text-white px-1.5 rounded-full text-[10px]">{selectedGenres.length}</span>}
          </span>
          {isGenreOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        
        {isGenreOpen && (
          <div className="grid grid-cols-2 gap-1.5 mt-3 animate-in slide-in-from-top-2">
            {genres.map(genre => (
              <div 
                key={genre.id} 
                onClick={() => handleGenreToggle(genre.id)}
                className={`cursor-pointer px-2 py-1.5 rounded transition text-xs text-center select-none border ${
                    selectedGenres.includes(genre.id) 
                    ? 'text-accent border-accent bg-accent/10 font-bold' 
                    : 'text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200'
                }`}
              >
                {genre.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Compact Grid for Sliders */}
      <div className="p-4 space-y-5">
        
        {/* Release Year */}
        <div>
            <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-bold uppercase">
                <Calendar size={12} /> Release Year
            </div>
            <div className="flex gap-2">
                <input
                  type="number" placeholder="From"
                  value={yearFrom} onChange={(e) => setYearFrom(e.target.value)}
                  className="w-1/2 bg-gray-900 px-2 py-1.5 rounded border border-gray-700 focus:border-accent text-xs"
                />
                <input
                  type="number" placeholder="To"
                  value={yearTo} onChange={(e) => setYearTo(e.target.value)}
                  className="w-1/2 bg-gray-900 px-2 py-1.5 rounded border border-gray-700 focus:border-accent text-xs"
                />
            </div>
        </div>

        {/* Runtime (Dual Slider) */}
        <div>
            <div className="flex justify-between mb-2">
                <span className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase"><Clock size={12} /> Runtime</span>
                <span className="text-xs text-accent font-bold">{minRuntime}m - {maxRuntime}m</span>
            </div>
            <div className="relative w-full h-8">
                {/* Track Background */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-700 rounded-lg -translate-y-1/2"></div>
                {/* Active Range Highlight */}
                <div 
                    className="absolute top-1/2 h-1 bg-accent rounded-lg -translate-y-1/2 pointer-events-none"
                    style={{ 
                        left: `${(minRuntime / 300) * 100}%`, 
                        right: `${100 - (maxRuntime / 300) * 100}%` 
                    }}
                ></div>

                {/* Min Slider */}
                <input
                    type="range" min="0" max="300"
                    value={minRuntime} onChange={handleMinRuntimeChange}
                    className="absolute w-full h-full opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
                    style={{ zIndex: minRuntime > 290 ? 20 : 10 }} // z-index trick if overlaps
                />
                 {/* Visible Thumb Min */}
                 <div 
                    className="absolute top-1/2 w-4 h-4 bg-white border-2 border-accent rounded-full -translate-y-1/2 -ml-2 pointer-events-none shadow-md"
                    style={{ left: `${(minRuntime / 300) * 100}%` }}
                 ></div>

                {/* Max Slider */}
                <input
                    type="range" min="0" max="300"
                    value={maxRuntime} onChange={handleMaxRuntimeChange}
                    className="absolute w-full h-full opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
                />
                {/* Visible Thumb Max */}
                <div 
                    className="absolute top-1/2 w-4 h-4 bg-white border-2 border-accent rounded-full -translate-y-1/2 -ml-2 pointer-events-none shadow-md"
                    style={{ left: `${(maxRuntime / 300) * 100}%` }}
                 ></div>
            </div>
        </div>

        {/* Rating */}
        <div>
            <div className="flex justify-between mb-1">
                <span className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase"><Star size={12} /> Min IDMb Score</span>
                <span className="text-xs text-yellow-400 font-bold">{minRating}+</span>
            </div>
            <input
                type="range" min="0" max="10" step="0.5"
                value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
            />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
