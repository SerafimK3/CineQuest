import React, { useState, useEffect } from 'react';
import { getTrending, getImageUrl, getDetails } from '../../services/tmdb';
import { ArrowUp, ArrowDown, RefreshCcw, Trophy, Check, X as XIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const CountUp = ({ end, duration = 1000 }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let startTime;
        let animationFrame;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            
            // Ease out quart
            const ease = 1 - Math.pow(1 - percentage, 4);
            
            setCount(Math.floor(end * ease));

            if (progress < duration) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return <span>{count.toLocaleString()}</span>;
};

const HigherLowerGame = () => {
    const [movies, setMovies] = useState([]);
    // Game State: 'loading', 'idle', 'revealing', 'sliding', 'gameover'
    const [gameState, setGameState] = useState('loading');
    const [score, setScore] = useState(0);
    const [topScore, setTopScore] = useState(() => parseInt(localStorage.getItem('higherLowerTopScore')) || 0);
    const [result, setResult] = useState(null); // 'correct' | 'wrong'

    const loadMovies = async (isRestart = false) => {
        if (isRestart || gameState !== 'sliding') setGameState('loading');
        try {
            // Fetch 3 random pages to get a large pool quickly
            const randomPage1 = Math.floor(Math.random() * 10) + 1;
            const randomPage2 = Math.floor(Math.random() * 10) + 11;
            
            const [data1, data2] = await Promise.all([
                 getTrending('movie', 'week', randomPage1),
                 getTrending('movie', 'week', randomPage2)
            ]);

            const combined = [...data1, ...data2];
            // Filter valid movies with posters
            const validMovies = combined.filter(m => m.poster_path);
            const shuffled = validMovies.sort(() => 0.5 - Math.random()).slice(0, 10);
            
            // Fetch details (including revenue) for each movie in parallel
            const moviesWithDetails = await Promise.all(
                shuffled.map(async (m) => {
                    try {
                        const details = await getDetails('movie', m.id);
                        return { ...m, revenue: details.revenue || 0 };
                    } catch {
                        return { ...m, revenue: 0 };
                    }
                })
            );
            
            // Filter only movies with significant box office ($10M+)
            const moviesWithRevenue = moviesWithDetails.filter(m => m.revenue >= 10000000);
            
            if (isRestart) {
                setMovies(moviesWithRevenue);
            } else {
                setMovies(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const newMovies = moviesWithRevenue.filter(m => !existingIds.has(m.id));
                    return [...prev, ...newMovies];
                });
            }

            setGameState(prev => prev === 'sliding' ? 'sliding' : 'idle');
        } catch (error) {
            console.error(error);
        }
    };

    // Initial Load
    useEffect(() => {
        loadMovies();
    }, []);

    // Automatic Refill
    useEffect(() => {
        if (movies.length > 0 && movies.length < 5 && gameState === 'idle') {
            loadMovies();
        }
    }, [movies.length, gameState]);

    // Preload next image to prevent stutter
    useEffect(() => {
        if (movies[2]) {
            const img = new Image();
            img.src = getImageUrl(movies[2].poster_path, 'w1280');
        }
    }, [movies]);

    const handleGuess = (guess) => {
        const currentCheck = movies[0];
        const nextCheck = movies[1];
        
        // Use Box Office Revenue for comparison
        const isHigher = nextCheck.revenue >= currentCheck.revenue;
        const isCorrect = (guess === 'higher' && isHigher) || (guess === 'lower' && !isHigher);

        setGameState('revealing');
        setResult(isCorrect ? 'correct' : 'wrong');

        if (isCorrect) {
            setScore(prev => prev + 1);
            // Wait for reveal (1.0s), then slide
            setTimeout(() => {
                setGameState('sliding');
                // Wait for slide (700ms), then reset
                setTimeout(() => {
                    setMovies(prev => prev.slice(1));
                    setGameState('idle');
                    setResult(null);
                    // Refill handled by useEffect now
                }, 700);
            }, 1000); 
        } else {
             // Wait for reveal then game over
             setTimeout(() => {
                if (score > topScore) {
                    setTopScore(score);
                    localStorage.setItem('higherLowerTopScore', score);
                }
                setGameState('gameover');
             }, 1500);
        }
    };

    const restartGame = () => {
        setScore(0);
        setMovies([]); // Clear movies to force reload
        setGameState('loading');
        setResult(null); // Clear previous result state
        loadMovies(true);
    };

    if (gameState === 'loading' && movies.length === 0) return (
        <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-black text-white">
            <div className="text-xl animate-pulse font-bold tracking-widest uppercase">Loading Challengers...</div>
        </div>
    );

    const currentMovie = movies[0];
    const nextMovie = movies[1];

    if (!currentMovie || !nextMovie) return null;

    return (
        <div className="h-[calc(100vh-64px)] bg-black text-white overflow-hidden relative font-sans w-full">
             {/* Game Over Overlay */}
             {gameState === 'gameover' && (
                <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <Trophy className="text-yellow-400 w-24 h-24 mb-6 animate-bounce" />
                    <h2 className="text-5xl font-black mb-4">Game Over</h2>
                    <p className="text-2xl text-gray-400 mb-8">Score: <span className="text-white font-bold">{score}</span></p>
                    <button onClick={restartGame} className="bg-accent hover:bg-accent-hover text-black font-black text-xl px-10 py-4 rounded-full hover:scale-105 transition flex items-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                        <RefreshCcw /> Play Again
                    </button>
                    <Link to="/games" className="mt-8 text-gray-500 hover:text-white underline tracking-widest uppercase text-sm">Back to Arcade</Link>
                </div>
            )}

            {/* Main Stage Container - Handles the Slide */}
            <div className={`flex flex-col md:flex-row w-full md:w-[150vw] h-[150%] md:h-full will-change-transform transform-gpu ${
                gameState === 'sliding' 
                    ? 'transition-transform duration-700 ease-in-out translate-y-[-33.33%] md:translate-y-0 md:translate-x-[-33.33%]' 
                    : 'transition-none duration-0 translate-y-0 md:translate-x-0'
            }`}>
                
                {movies.slice(0, 3).map((movie, index) => {
                    const isCurrent = index === 0;
                    const isNext = index === 1;
                    const isUpcoming = index === 2;

                    return (
                        <div key={movie.id} className="w-full md:w-[50vw] relative h-[33.33%] md:h-full border-b-4 md:border-b-0 md:border-r-4 border-black shrink-0">
                            
                            {/* Overlay Content */}
                            <div className={`absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center text-center p-4 md:p-8 transition-colors duration-500 ${isNext && result === 'correct' ? 'bg-green-900/80' : isNext && result === 'wrong' ? 'bg-red-900/80' : ''}`}>
                                
                                <h2 className="text-2xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-4 drop-shadow-lg leading-tight line-clamp-2">{movie.title}</h2>
                                
                                {/* 1. Result State (Current Movie or Revealed Next) */}
                                {(isCurrent || (isNext && result)) && (
                                    <div className="text-xl md:text-3xl text-accent font-bold animate-in zoom-in duration-300">
                                        <span className="text-gray-300 text-sm md:text-lg block mb-1 font-normal uppercase tracking-widest opacity-80">Box Office Revenue</span>
                                        <div className="text-4xl md:text-6xl drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">
                                            ${isNext && gameState === 'revealing' ? <CountUp end={Math.round(movie.revenue / 1000000)} /> : Math.round(movie.revenue / 1000000).toLocaleString()}M
                                        </div>
                                         {isNext && result === 'correct' && (
                                            <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-lg mt-2 animate-bounce">
                                                <Check size={24} /> Correct!
                                            </div>
                                        )}
                                        {isNext && result === 'wrong' && (
                                            <div className="flex items-center justify-center gap-2 text-red-400 font-bold text-lg mt-2 animate-shake">
                                                <XIcon size={24} /> Wrong!
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 2. Gameplay Actions (Next Movie Only + Idle) */}
                                {isNext && !result && (
                                    <div className="min-h-[150px] md:min-h-[200px] flex flex-col justify-center w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <span className="text-gray-300 text-sm md:text-lg block mb-2 md:mb-4 font-normal uppercase tracking-widest">has a</span>
                                        <div className="flex flex-col gap-3 md:gap-4 w-full px-8">
                                            <button 
                                                onClick={() => handleGuess('higher')}
                                                className="group bg-transparent border-4 border-green-500 hover:bg-green-500 text-white font-black text-lg md:text-2xl py-3 md:py-4 rounded-full transition-all duration-300 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 w-full"
                                            >
                                                <ArrowUp className="w-6 h-6 md:w-8 md:h-8 group-hover:-translate-y-1 transition-transform" strokeWidth={3} /> 
                                                HIGHER
                                            </button>
                                            <span className="text-[10px] md:text-xs tracking-[0.3em] uppercase opacity-50 font-bold">Box Office</span>
                                            <button 
                                                onClick={() => handleGuess('lower')}
                                                className="group bg-transparent border-4 border-red-500 hover:bg-red-500 text-white font-black text-lg md:text-2xl py-3 md:py-4 rounded-full transition-all duration-300 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 w-full"
                                            >
                                                <ArrowDown className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-y-1 transition-transform" strokeWidth={3} />
                                                LOWER
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* 3. Upcoming (Waiting) */}
                                {isUpcoming && (
                                    <div className="text-gray-500 font-bold uppercase tracking-widest animate-pulse">
                                        Up Next
                                    </div>
                                )}
                            </div>
                            <img src={getImageUrl(movie.poster_path, 'w1280')} decoding="async" className="w-full h-full object-cover opacity-50" alt={movie.title} />
                        </div>
                    );
                })}
            </div>

            {/* VS Badge - Absolute Center */}
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-white text-black font-black w-12 h-12 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-xl border-4 border-black text-xl md:text-3xl transition-transform duration-300 ${gameState !== 'idle' ? 'scale-0' : 'scale-100'}`}>
                VS
            </div>

             {/* Score Overlay */}
             <div className="absolute top-4 right-4 z-30 bg-black/80 px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl border border-white/10 text-right shadow-2xl">
                <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest font-bold">Streak</div>
                <div className="text-xl md:text-3xl font-black text-accent">{score}</div>
            </div>
        </div>
    );
};

export default HigherLowerGame;
