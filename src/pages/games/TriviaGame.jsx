import React, { useState, useEffect } from 'react';
import { getTrending, getImageUrl, searchMovies, getDetails, discover } from '../../services/tmdb';
import { Trophy, CheckCircle, XCircle, ChevronRight, Crown } from 'lucide-react';

const Trivia = () => {
  const [loading, setLoading] = useState(true);
  const [currentMovie, setCurrentMovie] = useState(null);
  const [options, setOptions] = useState([]);
  const [sessionStreak, setSessionStreak] = useState(0); // Correct answers in a row
  const [bestStreak, setBestStreak] = useState(0); // All time best run
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Initialize Best Streak
  useEffect(() => {
    const savedBest = parseInt(localStorage.getItem('triviaBestStreak') || '0');
    setBestStreak(savedBest);
  }, []);

  // Fetch a question
  const generateQuestion = async () => {
    setLoading(true);
    setAnswered(false);
    setSelectedOption(null);
    setIsCorrect(false);

    try {
        // Fetch a random page to get a candidate
        const randomPage = Math.floor(Math.random() * 20) + 1;
        const initialMovies = await getTrending('movie', 'week', randomPage);
        const correctCandidate = initialMovies[Math.floor(Math.random() * initialMovies.length)];
        
        // Fetch full details for the correct movie to get credits
        // We use the discover function for distractors, so we need people IDs
        const correctFull = await getDetails('movie', correctCandidate.id);
        const director = correctFull.credits?.crew?.find(p => p.job === 'Director');
        const leadActor = correctFull.credits?.cast?.[0];

        let distractorPool = [];

        // STRATEGY 1: Sibling Movies (Same Director/Actor) - Hardest
        if (director) {
             const directorMovies = await discover('movie', { 
                 with_people: director.id, 
                 sort_by: 'vote_count.desc', // Popular ones
                 page: 1 
             });
             distractorPool = directorMovies;
        } else if (leadActor) {
             const actorMovies = await discover('movie', { 
                 with_people: leadActor.id,
                 sort_by: 'vote_count.desc',
                 page: 1
             });
             distractorPool = actorMovies;
        }

        // Filter out the correct movie itself and duplicates
        distractorPool = distractorPool.filter(m => m.id !== correctFull.id && m.title !== correctFull.title);

        // STRATEGY 2: Fallback to Similar Keywords (Existing Logic) if pool is small
        if (distractorPool.length < 3) {
             try {
                const words = correctFull.title.split(' ').filter(w => w.length > 3);
                if (words.length > 0) {
                    const keyword = words.reduce((a, b) => a.length > b.length ? a : b); 
                    const keywordMatches = await searchMovies(keyword);
                    const validMatches = keywordMatches.filter(m => m.id !== correctFull.id && m.title !== correctFull.title);
                    distractorPool = [...distractorPool, ...validMatches];
                }
             } catch (e) {
                 // Keyword fallback failed, silent fail
             }
        }

        // STRATEGY 3: Same Genre Fallback
        if (distractorPool.length < 3) {
             const sameGenreMovies = initialMovies.filter(m => 
                m.id !== correctFull.id && 
                m.title !== correctFull.title &&
                m.genre_ids.some(g => correctFull.genres.map(x => x.id).includes(g))
            );
            distractorPool = [...distractorPool, ...sameGenreMovies];
        }

        // Final Safety: Randoms
        if (distractorPool.length < 3) {
             distractorPool = [...distractorPool, ...initialMovies.filter(m => m.id !== correctFull.id)];
        }

        // Unique Dedup
        const uniqueDistractors = [];
        const seenIds = new Set([correctFull.id]);
        
        for (const m of distractorPool) {
            if (!seenIds.has(m.id)) {
                uniqueDistractors.push(m);
                seenIds.add(m.id);
            }
            if (uniqueDistractors.length >= 3) break;
        }

        const allOptions = [correctFull, ...uniqueDistractors].sort(() => 0.5 - Math.random());

        // Redact title from overview
        const redactedOverview = correctFull.overview.replace(
            new RegExp(correctFull.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 
            '[REDACTED]'
        );

        setCurrentMovie({ ...correctFull, overview: redactedOverview });
        setOptions(allOptions);

    } catch (error) {
        console.error("Failed to generate trivia:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    generateQuestion();
  }, []);

  const handleAnswer = (movie) => {
    if (answered) return;
    
    setAnswered(true);
    setSelectedOption(movie);

    if (movie.id === currentMovie.id) {
        setIsCorrect(true);
        
        const newStreak = sessionStreak + 1;
        setSessionStreak(newStreak);

        // Update Best Streak if beaten
        if (newStreak > bestStreak) {
            setBestStreak(newStreak);
            localStorage.setItem('triviaBestStreak', newStreak.toString());
        }

    } else {
        setIsCorrect(false);
        setSessionStreak(0);
    }
  };

  if (loading && !currentMovie) {
    return (
        <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header Stats */}
      {/* Header Stats - Centered, No background */}
      <div className="flex justify-center items-center gap-6 mb-6">
            {/* Session Streak */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/80 backdrop-blur rounded-2xl border border-gray-700 min-w-[120px] justify-center">
                <span className="text-2xl">⚡</span>
                <div>
                    <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Run</p>
                    <p className="text-xl font-black text-text-primary leading-none">{sessionStreak}</p>
                </div>
            </div>
            
            {/* Best Streak */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/80 backdrop-blur rounded-2xl border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)] min-w-[120px] justify-center">
                <Crown className="text-yellow-500" size={24} />
                <div>
                    <p className="text-[10px] text-yellow-400 uppercase font-bold tracking-wider">Best</p>
                    <p className="text-xl font-black text-yellow-500 leading-none">{bestStreak}</p>
                </div>
            </div>
      </div>

      {/* Game Card - Side by Side Layout */}
      <div className="bg-surface rounded-2xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col md:flex-row h-auto md:h-[600px]">
        {/* Left: Image & Text (Wider: 65%) */}
        <div className="w-full md:w-[65%] flex flex-col bg-black border-b md:border-b-0 md:border-r border-gray-800">
             {/* Image Container - Takes available space */}
             <div className="relative grow overflow-hidden bg-black p-4 flex items-center justify-center min-h-[30vh]">
                {/* Vignette Overlay for smooth edges */}
                <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]"></div>
                
                <img 
                    src={getImageUrl(currentMovie?.backdrop_path || currentMovie?.poster_path, 'original')} 
                    alt="Guess the movie" 
                    className={`max-w-full max-h-full object-contain transition-all duration-1000 ${answered ? 'filter-none grayscale-0' : 'blur-lg grayscale opacity-50'}`}
                />
             </div>
             
             {/* Text Container - Fixed at bottom of left column */}
             <div className="p-6 text-center border-t border-gray-800 bg-gray-900 relative z-10 shrink-0">
                <span className="inline-block bg-accent text-black font-bold px-3 py-1 rounded-full text-sm mb-3 shadow-lg shadow-accent/20">
                    Guess the Movie
                </span>
                <p className="text-base text-gray-200 italic leading-relaxed max-h-[150px] md:max-h-none overflow-y-auto max-w-3xl mx-auto">
                    "{currentMovie?.overview}"
                </p>
             </div>
        </div>

        {/* Right: Options (Narrower: 35%) */}
        <div className="w-full md:w-[35%] p-6 flex flex-col justify-center bg-surface relative">
            <h2 className="text-xl font-bold mb-6 text-center text-text-primary">Select the Answer</h2>
            <div className="grid gap-3 w-full">
                {options.map((option) => {
                    const isSelected = selectedOption?.id === option.id;
                    const isTheCorrectOne = option.id === currentMovie?.id;
                    
                    let buttonStyle = "bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-gray-500"; // Default
                    
                    if (answered) {
                        if (isTheCorrectOne) buttonStyle = "bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/20";
                        else if (isSelected && !isTheCorrectOne) buttonStyle = "bg-red-600 border-red-500 text-white";
                        else buttonStyle = "bg-gray-800 opacity-40"; 
                    }

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleAnswer(option)}
                            disabled={answered}
                            className={`p-3 rounded-lg border-2 font-bold text-sm text-left transition-all transform active:scale-95 flex justify-between items-center ${buttonStyle}`}
                        >
                            <span className="break-words pr-2 leading-snug">{option.title}</span>
                            {answered && isTheCorrectOne && <CheckCircle size={18} />}
                            {answered && isSelected && !isTheCorrectOne && <XCircle size={18} />}
                        </button>
                    );
                })}
            </div>

            {/* Next Button */}
            {!loading && answered && (
                <div className="mt-6 flex justify-center animate-in fade-in zoom-in duration-300">
                    <button 
                        onClick={generateQuestion}
                        className="bg-accent hover:bg-accent-hover text-black font-black text-base py-3 px-8 rounded-full flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/30 transition-all transform hover:scale-105 active:scale-95"
                    >
                        Next Round <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Trivia;
