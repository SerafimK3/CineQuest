import React, { useState, useEffect } from 'react';
import { getTrending, getImageUrl, searchMovies, getDetails, discover } from '../../services/tmdb';
import { Trophy, CheckCircle, XCircle, ChevronRight, Crown } from 'lucide-react';
import AdBanner from '../../components/AdBanner';

const Trivia = () => {
  const [loading, setLoading] = useState(true);
  const [currentMovie, setCurrentMovie] = useState(null);
  const [options, setOptions] = useState([]);
  const [sessionStreak, setSessionStreak] = useState(0); // Correct answers in a row
  const [bestStreak, setBestStreak] = useState(0); // All time best run
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  // showResult state removed - not used
  const [showGameOver, setShowGameOver] = useState(false);
  const [finalStreak, setFinalStreak] = useState(0);
  const [showAd, setShowAd] = useState(false);

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
                    const keywordData = await searchMovies(keyword);
                    const keywordMatches = keywordData?.results || [];
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
        setFinalStreak(sessionStreak);
        // Track game over count for ad display (every 3rd)
        const currentCount = parseInt(sessionStorage.getItem('triviaGameOverCount') || '0');
        const newCount = currentCount + 1;
        sessionStorage.setItem('triviaGameOverCount', newCount.toString());
        const shouldShowAd = newCount % 3 === 0; // Show ad every 3rd game over
        // Show Game Over after a brief delay to show wrong answer
        setTimeout(() => {
            setShowAd(shouldShowAd);
            setShowGameOver(true);
        }, 1000);
    }
  };

  const handleTryAgain = () => {
    setShowGameOver(false);
    setSessionStreak(0);
    generateQuestion();
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
      {/* Game Over Modal */}
      {showGameOver && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-gray-900 border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden text-center p-8">
            {/* Icon */}
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="text-red-500" size={48} />
            </div>
            
            {/* Title */}
            <h2 className="text-3xl font-black text-white mb-2">Game Over!</h2>
            <p className="text-gray-400 mb-6">The correct answer was:</p>
            <p className="text-xl font-bold text-accent mb-8">{currentMovie?.title}</p>
            
            {/* Stats */}
            <div className="flex justify-center gap-6 mb-8">
              <div className="text-center">
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Your Streak</p>
                <p className="text-4xl font-black text-white">{finalStreak}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-yellow-500 uppercase tracking-wide mb-1">Best Streak</p>
                <p className="text-4xl font-black text-yellow-500">{bestStreak}</p>
              </div>
            </div>
            
            {/* New Record Notice */}
            {finalStreak > 0 && finalStreak >= bestStreak && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 mb-4">
                <p className="text-yellow-400 font-bold flex items-center justify-center gap-2">
                  <Crown size={18} /> New Record!
                </p>
              </div>
            )}
            
            {/* Ad Banner - Shows every 3rd game over */}
            {showAd && (
                <div className="w-full max-w-md px-4 mb-4">
                    <AdBanner />
                </div>
            )}
            
            {/* Try Again Button */}
            <button 
              onClick={handleTryAgain}
              className="bg-accent hover:bg-accent-hover text-black font-black text-lg py-4 px-10 rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-accent/30"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

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
