import React, { useState } from 'react';
import { discover, getDetails, getImageUrl } from '../services/tmdb';
import MovieCard from '../components/MovieCard';
import VibeSelector from '../components/VibeSelector';
import { Sparkles, Dice5, ChevronLeft, Play, RefreshCw, AlertCircle } from 'lucide-react';

const CineSpin = () => {
  const [result, setResult] = useState(null);
  const [resultDetails, setResultDetails] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState(null);
  
  // New Vibe State
  const [selections, setSelections] = useState({
      duration: null,
      era: null,
      mood: null
  });

  const handleVibeSelect = (category, option) => {
      setSelections(prev => ({ ...prev, [category]: option }));
  };

  const startSpin = async () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    setError(null);

    try {
        // 1. Construct Filters from Vibes
        let apiFilters = {
            include_adult: false,
            include_video: false,
            sort_by: 'popularity.desc', // Bias towards good movies
            'vote_count.gte': 100, // Ensure decent data
        };

        // Merge selection values
        if (selections.duration) Object.assign(apiFilters, selections.duration.value);
        if (selections.era) Object.assign(apiFilters, selections.era.value);
        if (selections.mood) Object.assign(apiFilters, selections.mood.value);

        // 2. Fetch
        // Try random page to ensure variety
        const randomPage = Math.floor(Math.random() * 10) + 1;
        let results = await discover('movie', { ...apiFilters, page: randomPage });
        
        // Fallback to page 1 if empty
        if (!results || results.length === 0) {
            results = await discover('movie', { ...apiFilters, page: 1 });
        }

        if (results && results.length > 0) {
             const winner = results[Math.floor(Math.random() * results.length)];
             winner.media_type = 'movie'; // Default to movie for now
             
             // Fake Spin Delay for "Juiciness"
             await new Promise(r => setTimeout(r, 1500));
             
             const details = await getDetails('movie', winner.id);
             setResult(winner);
             setResultDetails(details);
        } else {
            throw new Error("No movies found for this vibe.");
        }

    } catch (e) {
        console.error("Spin failed", e);
        setError("Couldn't find a match. Try less specific vibes!");
    } finally {
        setSpinning(false);
    }
  };

  const reset = () => {
      setResult(null);
      setResultDetails(null);
      setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black text-white font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor (Cyberpunk Glow) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-pink-600/20 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
      </div>

      <div className="w-full max-w-4xl z-10 flex flex-col items-center">
        
        {/* VIEW 1: SELECTOR (If no result) */}
        {!result && (
            <>
                <div className="text-center mb-10 animate-in fade-in zoom-in duration-700">
                    <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-linear-to-r from-purple-400 via-pink-500 to-red-500 tracking-tighter drop-shadow-[0_0_30px_rgba(236,72,153,0.5)] mb-4">
                        What's the vibe?
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl font-medium">Don't scroll. Just spin.</p>
                </div>

                <VibeSelector selections={selections} onSelect={handleVibeSelect} />

                {error && (
                    <div className="mt-8 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 flex items-center gap-2 animate-in slide-in-from-bottom-2">
                        <AlertCircle size={20} /> {error}
                    </div>
                )}

                <div className="mt-12 mb-20">
                    <button
                        onClick={startSpin}
                        disabled={spinning}
                        className={`group relative px-12 py-6 rounded-full bg-linear-to-r from-accent to-purple-600 text-black font-black text-2xl tracking-widest uppercase transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_50px_rgba(0,229,255,0.4)] hover:shadow-[0_0_80px_rgba(236,72,153,0.6)] ${spinning ? 'animate-pulse' : ''}`}
                    >
                        {spinning ? (
                            <span className="flex items-center gap-3">
                                <Sparkles className="animate-spin" /> Deciding...
                            </span>
                        ) : (
                            <span className="flex items-center gap-3">
                                Decide For Me <Dice5 size={28} />
                            </span>
                        )}
                        
                        {/* Button Glow Ring */}
                        <div className="absolute -inset-1 rounded-full bg-linear-to-r from-accent to-pink-500 blur opacity-30 group-hover:opacity-100 transition duration-500"></div>
                    </button>
                </div>
            </>
        )}

        {/* VIEW 2: RESULT */}
        {result && resultDetails && (
            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-500">
                
                {/* Result Card (Massive) */}
                <div className="relative w-full max-w-sm md:max-w-md aspect-2/3 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border-4 border-gray-900 group">
                     <img 
                        src={getImageUrl(result.poster_path, 'w780')} 
                        alt={result.title}
                        className="w-full h-full object-cover"
                     />
                     
                     {/* Overlay Content */}
                     <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black via-black/80 to-transparent pt-20 pb-8 px-6 text-center">
                         <h2 className="text-3xl font-black text-white leading-tight mb-2">{result.title}</h2>
                         <p className="text-gray-300 line-clamp-2 text-sm mb-6 font-medium">{result.overview}</p>
                         
                         <div className="flex flex-col gap-3">
                             {/* Watch Now */}
                             <a 
                                href={`https://www.themoviedb.org/movie/${result.id}/watch`} // Simplified JustWatch link via TMDB
                                target="_blank"
                                rel="noreferrer" 
                                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-accent transition-colors flex items-center justify-center gap-2"
                             >
                                 <Play fill="currentColor" size={18} /> Watch Now
                             </a>
                             
                             {/* Spin Again */}
                             <div className="flex gap-3">
                                 <button 
                                     onClick={startSpin}
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
