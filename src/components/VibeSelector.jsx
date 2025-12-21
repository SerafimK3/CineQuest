import React from 'react';
import { Clock, Calendar, Sparkles, Tv, CheckCircle } from 'lucide-react';

// Movie genres from TMDB
const MOVIE_GENRES = [
  { id: 28, label: 'Action 💥' },
  { id: 12, label: 'Adventure 🗺️' },
  { id: 16, label: 'Animation 🎨' },
  { id: 35, label: 'Comedy 😂' },
  { id: 80, label: 'Crime 🔪' },
  { id: 99, label: 'Documentary 📹' },
  { id: 18, label: 'Drama 🎭' },
  { id: 10751, label: 'Family 👨‍👩‍👧' },
  { id: 14, label: 'Fantasy ✨' },
  { id: 27, label: 'Horror 😱' },
  { id: 9648, label: 'Mystery 🔍' },
  { id: 10749, label: 'Romance 💕' },
  { id: 878, label: 'Sci-Fi 🚀' },
  { id: 53, label: 'Thriller 😰' },
  { id: 10752, label: 'War ⚔️' },
];

// TV genres from TMDB (different IDs!)
const TV_GENRES = [
  { id: 10759, label: 'Action 💥' },
  { id: 16, label: 'Animation 🎨' },
  { id: 35, label: 'Comedy 😂' },
  { id: 80, label: 'Crime 🔪' },
  { id: 99, label: 'Documentary 📹' },
  { id: 18, label: 'Drama 🎭' },
  { id: 10751, label: 'Family 👨‍👩‍👧' },
  { id: 9648, label: 'Mystery 🔍' },
  { id: 10764, label: 'Reality 📺' },
  { id: 10765, label: 'Sci-Fi 🚀' },
  { id: 10768, label: 'War 🎖️' },
];

const VIBE_OPTIONS = {
  // Movies only - runtime filter
  duration: [
    { id: 'quick', label: 'Quick (<90m)', value: { 'with_runtime.lte': 90 } },
    { id: 'sweet', label: 'Sweet Spot', value: { 'with_runtime.gte': 90, 'with_runtime.lte': 130 } },
    { id: 'epic', label: 'Epic (2h+)', value: { 'with_runtime.gte': 120 } },
  ],

  // TV only - status filter (TMDB doesn't support season count filtering directly)
  status: [
    { id: 'ongoing', label: 'Still Running ▶️', value: { with_status: '0' } }, // Returning Series
    { id: 'ended', label: 'Completed ✓', value: { with_status: '3' } }, // Ended
  ],
  
  // Shared era filter (works for both)
  era: [
    { id: '90s', label: '90s', value: { 'primary_release_date.gte': '1990-01-01', 'primary_release_date.lte': '1999-12-31', 'first_air_date.gte': '1990-01-01', 'first_air_date.lte': '1999-12-31' } },
    { id: '2000s', label: '2000s', value: { 'primary_release_date.gte': '2000-01-01', 'primary_release_date.lte': '2009-12-31', 'first_air_date.gte': '2000-01-01', 'first_air_date.lte': '2009-12-31' } },
    { id: '2010s', label: '2010s', value: { 'primary_release_date.gte': '2010-01-01', 'primary_release_date.lte': '2019-12-31', 'first_air_date.gte': '2010-01-01', 'first_air_date.lte': '2019-12-31' } },
    { id: 'recent', label: 'Recent', value: { 'primary_release_date.gte': '2020-01-01', 'first_air_date.gte': '2020-01-01' } },
  ],
};

const VibeSelector = ({ selections, onSelect, mediaType = 'movie' }) => {
  const genres = mediaType === 'movie' ? MOVIE_GENRES : TV_GENRES;
  
  const handleToggle = (category, option) => {
    if (selections[category]?.id === option.id) {
       onSelect(category, null);
    } else {
       onSelect(category, option);
    }
  };

  const buttonBase = "px-3 py-2 rounded-2xl font-bold text-xs transition-colors duration-200 border";

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Duration - Movies only */}
      {mediaType === 'movie' && (
        <div className="space-y-2">
          <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
             <Clock size={14} className="text-accent"/> How much time?
          </h3>
          <div className="flex flex-wrap gap-2">
             {VIBE_OPTIONS.duration.map(opt => (
               <button
                  key={opt.id}
                  onClick={() => handleToggle('duration', opt)}
                  className={`${buttonBase} ${
                     selections.duration?.id === opt.id 
                     ? 'bg-accent text-black border-accent shadow-[0_0_15px_rgba(0,229,255,0.4)]' 
                     : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-600 hover:text-white'
                  }`}
               >
                  {opt.label}
               </button>
             ))}
          </div>
        </div>
      )}

      {/* Status - TV only */}
      {mediaType === 'tv' && (
        <div className="space-y-2">
          <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
             <CheckCircle size={14} className="text-green-400"/> Status
          </h3>
          <div className="flex flex-wrap gap-2">
             {VIBE_OPTIONS.status.map(opt => (
               <button
                  key={opt.id}
                  onClick={() => handleToggle('status', opt)}
                  className={`${buttonBase} ${
                     selections.status?.id === opt.id 
                     ? 'bg-green-500 text-white border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                     : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-600 hover:text-white'
                  }`}
               >
                  {opt.label}
               </button>
             ))}
          </div>
        </div>
      )}

      {/* Era - Both */}
      <div className="space-y-2">
        <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
           <Calendar size={14} className="text-purple-400"/> Era
        </h3>
        <div className="flex flex-wrap gap-2">
           {VIBE_OPTIONS.era.map(opt => (
             <button
                key={opt.id}
                onClick={() => handleToggle('era', opt)}
                className={`${buttonBase} ${
                   selections.era?.id === opt.id 
                   ? 'bg-purple-500 text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                   : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-600 hover:text-white'
                }`}
             >
                {opt.label}
             </button>
           ))}
        </div>
      </div>

      {/* Genre - Full list */}
      <div className="space-y-2">
        <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
           <Sparkles size={14} className="text-pink-500"/> Genre
        </h3>
        <div className="flex flex-wrap gap-2">
           {genres.map(genre => (
             <button
                key={genre.id}
                onClick={() => handleToggle('genre', { id: genre.id, value: { with_genres: String(genre.id) } })}
                className={`${buttonBase} ${
                   selections.genre?.id === genre.id 
                   ? 'bg-pink-500 text-white border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.4)]' 
                   : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-600 hover:text-white'
                }`}
             >
                {genre.label}
             </button>
           ))}
        </div>
      </div>

    </div>
  );
};

export default VibeSelector;
