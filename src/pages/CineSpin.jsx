import React, { useState, useEffect, useRef } from 'react';
import { discover, getTrending, getImageUrl, getDetails } from '../services/tmdb';
import MovieCard from '../components/MovieCard';
import FilterBar from '../components/FilterBar';
import { Settings, Sparkles, Dices, X, Quote, Star } from 'lucide-react';

const CineSpin = () => {
  const [result, setResult] = useState(null);
  const [resultDetails, setResultDetails] = useState(null);
  const [resultType, setResultType] = useState('movie'); 
  const [spinning, setSpinning] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [shiftLeft, setShiftLeft] = useState(false); 
  const [showWinnerBadge, setShowWinnerBadge] = useState(false); 
  const [showResult, setShowResult] = useState(false);
  const [noResults, setNoResults] = useState(false); // New state for empty results
  
  // Data for the 'reel' animation
  const [reelMovies, setReelMovies] = useState([]);
  
  const [filters, setFilters] = useState({
    media_type: 'all',
    include_adult: false,
    include_video: false,
  });

  // Load reel images (Trending) with simple retry
  useEffect(() => {
    let attempts = 0;
    const loadReel = async () => {
        try {
            const data = await getTrending('all', 'week'); 
            if (data && data.length > 0) {
                // Optimization: Limit duplication to avoid DOM heaviness
                const limitedData = data.slice(0, 15); 
                setReelMovies([...limitedData, ...limitedData]); // Just double for loop 
            } else {
                throw new Error("No trending data");
            }
        } catch (e) {
            console.error("Failed to load reel images", e);
            if (attempts < 2) {
                attempts++;
                setTimeout(loadReel, 1500); // Retry after delay
            }
        }
    };
    loadReel();
  }, []);

  const startSpin = async () => {
    if (spinning) return;
    
    setSpinning(true);
    setResult(null);
    setResultDetails(null);
    setShowResult(false); 
    setShiftLeft(false); 
    setShowWinnerBadge(false); 
    setNoResults(false); // Reset error state
    setShowSidebar(false); 

    let shiftTimer = null;
    let badgeTimer = null;
    let badgeHideTimer = null;

    try {
        // 1. Determine Type
        let typeToFetch = filters.media_type;
        if (typeToFetch === 'all' || !typeToFetch) {
            typeToFetch = Math.random() > 0.5 ? 'movie' : 'tv';
        }
        setResultType(typeToFetch);

        // 2. Prepare Params
        const apiFilters = { ...filters };
        delete apiFilters.media_type; 
        
        if (typeToFetch === 'tv') {
            if (apiFilters['primary_release_date.gte']) {
                apiFilters['first_air_date.gte'] = apiFilters['primary_release_date.gte'];
                delete apiFilters['primary_release_date.gte'];
            }
            if (apiFilters['primary_release_date.lte']) {
                apiFilters['first_air_date.lte'] = apiFilters['primary_release_date.lte'];
                delete apiFilters['primary_release_date.lte'];
            }
        }

        // Start Shift Timer (Visual only)
        shiftTimer = setTimeout(() => setShiftLeft(true), 1200);

        // 3. Parallel Execution: Wait Min Time + Fetch Data
        const minSpinPromise = new Promise(resolve => setTimeout(resolve, 2200));
        
        const fetchPromise = (async () => {
            const randomPage = Math.floor(Math.random() * 20) + 1;
            let results = await discover(typeToFetch, { ...apiFilters, page: randomPage });
            if (!results || results.length === 0) results = await discover(typeToFetch, { ...apiFilters, page: 1 });
            
            if (results && results.length > 0) {
                 const winner = results[Math.floor(Math.random() * results.length)];
                 winner.media_type = typeToFetch;
                 // Fetch details immediately to be ready
                 try {
                     const details = await getDetails(typeToFetch, winner.id);
                     return { winner, details };
                 } catch (e) {
                     // Details fetch failed, using basic info
                     return { winner, details: winner };
                 }
            }
            return null;
        })();

        const [_, data] = await Promise.all([minSpinPromise, fetchPromise]);

        if (data) {
             setResultDetails(data.details);
             setResult(data.winner);
             
             // Stop Spin
             setSpinning(false);
             
             // Trigger Result Animation
             setTimeout(() => setShowResult(true), 50);

             // Show Badge
             badgeTimer = setTimeout(() => setShowWinnerBadge(true), 100);
             badgeHideTimer = setTimeout(() => setShowWinnerBadge(false), 3100);

        } else {
            throw new Error("No results found");
        }

    } catch (error) {
       console.error("Spin error:", error);
       setSpinning(false);
       setShiftLeft(false); 
       clearTimeout(shiftTimer);
       setNoResults(true); // Show in-UI error message
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const reviews = resultDetails?.reviews?.results?.slice(0, 2) || [];

  return (
    <div className="flex h-[calc(100vh-64px)] relative overflow-hidden bg-black font-sans">
      
      {/* 1. Sidebar Filter Panel */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-80 bg-gray-900/95 backdrop-blur-xl border-r border-gray-800 transform transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : '-translate-x-full'} pt-20 px-6 pb-6 overflow-y-auto shadow-2xl`}
      >
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white"><Settings /> Configure Spin</h2>
              <button onClick={() => setShowSidebar(false)} className="p-2 hover:bg-gray-800 rounded-full text-gray-400">
                  <X size={20} />
              </button>
          </div>
          <FilterBar onFilterChange={handleFilterChange} />
      </aside>

      {/* Sidebar Toggle Button */}
      <button 
        onClick={() => setShowSidebar(!showSidebar)}
        className={`fixed left-4 top-24 z-50 bg-gray-800/80 backdrop-blur border border-gray-700 p-3 rounded-full text-white hover:bg-accent hover:text-black transition-all shadow-lg ${showSidebar ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        title="Open Filters"
      >
          <Settings size={24} />
      </button>

      {/* Click-Outside Overlay */}
      {showSidebar && (
        <div 
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] cursor-pointer"
            onClick={() => setShowSidebar(false)}
        />
      )}

      {/* 2. Main Stage */}
      <main className={`flex-1 flex flex-col items-center justify-center p-2 md:p-4 transition-all duration-300 ${showSidebar ? 'ml-80 opacity-50' : ''}`}>
        
        {/* Title */}
        <div className="text-center mb-4 shrink-0 transition-all duration-500">
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-purple-400 via-pink-500 to-red-500 tracking-tighter drop-shadow-[0_0_80px_rgba(236,72,153,0.3)] filter">
                CINE SPIN
            </h1>
        </div>

        {/* Content Wrapper (Slot + Details) */}
        {/* Using justify-center allows natural shifting when width grows */}
        {/* Responsive Height: Larger on mobile (70vh), balanced on desktop */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-7xl h-[65vh] md:h-[60vh] transition-all duration-700">
            
            {/* Slot Machine Window */}
            <div className={`relative h-full aspect-2/3 max-w-[360px] shrink-0 group perspective-1000 z-20 transition-all duration-1000 ease-in-out`}>
                {/* Frame */}
                {/* Dynamic Glow for Winner vs Spinner */}
                <div className={`absolute -inset-1 rounded-3xl opacity-50 blur-xl transition-all duration-500 ${spinning ? 'bg-linear-to-b from-purple-600 to-blue-600 animate-pulse opacity-100' : ''} ${result ? 'bg-linear-to-b from-yellow-400 to-orange-500 opacity-80 blur-2xl' : ''}`}></div>
                
                <div className={`relative w-full h-full bg-gray-950 rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all duration-500 ${result ? 'border-4 border-yellow-400/50 shadow-[0_0_50px_rgba(234,179,8,0.3)]' : 'border-[6px] border-gray-800 ring-1 ring-white/10'}`}>
                    
                    {/* IDLE state fallback if no reel movies yet */}
                    {!spinning && !result && !noResults && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 bg-gray-900/50">
                            <Dices size={64} className="mb-4 animate-bounce duration-3000" />
                            <span className="font-black text-xl tracking-widest opacity-50">PRESS SPIN</span>
                        </div>
                    )}
                    
                    {/* NO RESULTS STATE */}
                    {!spinning && noResults && (
                         <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-gray-900/80 p-6 text-center animate-in fade-in zoom-in duration-300">
                            <div className="bg-red-500/10 p-4 rounded-full mb-4 border border-red-500/30">
                                <X size={48} />
                            </div>
                            <h3 className="text-xl font-black text-white mb-2">The Reel Came Up Empty!</h3>
                            <p className="text-gray-400 text-sm mb-4">No movies matched your specific filters.</p>
                            <button 
                                onClick={() => setShowSidebar(true)}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-accent rounded-full text-sm font-bold transition-all border border-gray-700 hover:border-accent"
                            >
                                Adjust Filters
                            </button>
                        </div>
                    )}

                    {/* SPINNING */}
                    {spinning && (
                        <div className="absolute inset-0 w-full overflow-hidden">
                            <div className="w-full flex flex-col animate-reel-spin">
                                {reelMovies.length > 0 ? reelMovies.map((movie, i) => (
                                    <div key={i} className="w-full h-[60%] shrink-0 bg-gray-900">
                                        <img 
                                            src={getImageUrl(movie.poster_path, 'w342')} 
                                            className="w-full h-full object-cover opacity-80 blur-[2px] brightness-125"
                                            alt="" decoding="async"
                                        />
                                    </div>
                                )) : (
                                   /* Fallback if reel is empty */
                                   [1,2,3,4,5].map((_, i) => (
                                     <div key={i} className="w-full h-[60%] shrink-0 bg-linear-to-b from-gray-800 to-gray-900 border-b border-gray-700 flex items-center justify-center">
                                       <Film size={48} className="text-gray-700" />
                                     </div>
                                   ))
                                )}
                            </div>
                            <div className="absolute inset-0 bg-linear-to-b from-black/80 via-transparent to-black/80 z-10 pointer-events-none"></div>
                        </div>
                    )}

                    {/* RESULT */}
                    {!spinning && result && (
                        <div className={`absolute inset-0 transition-all duration-500 ease-out transform ${showResult ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                            <MovieCard movie={result} type={resultType} />
                            
                            {/* WINNER BADGE with transition */}
                            <div className={`absolute bottom-[35%] left-1/2 -translate-x-1/2 w-full flex justify-center z-20 pointer-events-none transition-all duration-1000 ease-out ${showWinnerBadge ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                <div className="bg-yellow-400/90 backdrop-blur-md text-black font-black px-8 py-2 rounded-full shadow-[0_0_30px_rgba(250,204,21,0.6)] flex items-center gap-2 border-2 border-yellow-200">
                                    <Sparkles size={18} className="animate-spin-slow" /> 
                                    <span className="tracking-widest text-sm md:text-base">WINNER</span>
                                    <Sparkles size={18} className="animate-spin-slow" />
                                </div>
                            </div>
                            
                            {/* MOBILE ONLY: Title & Rating Overlay (Since panel is hidden) */}
                            <div className="absolute top-0 inset-x-0 p-4 bg-linear-to-b from-black/90 to-transparent md:hidden z-10 text-center animate-in slide-in-from-top duration-500">
                                <h3 className="text-xl font-black text-white leading-tight drop-shadow-md mb-1">{result.title || result.name}</h3>
                                <div className="flex justify-center items-center gap-1 text-yellow-400 font-bold text-sm">
                                    <Star size={12} fill="currentColor"/> {result.vote_average?.toFixed(1)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Spin Button */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-30">
                    <button 
                        onClick={startSpin}
                        disabled={spinning}
                        className="group relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-linear-to-b from-red-500 to-red-700 shadow-[0_8px_0_rgb(153,27,27),0_15px_40px_rgba(220,38,38,0.4)] active:shadow-none active:translate-y-[8px] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-4 border-red-900"
                    >
                        <span className="font-black text-white text-lg md:text-xl tracking-widest drop-shadow-md group-hover:scale-110 transition-transform -rotate-12">
                            SPIN
                        </span>
                    </button>
                </div>
            </div>

            {/* DETAILS PANEL (Transitions Width) */}
            {/* We rely on the container flex to center everything. */}
            <div 
                className={`hidden md:block transition-all duration-1000 ease-in-out bg-surface rounded-2xl border-gray-800 shadow-2xl overflow-hidden h-full ${shiftLeft ? 'w-[400px] border opacity-100' : 'w-0 border-0 opacity-0'}`}
            >
                {/* Content only renders if we have data, but we keep container transitions even if loading data */}
                <div className="p-6 h-full w-[400px] overflow-y-auto">
                    {resultDetails ? (
                       <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                            <h2 className="text-3xl font-black mb-2 text-white leading-tight">
                                {resultDetails.title || resultDetails.name}
                            </h2>
                            <p className="text-accent font-bold mb-4 flex items-center gap-2">
                                <Star className="fill-current" size={16} /> {resultDetails.vote_average?.toFixed(1)}/10
                            </p>
                            
                            <p className="text-gray-300 leading-relaxed mb-6 border-b border-gray-800 pb-6">
                                {resultDetails.overview}
                            </p>

                            {reviews.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-widest">User Reactions</h3>
                                    {reviews.map((review, i) => (
                                        <div key={i} className="mb-4 bg-black/30 p-4 rounded-xl border border-gray-800/50">
                                            <div className="flex items-start gap-2 mb-2 text-gray-400">
                                                <Quote size={14} className="shrink-0 mt-1" />
                                                <p className="text-sm italic line-clamp-3">"{review.content}"</p>
                                            </div>
                                            <p className="text-xs text-right text-gray-500 font-bold">— {review.author}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                             <div className="flex justify-center mt-2 pb-20">
                                 <a href={`/${resultType}/${resultDetails.id}`} className="text-sm text-accent hover:underline">View Full Details</a>
                             </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <style jsx="true">{`
            @keyframes reel-spin {
                0% { transform: translateY(0); }
                100% { transform: translateY(-33.33%); } 
            }
            .animate-reel-spin {
                animation: reel-spin 0.6s linear infinite;
                will-change: transform;
            }
        `}</style>
      </main>
    </div>
  );
};

export default CineSpin;
