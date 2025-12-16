import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, BrainCircuit, ArrowRight } from 'lucide-react';

const VibeCoder = () => {
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  // "Tiny LLM" - Smart Regex Parser
  const parseVibe = (text) => {
      const lower = text.toLowerCase();
      const filters = {};

      // 1. Genres
      if (lower.match(/scary|horror|spooky|creepy/)) filters.with_genres = '27';
      if (lower.match(/funny|comedy|laugh|sitcom/)) filters.with_genres = '35';
      if (lower.match(/action|fight|explosion|intense/)) filters.with_genres = '28';
      if (lower.match(/drama|sad|emotional|tearjerker/)) filters.with_genres = '18';
      if (lower.match(/love|romance|romantic|date/)) filters.with_genres = '10749';
      if (lower.match(/family|kids|children/)) filters.with_genres = '10751';
      if (lower.match(/scifi|sci-fi|space|future/)) filters.with_genres = '878';

      // 2. Decades
      if (lower.match(/80s|1980/)) {
          filters['primary_release_date.gte'] = '1980-01-01';
          filters['primary_release_date.lte'] = '1989-12-31';
      }
      if (lower.match(/90s|1990/)) {
          filters['primary_release_date.gte'] = '1990-01-01';
          filters['primary_release_date.lte'] = '1999-12-31';
      }
      if (lower.match(/2000s|00s/)) {
          filters['primary_release_date.gte'] = '2000-01-01';
          filters['primary_release_date.lte'] = '2009-12-31';
      }
      
      // 3. Keywords (Mocking "New York", "Paris" -> could use real IDs if we had a mapping, for now just simple Logic)
      // This is a "Prototype" AI, so we keep it simple.

      return filters;
  };

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    
    setIsAnalyzing(true);
    
    // Fake "AI Processing" Delay
    await new Promise(r => setTimeout(r, 1500));
    
    const filters = parseVibe(prompt);
    
    // Navigate to Spinner with mapped filters
    navigate('/', { 
        state: { 
            autoSpin: true, 
            injectedFilters: filters,
            vibeDescription: prompt 
        } 
    });
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
        
      {/* Matrix / Code Background Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #00E5FF 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      <div className="w-full max-w-2xl z-10 animate-in slide-in-from-bottom-8 duration-700">
          
          <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-500/50 px-4 py-1 rounded-full text-purple-300 text-sm font-bold mb-4 uppercase tracking-widest">
                  <BrainCircuit size={16} /> AI Powered
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-4">
                  The Vibe Coder
              </h1>
              <p className="text-gray-400 text-lg">
                  Describe what you want to feel. We translate it to code.
              </p>
          </div>

          <div className="relative group">
              <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder='Try: "I want a scary 90s movie set in space..."'
                  className="w-full h-40 bg-gray-900/80 border-2 border-gray-700 rounded-3xl p-6 text-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none shadow-2xl"
              />
              <div className="absolute inset-x-0 bottom-0 h-1 bg-linear-to-r from-transparent via-accent to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
          </div>

          <div className="mt-8 flex justify-center">
              <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !prompt.trim()}
                  className={`relative px-10 py-5 bg-white text-black font-black text-xl uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 ${isAnalyzing ? 'animate-pulse' : ''}`}
              >
                  {isAnalyzing ? (
                      <>Analyzing Logic...</>
                  ) : (
                      <>Generate Vibe <ArrowRight /></>
                  )}
              </button>
          </div>

      </div>
    </div>
  );
};

export default VibeCoder;
