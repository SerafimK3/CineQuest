import React, { useEffect, useState } from 'react';
import { getGenres, getCountries, getWatchProviders, getImageUrl } from '../services/tmdb';
import { ChevronDown, ChevronUp, Globe, Clock, Calendar, Star, Tv } from 'lucide-react';
import SearchableDropdown from './SearchableDropdown';

// Countries with known active film industries/consumer base
const RELEVANT_COUNTRY_CODES = [
  'US', 'GB', 'FR', 'DE', 'JP', 'KR', 'IN', 'CN', 'ES', 'IT', 'CA', 'AU', 'BR', 'MX', 
  'SE', 'DK', 'NO', 'NL', 'PL', 'RU', 'IE', 'GR', 'HK', 'TW', 'TH', 'ID', 'PH', 
  'AR', 'CO', 'NZ', 'IR', 'TR', 'IL', 'EG', 'ZA', 'NG', 'BE', 'AT', 'CH', 'CZ',
  'FI', 'HU', 'PT', 'RO', 'UA' 
];

const FilterBar = ({ onFilterChange }) => {
  const [genres, setGenres] = useState([]);
  const [countries, setCountries] = useState([]);
  const [providers, setProviders] = useState([]);
  
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('US'); // Default to US for better UX
  const [selectedProviders, setSelectedProviders] = useState([]);
  
  // Runtime (Dual Slider State)
  const [minRuntime, setMinRuntime] = useState(0);
  const [maxRuntime, setMaxRuntime] = useState(300);
  
  const [minRating, setMinRating] = useState(0);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const [isProvidersOpen, setIsProvidersOpen] = useState(false);

  // Media Type Selection Logic
  const [mediaType, setMediaType] = useState('all'); // all, movie, tv
  const handleMediaTypeChange = (type) => {
      if (mediaType === type) {
          setMediaType('all');
      } else {
          setMediaType(type);
      }
  };

  useEffect(() => {
    // 1. Fetch Static Data (Countries)
    const fetchCountries = async () => {
      try {
        const countryList = await getCountries();
        
        // Filter out countries without significant film output and sort
        const validCountries = countryList
            .filter(c => RELEVANT_COUNTRY_CODES.includes(c.iso_3166_1))
            .sort((a, b) => a.english_name.localeCompare(b.english_name));
            
        setCountries(validCountries);
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      }
    };
    fetchCountries();
  }, []);

  // 2. Fetch Dynamic Data (Genres) based on Media Type
  useEffect(() => {
      const fetchGenres = async () => {
          try {
              const type = mediaType === 'tv' ? 'tv' : 'movie';
              const genreList = await getGenres(type);
              setGenres(genreList);
              setSelectedGenres([]); // Clear when type changes
          } catch (error) {
              console.error("Failed to fetch genres:", error);
          }
      };
      
      fetchGenres();
  }, [mediaType]);

  // 3. Fetch Watch Providers based on Region and Media Type
  useEffect(() => {
      const fetchProviders = async () => {
          try {
              if (!selectedCountry) return;
              const type = mediaType === 'tv' ? 'tv' : 'movie';
              const providerList = await getWatchProviders(type, selectedCountry);
              
              // Sort by priority (display_priority)
              const sortedProviders = providerList.sort((a, b) => a.display_priority - b.display_priority);
              setProviders(sortedProviders);
              setSelectedProviders([]); // Clear providers when region/type changes
          } catch (error) {
              console.error("Failed to fetch providers:", error);
          }
      };
      fetchProviders();
  }, [mediaType, selectedCountry]);

  // Debounce filter updates
  useEffect(() => {
    const timer = setTimeout(() => {
      const filters = {
        media_type: mediaType, 
        with_genres: selectedGenres.join(',') || undefined,
        'with_runtime.gte': minRuntime,
        'with_runtime.lte': maxRuntime,
        'vote_average.gte': minRating > 0 ? minRating : undefined,
        
        // Changed Concept: Origin Country -> Watch Region
        watch_region: selectedCountry || undefined, // Required for providers
        with_watch_providers: selectedProviders.join('|') || undefined, // Pipe separated for OR logic
        // We use OR (pipe) because usually users want "Movies on Netflix OR Hulu"
        
        'primary_release_date.gte': yearFrom ? `${yearFrom}-01-01` : undefined,
        'primary_release_date.lte': yearTo ? `${yearTo}-12-31` : undefined,
      };

      onFilterChange(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedGenres, selectedProviders, minRuntime, maxRuntime, minRating, yearFrom, yearTo, selectedCountry, mediaType]);

  const handleGenreToggle = (genreId) => {
    const updated = selectedGenres.includes(genreId)
      ? selectedGenres.filter(id => id !== genreId)
      : [...selectedGenres, genreId];
    setSelectedGenres(updated);
  };

  const handleProviderToggle = (providerId) => {
    const updated = selectedProviders.includes(providerId)
      ? selectedProviders.filter(id => id !== providerId)
      : [...selectedProviders, providerId];
    setSelectedProviders(updated);
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

  // Transform countries for dropdown
  const countryOptions = countries.map(c => ({ value: c.iso_3166_1, label: c.english_name }));

  return (
    <div className="bg-surface rounded-xl mb-6 shadow-xl border border-gray-800/50 text-sm overflow-hidden backdrop-blur-sm">
      
      {/* 0. Media Type Row */}
      <div className="p-4 border-b border-gray-800">
         <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
            <Globe size={12} className="text-accent" /> Media Type
         </h4>
         <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800">
             <button 
                onClick={() => handleMediaTypeChange('movie')}
                className={`flex-1 py-2 rounded-md font-bold text-xs transition-all duration-300 ${mediaType === 'movie' ? 'bg-accent text-black shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
             >
                 Movies
             </button>
             <button 
                onClick={() => handleMediaTypeChange('tv')}
                className={`flex-1 py-2 rounded-md font-bold text-xs transition-all duration-300 ${mediaType === 'tv' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
             >
                 Series
             </button>
         </div>
      </div>

      {/* 1. Watch Region & Providers */}
      <div className="p-4 border-b border-gray-800 space-y-4">
        <div>
            <label className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <Globe size={12} className="text-accent" /> Watch Region
            </label>
            <SearchableDropdown 
                options={countryOptions}
                value={selectedCountry}
                onChange={setSelectedCountry}
                placeholder="Select Region"
                icon={<Globe size={14} />}
            />
        </div>

        {/* Streaming Providers */}
        <div>
             <button 
              onClick={() => setIsProvidersOpen(!isProvidersOpen)}
              disabled={!selectedCountry}
              className={`w-full flex justify-between items-center font-semibold transition group ${!selectedCountry ? 'opacity-50 cursor-not-allowed' : 'text-white hover:text-accent'}`}
            >
              <span className="flex items-center gap-2 text-[10px] uppercase text-gray-400 font-black tracking-widest group-hover:text-accent transition-colors">
                 <Tv size={12} className="text-accent"/> Streaming Services {selectedProviders.length > 0 && <span className="bg-accent text-black px-1.5 py-0.5 rounded text-[9px]">{selectedProviders.length}</span>}
              </span>
              {isProvidersOpen ? <ChevronUp size={14} className="text-accent" /> : <ChevronDown size={14} />}
            </button>
            
            {isProvidersOpen && (
              <div className="grid grid-cols-3 gap-2 mt-3 animate-in fade-in slide-in-from-top-1 duration-200 max-h-60 overflow-y-auto p-1 custom-scrollbar">
                {providers.map(provider => (
                  <button 
                    key={provider.provider_id} 
                    onClick={() => handleProviderToggle(provider.provider_id)}
                    className={`relative p-2 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all group ${
                        selectedProviders.includes(provider.provider_id) 
                        ? 'bg-accent/10 border-accent shadow-[0_0_10px_rgba(0,229,255,0.2)]' 
                        : 'bg-gray-900 border-gray-700 hover:border-gray-500'
                    }`}
                  >
                     <img 
                        src={getImageUrl(provider.logo_path, 'w92')} 
                        alt={provider.provider_name}
                        className={`w-8 h-8 rounded-md object-cover transition-all ${selectedProviders.includes(provider.provider_id) ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`} 
                     />
                     <span className={`text-[9px] text-center font-bold leading-tight ${selectedProviders.includes(provider.provider_id) ? 'text-accent' : 'text-gray-400'}`}>
                         {provider.provider_name}
                     </span>
                  </button>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* 2. Genres */}
      <div className="p-4 border-b border-gray-800">
        <div>
            <button 
              onClick={() => setIsGenreOpen(!isGenreOpen)}
              className="w-full flex justify-between items-center text-white font-semibold hover:text-accent transition group"
            >
              <span className="flex items-center gap-2 text-[10px] uppercase text-gray-400 font-black tracking-widest group-hover:text-accent transition-colors">
                 Filter by Genre {selectedGenres.length > 0 && <span className="bg-accent text-black px-1.5 py-0.5 rounded text-[9px]">{selectedGenres.length}</span>}
              </span>
              {isGenreOpen ? <ChevronUp size={14} className="text-accent" /> : <ChevronDown size={14} />}
            </button>
            
            {isGenreOpen && (
              <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                {genres.map(genre => (
                  <button 
                    key={genre.id} 
                    onClick={() => handleGenreToggle(genre.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border select-none active:scale-95 ${
                        selectedGenres.includes(genre.id) 
                        ? 'bg-accent text-black border-accent shadow-[0_0_10px_rgba(0,229,255,0.3)]' 
                        : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* 3. Compact Grid for Sliders */}
      <div className="p-4 space-y-6 bg-gray-900/30">
        
        {/* Release Year */}
        <div>
            <div className="flex items-center gap-2 mb-2 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                <Calendar size={12} className="text-accent" /> Release Year
            </div>
            <div className="flex gap-2">
                <input
                  type="number" placeholder="From"
                  value={yearFrom} onChange={(e) => setYearFrom(e.target.value)}
                  className="w-1/2 bg-gray-900 px-3 py-2 rounded border border-gray-700 focus:border-accent text-xs text-white focus:outline-none transition-colors"
                />
                <input
                  type="number" placeholder="To"
                  value={yearTo} onChange={(e) => setYearTo(e.target.value)}
                  className="w-1/2 bg-gray-900 px-3 py-2 rounded border border-gray-700 focus:border-accent text-xs text-white focus:outline-none transition-colors"
                />
            </div>
        </div>

        {/* Runtime (Dual Slider) */}
        <div>
            <div className="flex justify-between mb-2">
                <span className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest"><Clock size={12} className="text-accent" /> Runtime</span>
                <span className="text-[10px] text-accent font-bold bg-accent/10 px-2 py-0.5 rounded">{minRuntime}m - {maxRuntime}m</span>
            </div>
            <div className="relative w-full h-8 flex items-center">
                {/* Track Background */}
                <div className="absolute w-full h-1.5 bg-gray-800 rounded-full"></div>
                {/* Active Range Highlight */}
                <div 
                    className="absolute h-1.5 bg-accent rounded-full pointer-events-none"
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
                    style={{ zIndex: minRuntime > 290 ? 20 : 10 }} 
                />
                 {/* Visible Thumb Min */}
                 <div 
                    className="absolute w-4 h-4 bg-black border-2 border-accent rounded-full -ml-2 pointer-events-none shadow-[0_0_10px_rgba(0,229,255,0.5)] transition-transform"
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
                    className="absolute w-4 h-4 bg-black border-2 border-accent rounded-full -ml-2 pointer-events-none shadow-[0_0_10px_rgba(0,229,255,0.5)] transition-transform"
                    style={{ left: `${(maxRuntime / 300) * 100}%` }}
                 ></div>
            </div>
        </div>

        {/* Rating */}
        <div>
            <div className="flex justify-between mb-2">
                <span className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest"><Star size={12} className="text-yellow-400" /> Min Score</span>
                <span className="text-[10px] text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">{minRating === 0 ? 'Any' : `${minRating}+`}</span>
            </div>
            <input
                type="range" min="0" max="10" step="0.5"
                value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-yellow-400 focus:outline-none"
            />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
