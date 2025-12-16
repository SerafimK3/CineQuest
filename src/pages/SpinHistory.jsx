import React, { useEffect, useState } from 'react';
import { getHistory, clearHistory } from '../utils/history';
import MovieCard from '../components/MovieCard';
import { Trash2, History, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const SpinHistory = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
      setHistory(getHistory());
  }, []);

  const handleClear = () => {
      if (confirm('Clear your spin history?')) {
          clearHistory();
          setHistory([]);
      }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
                <Link to="/" className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
                    <ArrowLeft size={24}/>
                </Link>
                <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-gray-200 to-gray-400">
                    Spin History
                </h1>
            </div>
            {history.length > 0 && (
                <button 
                    onClick={handleClear}
                    className="flex items-center gap-2 px-4 py-2 bg-red-900/30 text-red-400 rounded-xl hover:bg-red-900/50 transition border border-red-900/50"
                >
                    <Trash2 size={18} /> Clear
                </button>
            )}
        </header>

        {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 border-2 border-dashed border-gray-800 rounded-3xl">
                <History size={48} className="mb-4 opacity-50" />
                <p className="text-xl font-bold">No spins yet.</p>
                <p className="text-sm">Go make some decisions!</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {history.map((movie, index) => (
                    <div key={`${movie.id}-${index}`} className="relative group">
                         <MovieCard movie={movie} type="movie" />

                    </div>
                ))}
            </div>
        )}

      </div>
    </div>
  );
};

export default SpinHistory;
