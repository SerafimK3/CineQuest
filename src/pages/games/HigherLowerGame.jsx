import React, { useState, useEffect } from 'react';
import { getTrending, getImageUrl } from '../../services/tmdb';
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
            // Filter 0 ratings and Shuffle
            const validMovies = combined.filter(m => m.vote_count > 0 && m.poster_path);
            const shuffled = validMovies.sort(() => 0.5 - Math.random());
            
            if (isRestart) {
                setMovies(shuffled);
            } else {
                setMovies(prev => {
                    // Prevent duplicates when appending
                    const existingIds = new Set(prev.map(m => m.id));
                    const newMovies = shuffled.filter(m => !existingIds.has(m.id));
                    return [...prev, ...newMovies];
                });
            }

            setGameState(prev => prev === 'sliding' ? 'sliding' : 'idle');
        } catch (error) {
            console.error(error);
            // If failed, try again or show error (for now silent retry could loop, let's just stick to error log)
            // Ideally we'd set an error state here.
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
        
        // Use Vote Count (Fame) instead of Popularity (Trending)
        const isHigher = nextCheck.vote_count >= currentCheck.vote_count;
        const isCorrect = (guess === 'higher' && isHigher) || (guess === 'lower' && !isHigher);

        setGameState('revealing');
        setResult(isCorrect ? 'correct' : 'wrong');

        if (isCorrect) {
            setScore(prev => prev + 1);
            // Wait for reveal (1.0s), then slide
            setTimeout(() => {
                setGameState('sliding');
                // Wait for slide (600ms), then reset
                setTimeout(() => {
                    setMovies(prev => prev.slice(1));
                    setGameState('idle');
                    setResult(null);
                    // Refill handled by useEffect now
                }, 600);
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

            {/* Main Stage Container - Handles the Slide (Desktop Only) */}
            <div className={`flex flex-col md:flex-row w-full md:w-[200vw] h-full transition-transform duration-700 ease-out will-change-transform transform-gpu ${gameState === 'sliding' ? 'md:-translate-x-[100vw]' : 'md:translate-x-0'}`}>
                
                {/* 1. The "Current" Movie (Left/Top) */}
                <div className="w-full md:w-[50vw] relative h-1/2 md:h-full border-b-4 md:border-b-0 md:border-r-4 border-black shrink-0">
                    <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center text-center p-4 md:p-8">
                        <h2 className="text-2xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-4 drop-shadow-lg leading-tight line-clamp-2">{currentMovie.title}</h2>
                        <div className="text-xl md:text-3xl text-accent font-bold">
                            <span className="text-gray-300 text-sm md:text-lg block mb-1 font-normal uppercase tracking-widest opacity-80">Total User Ratings</span>
                            <span className="text-4xl md:text-6xl drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">{currentMovie.vote_count.toLocaleString()}</span>
                        </div>
                    </div>
                    <img src={getImageUrl(currentMovie.poster_path, 'w1280')} decoding="async" className="w-full h-full object-cover opacity-50" alt={currentMovie.title} />
                </div>

                {/* 2. The "Challenger" Movie (Right/Bottom) */}
                <div className="w-full md:w-[50vw] relative h-1/2 md:h-full shrink-0">
                     {/* Flip Container for Entrance Animation */}
                    <div className={`w-full h-full relative ${gameState === 'idle' && score > 0 ? 'animate-in fade-in zoom-in duration-500' : ''}`}>
                         <div className={`absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center text-center p-4 md:p-8 transition-colors duration-500 ${result === 'correct' ? 'bg-green-900/80' : result === 'wrong' ? 'bg-red-900/80' : ''}`}>
                            
                            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black mb-4 md:mb-8 drop-shadow-lg leading-tight line-clamp-2">{nextMovie.title}</h2>
                            
                            {/* Actions or Result */}
                            <div className="min-h-[150px] md:min-h-[200px] flex flex-col justify-center w-full max-w-md">
                                {gameState === 'idle' ? (
                                    <>
                                        <span className="text-gray-300 text-sm md:text-lg block mb-2 md:mb-4 font-normal uppercase tracking-widest">has a</span>
                                        <div className="flex flex-col gap-3 md:gap-4 w-full px-8">
                                            <button 
                                                onClick={() => handleGuess('higher')}
                                                className="group bg-transparent border-4 border-green-500 hover:bg-green-500 text-white font-black text-lg md:text-2xl py-3 md:py-4 rounded-full transition-all duration-300 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 w-full"
                                            >
                                                <ArrowUp className="w-6 h-6 md:w-8 md:h-8 group-hover:-translate-y-1 transition-transform" strokeWidth={3} /> 
                                                HIGHER
                                            </button>
                                            <span className="text-[10px] md:text-xs tracking-[0.3em] uppercase opacity-50 font-bold">Total Ratings</span>
                                            <button 
                                                onClick={() => handleGuess('lower')}
                                                className="group bg-transparent border-4 border-red-500 hover:bg-red-500 text-white font-black text-lg md:text-2xl py-3 md:py-4 rounded-full transition-all duration-300 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 w-full"
                                            >
                                                <ArrowDown className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-y-1 transition-transform" strokeWidth={3} />
                                                LOWER
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="animate-in zoom-in spin-in-3 duration-500">
                                        <span className="text-gray-300 text-sm md:text-lg block mb-1 font-normal uppercase tracking-widest opacity-80">Total User Ratings</span>
                                        <div className="text-4xl md:text-7xl font-black mb-4 drop-shadow-lg">
                                            <CountUp end={nextMovie.vote_count} />
                                        </div>
                                        {result === 'correct' && (
                                            <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-xl md:text-2xl animate-bounce">
                                                <Check size={32} /> Correct!
                                            </div>
                                        )}
                                        {result === 'wrong' && (
                                            <div className="flex items-center justify-center gap-2 text-red-400 font-bold text-xl md:text-2xl animate-shake">
                                                <XIcon size={32} /> Wrong!
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <img src={getImageUrl(nextMovie.poster_path, 'w1280')} decoding="async" className="w-full h-full object-cover opacity-50" alt={nextMovie.title} />
                    </div>
                </div>

                {/* 3. The "Next" Movie (Hidden initially, slides in) */}
                 {/* This is a trick: We don't need to render the 3rd movie yet. 
                     The container is 200vw wide. 
                     Left = 0-50vw (or 0-100vw mobile). Right = 50-100vw.
                     When we slide -50vw, Left goes -50, Right goes to 0.. 
                     Actually for full page slide it's simpler:
                     Container width 100%. 
                     We are animating the CONTENT.
                     
                     Let's stick to the 2-panel slide. The "Flip" happens when the Data updates after the slide.
                 */}
            </div>

            {/* VS Badge - Absolute Center */}
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-white text-black font-black w-12 h-12 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-xl border-4 border-black text-xl md:text-3xl transition-transform duration-300 ${gameState !== 'idle' ? 'scale-0' : 'scale-100'}`}>
                VS
            </div>

             {/* Score Overlay */}
             <div className="absolute top-4 right-4 z-30 bg-black/50 md:backdrop-blur-md px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl border border-white/10 text-right shadow-2xl">
                <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest font-bold">Streak</div>
                <div className="text-xl md:text-3xl font-black text-accent">{score}</div>
            </div>
        </div>
    );
};

export default HigherLowerGame;
