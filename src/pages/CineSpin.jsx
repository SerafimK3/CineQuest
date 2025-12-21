import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { discover, getDetails, getImageUrl } from '../services/tmdb';
import MovieCard from '../components/MovieCard';
import VibeSelector from '../components/VibeSelector';
import { saveSpin } from '../utils/history';
import { useRegion } from '../contexts/RegionContext';
import { Sparkles, Dice5, ChevronLeft, Play, RefreshCw, AlertCircle, Film, Tv } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';

const CineSpin = () => {
  const location = useLocation();
  const { userRegion } = useRegion();
  const posthog = usePostHog();
  const [result, setResult] = useState(null);
  const [resultDetails, setResultDetails] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState(null);
  
  // Media Type State (movie or tv)
  const [mediaType, setMediaType] = useState('movie');
  
  // Vibe State - includes all filter categories
  const [selections, setSelections] = useState({
      duration: null,    // Movies only
      status: null,      // TV only  
      era: null,         // Both
      genre: null        // Both
  });
  const [seenIds, setSeenIds] = useState(new Set()); // Track session duplicates

  const handleVibeSelect = (category, option) => {
      setSelections(prev => ({ ...prev, [category]: option }));
  };

  // Check for auto-spin from VibeCoder on mount
  useEffect(() => {
      if (location.state?.autoSpin && location.state?.injectedFilters && !spinning && !result) {
          startSpin(location.state.injectedFilters);
      }
  }, [location.state]);

  const startSpin = async (customFilters = null) => {
    if (spinning) return;
    
    setSpinning(true);
    setResult(null);
    setError(null);

    // Defer heavy logic
    setTimeout(async () => {
        try {
            // 1. Construct Filters
            let apiFilters = {
                include_adult: false,
                include_video: false,
                sort_by: 'popularity.desc', 
                'vote_count.gte': 100, 
            };

            // Use injected OR current selections
            if (customFilters && Object.keys(customFilters).length > 0) {
                Object.assign(apiFilters, customFilters);
            } else {
                // Movie filters
                if (mediaType === 'movie' && selections.duration) {
                    Object.assign(apiFilters, selections.duration.value);
                }
                // TV filters
                if (mediaType === 'tv' && selections.status) {
                    Object.assign(apiFilters, selections.status.value);
                }
                // Shared filters
                if (selections.era) {
                    // Only use the relevant date field for the media type
                    const eraFilters = {};
                    if (mediaType === 'movie') {
                        if (selections.era.value['primary_release_date.gte']) eraFilters['primary_release_date.gte'] = selections.era.value['primary_release_date.gte'];
                        if (selections.era.value['primary_release_date.lte']) eraFilters['primary_release_date.lte'] = selections.era.value['primary_release_date.lte'];
                    } else {
                        if (selections.era.value['first_air_date.gte']) eraFilters['first_air_date.gte'] = selections.era.value['first_air_date.gte'];
                        if (selections.era.value['first_air_date.lte']) eraFilters['first_air_date.lte'] = selections.era.value['first_air_date.lte'];
                    }
                    Object.assign(apiFilters, eraFilters);
                }
                if (selections.genre) {
                    Object.assign(apiFilters, selections.genre.value);
                }
            }

            // 2. Fetch with Retries for uniqueness
            // Include regional availability filter
            if (userRegion) {
                apiFilters.watch_region = userRegion;
                apiFilters.with_watch_monetization_types = 'flatrate|free|ads|rent|buy';
            }
            
            let winner = null;
            let attempts = 0;
            
            while (!winner && attempts < 3) {
                const randomPage = Math.floor(Math.random() * 10) + 1;
                let results = await discover(mediaType, { ...apiFilters, page: randomPage }, userRegion);
                
                // Fallback page 1
                if (!results || results.length === 0) {
                    results = await discover(mediaType, { ...apiFilters, page: 1 }, userRegion);
                }

                if (results && results.length > 0) {
                    // Filter out seen
                    const candidates = results.filter(m => !seenIds.has(m.id));
                    
                    if (candidates.length > 0) {
                        winner = candidates[Math.floor(Math.random() * candidates.length)];
                    }
                }
                attempts++;
            }

            if (winner) {
                winner.media_type = mediaType;
                
                // Fake Spin Delay
                await new Promise(r => setTimeout(r, 1500));
                
                const details = await getDetails(mediaType, winner.id);
                setResult(winner);
                setResultDetails(details);
                setSeenIds(prev => new Set(prev).add(winner.id));
                
                saveSpin(winner);

                // Track Spin Success
                posthog?.capture('spin_completed', {
                    genre: selections.genre?.id,
                    era: selections.era?.id,
                    duration: selections.duration?.id,
                    status: selections.status?.id,
                    mediaType: mediaType,
                    movie: winner.title || winner.name,
                    movie_id: winner.id
                });
            } else {
                throw new Error("No new movies found.");
            }

        } catch (e) {
            console.error("Spin failed", e);
            setError("Couldn't find a match. Try less specific vibes!");
        } finally {
            setSpinning(false);
        }
    }, 0);
  };

  const reset = () => {
      setResult(null);
      setResultDetails(null);
      setError(null);
      // Clear all filters and history for a fresh start
      setSelections({ duration: null, status: null, era: null, genre: null }); 
      setSeenIds(new Set()); 
  };

  // Reset selections when switching media type
  const handleMediaTypeChange = (newType) => {
      if (newType !== mediaType) {
          setMediaType(newType);
          setSelections({ duration: null, status: null, era: null, genre: null });
      }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black text-white font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[60px]"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-pink-600/20 rounded-full blur-[60px] delay-1000"></div>
      </div>

      <div className="w-full max-w-4xl z-10 flex flex-col items-center">
        
        {/* VIEW 0: SEARCHING (Fullscreen Spinner) */}
        {spinning && (
            <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                 <div className="relative mb-8">
                     <div className="absolute inset-0 bg-accentBlur rounded-full blur-xl animate-pulse"></div>
                     <Sparkles size={64} className="text-accent animate-spin-slow relative z-10" />
                 </div>
                 <h2 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-500 animate-pulse">
                     Consulting the Oracle...
                 </h2>
            </div>
        )}

        {/* VIEW 1: SELECTOR (Only if NOT result AND NOT spinning) */}
        {!result && !spinning && (
            <>
                <div className="text-center mb-10 animate-in fade-in zoom-in duration-700">
                    <h1 className="text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-linear-to-r from-purple-400 via-pink-500 to-red-500 tracking-tighter drop-shadow-[0_0_30px_rgba(236,72,153,0.5)] mb-4">
                        What's the vibe?
                    </h1>
                    <p className="text-gray-400 text-lg lg:text-xl font-medium">Don't scroll. Just spin.</p>
                </div>

                {/* Media Type Toggle */}
                <div className="flex justify-center mb-8 animate-in fade-in duration-500">
                    <div className="bg-gray-900 rounded-full p-1 flex gap-1 border border-gray-800">
                        <button
                            onClick={() => handleMediaTypeChange('movie')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
                                mediaType === 'movie'
                                    ? 'bg-accent text-black shadow-lg shadow-accent/30'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Film size={18} /> Movies
                        </button>
                        <button
                            onClick={() => handleMediaTypeChange('tv')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
                                mediaType === 'tv'
                                    ? 'bg-accent text-black shadow-lg shadow-accent/30'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Tv size={18} /> Series
                        </button>
                    </div>
                </div>

                <VibeSelector selections={selections} onSelect={handleVibeSelect} mediaType={mediaType} />

                {error && (
                    <div className="mt-8 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 flex items-center gap-2 animate-in slide-in-from-bottom-2">
                        <AlertCircle size={20} /> {error}
                    </div>
                )}

                <div className="mt-12 mb-20">
                    <button
                        onClick={() => startSpin(null)}
                        className={`group relative px-12 py-6 rounded-full bg-linear-to-r from-accent to-purple-600 text-black font-black text-2xl tracking-widest uppercase transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(0,229,255,0.4)] hover:shadow-[0_0_80px_rgba(236,72,153,0.6)]`}
                    >
                        <span className="flex items-center gap-3">
                            Decide For Me <Dice5 size={28} />
                        </span>
                        
                        {/* Button Glow Ring */}
                        <div className="absolute -inset-1 rounded-full bg-linear-to-r from-accent to-pink-500 blur opacity-30 group-hover:opacity-100 transition duration-500"></div>
                    </button>
                </div>
            </>
        )}

        {/* VIEW 2: RESULT */}
        {result && resultDetails && !spinning && (
            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-500">
                
                {/* Result Card (Massive) */}
                <div className="relative w-full max-w-sm lg:max-w-md aspect-2/3 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border-4 border-gray-900 group">
                     <img 
                        src={getImageUrl(result.poster_path, 'w780')} 
                        alt={result.title}
                        width="500"
                        height="750"
                        fetchPriority="high"
                        className="w-full h-full object-cover"
                     />
                     
                     {/* Overlay Content */}
                     <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black via-black/80 to-transparent pt-20 pb-8 px-6 text-center">
                         <h2 className="text-3xl font-black text-white leading-tight mb-2">{result.title}</h2>
                         <p className="text-gray-300 line-clamp-2 text-sm mb-6 font-medium">{result.overview}</p>
                         
                         <div className="flex flex-col gap-3">
                             {/* Watch Page (Internal) */}
                             <Link 
                                to={`/${mediaType}/${result.id}-${(result.title || result.name || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`} 
                                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-accent transition-colors flex items-center justify-center gap-2"
                             >
                                 <Play fill="currentColor" size={18} /> View Details
                             </Link>
                             
                             {/* Spin Again */}
                             <div className="flex gap-3">
                                 <button 
                                     onClick={() => startSpin(null)}
                                     className="flex-1 py-4 bg-gray-800 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                                 >
                                     <RefreshCw size={18} /> Spin Again
                                 </button>
                                 <button 
                                     onClick={reset}
                                     className="py-4 px-6 bg-gray-900 text-gray-400 rounded-xl hover:text-white transition-colors"
                                 >
                                     <ChevronLeft size={24} />
                                 </button>
                             </div>
                         </div>
                     </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default CineSpin;
