import React, { useState } from 'react';
import { Sparkles, BrainCircuit, ArrowRight, RefreshCw, X } from 'lucide-react';
import MovieCard from '../components/MovieCard';

const VibeCoder = () => {
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    
    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s Client Timeout (Server 5.5s)

    try {
        const response = await fetch('/api/analyze-vibe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "AI request failed");
        setResult(data.movie);

    } catch (err) {
        console.error("Vibe coding failed:", err);
        clearTimeout(timeoutId);
        
        // Fallback Strategy: If AI fails (Rate limit/Timeout), just show a Trending Movie
        setError("AI is busy (Rate Limit). Showing a Trending Movie instead!");
        await fetchTrendingFallback();
    } finally {
        setIsAnalyzing(false);
    }
  };

  const fetchTrendingFallback = async () => {
      try {
          // Direct TMDB Fallback
          const API_KEY = import.meta.env.VITE_TMDB_API_KEY; 
          const response = await fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${API_KEY}`);
          const data = await response.json();
          if (data.results?.length) {
              const random = data.results[Math.floor(Math.random() * 5)];
              setResult(random);
          }
      } catch (e) {
          setError("Even the fallback failed. Check internet.");
      }
  };

  const clearResult = () => {
      setResult(null);
      setPrompt('');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
        
      {/* Matrix / Code Background Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #00E5FF 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      <div className="w-full max-w-4xl z-10 animate-in slide-in-from-bottom-8 duration-700 flex flex-col items-center">
          
          <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-500/50 px-4 py-1 rounded-full text-purple-300 text-sm font-bold mb-4 uppercase tracking-widest">
                  <BrainCircuit size={16} /> True AI Powered
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-4">
                  The Vibe Coder
              </h1>
              <p className="text-gray-400 text-lg">
                  "Scary 90s movie" or "Pick between Matrix and Inception"
              </p>
          </div>

          {/* INPUT SECTION - Hide when result is shown? No, keep it for refinement */}
          {!result && (
              <div className="w-full max-w-2xl relative group mb-10">
                  <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder='Describe your vibe...'
                      className="w-full h-32 bg-gray-900/80 border-2 border-gray-700 rounded-3xl p-6 text-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none shadow-2xl"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-linear-to-r from-transparent via-accent to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  
                  {error && <p className="text-red-400 mt-2 text-center font-bold">{error}</p>}

                  <div className="mt-6 flex justify-center">
                      <button
                          onClick={handleAnalyze}
                          disabled={isAnalyzing || !prompt.trim()}
                          className={`relative px-10 py-4 bg-white text-black font-black text-lg uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 ${isAnalyzing ? 'animate-pulse' : ''}`}
                      >
                          {isAnalyzing ? (
                              <>Analyzing Logic...</>
                          ) : (
                              <>Generate Result <ArrowRight /></>
                          )}
                      </button>
                  </div>
              </div>
          )}

          {/* RESULT SECTION */}
          {result && (
              <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-500">
                  <div className="mb-6 flex gap-4">
                      <button onClick={handleAnalyze} className="px-6 py-2 bg-gray-800 rounded-full hover:bg-gray-700 flex items-center gap-2 font-bold transition-colors">
                          <RefreshCw size={18} /> Retry Vibe
                      </button>
                      <button onClick={clearResult} className="px-6 py-2 bg-gray-800 rounded-full hover:bg-gray-700 flex items-center gap-2 font-bold transition-colors">
                          <X size={18} /> New Search
                      </button>
                  </div>

                  <div className="scale-110">
                    <MovieCard movie={result} />
                  </div>
              </div>
          )}

      </div>
    </div>
  );
};

export default VibeCoder;
