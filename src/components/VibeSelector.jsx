import React from 'react';
import { Clock, Calendar, Sparkles } from 'lucide-react';

const VIBE_OPTIONS = {
  duration: [
    { id: 'short', label: 'Short (< 90m)', value: { 'with_runtime.lte': 90 } },
    { id: 'medium', label: 'Medium (90-120m)', value: { 'with_runtime.gte': 90, 'with_runtime.lte': 120 } },
    { id: 'long', label: 'Long (> 2h)', value: { 'with_runtime.gte': 120 } },
  ],
  era: [
    { id: '80s', label: '80s Classics', value: { 'primary_release_date.gte': '1980-01-01', 'primary_release_date.lte': '1989-12-31' } },
    { id: '90s', label: '90s Nostalgia', value: { 'primary_release_date.gte': '1990-01-01', 'primary_release_date.lte': '1999-12-31' } },
    { id: '2000s', label: '2000s Hits', value: { 'primary_release_date.gte': '2000-01-01', 'primary_release_date.lte': '2009-12-31' } },
    { id: 'modern', label: 'Modern Era', value: { 'primary_release_date.gte': '2010-01-01' } },
  ],
  mood: [
    { id: 'scary', label: 'Scary 😱', value: { with_genres: '27,53' } },
    { id: 'funny', label: 'Funny 😂', value: { with_genres: '35' } },
    { id: 'intense', label: 'Intense 💥', value: { with_genres: '28,80' } },
    { id: 'chill', label: 'Chill 🍿', value: { with_genres: '12,10751,10749,16' } }, // Adventure, Family, Romance, Animation
    { id: 'drama', label: 'Deep 🎭', value: { with_genres: '18' } },
  ]
};

const VibeSelector = ({ selections, onSelect }) => {
  
  const handleToggle = (category, option) => {
    // Single select per category for simplicity, or toggle?
    // "User taps Short... User taps Scary" implies single choice per dimension facilitates "The Decide Button" logic easier.
    // Let's go with toggle (select/deselect). 
    if (selections[category]?.id === option.id) {
       onSelect(category, null); // Deselect
    } else {
       onSelect(category, option);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="space-y-3">
        <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
           <Clock size={14} className="text-accent"/> How much time do we have?
        </h3>
        <div className="flex flex-wrap gap-3">
           {VIBE_OPTIONS.duration.map(opt => (
             <button
                key={opt.id}
                onClick={() => handleToggle('duration', opt)}
                className={`px-4 py-3 rounded-2xl font-bold text-sm transition-colors duration-200 border ${
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

      {/* Era */}
      <div className="space-y-3">
        <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
           <Calendar size={14} className="text-purple-400"/> Pick an Era
        </h3>
        <div className="flex flex-wrap gap-3">
           {VIBE_OPTIONS.era.map(opt => (
             <button
                key={opt.id}
                onClick={() => handleToggle('era', opt)}
                className={`px-4 py-3 rounded-2xl font-bold text-sm transition-colors duration-200 border ${
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

      {/* Mood */}
      <div className="space-y-3">
        <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
           <Sparkles size={14} className="text-pink-500"/> What's the Vibe?
        </h3>
        <div className="flex flex-wrap gap-3">
           {VIBE_OPTIONS.mood.map(opt => (
             <button
                key={opt.id}
                onClick={() => handleToggle('mood', opt)}
                className={`px-4 py-3 rounded-2xl font-bold text-sm transition-colors duration-200 border ${
                   selections.mood?.id === opt.id 
                   ? 'bg-pink-500 text-white border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.4)]' 
                   : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-600 hover:text-white'
                }`}
             >
                {opt.label}
             </button>
           ))}
        </div>
      </div>

    </div>
  );
};

export default VibeSelector;
