import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Trophy, TrendingUp, HelpCircle, Sparkles } from 'lucide-react';

const GamesHub = () => {
    const games = [
        {
            id: 'trivia',
            title: 'Movie Trivia',
            description: 'Test your knowledge! Guess the movie from blurred scenes and descriptions.',
            icon: <Trophy className="w-12 h-12 text-yellow-400" />,
            color: 'from-yellow-900/40 to-yellow-600/10',
            border: 'border-yellow-500/30',
            link: '/games/trivia',
            status: 'Play Now'
        },
        {
            id: 'higher-lower',
            title: 'Higher or Lower',
            description: 'Box Office Edition. Which movie made more money? The ultimate challenge.',
            icon: <TrendingUp className="w-12 h-12 text-green-400" />,
            color: 'from-green-900/40 to-green-600/10',
            border: 'border-green-500/30',
            link: '/games/higher-lower',
            status: 'Play Now'
        },
         {
            id: 'frame-freeze',
            title: 'Frame Freeze',
            description: 'Identify the movie from a single zoomed-in frame. Daily challenge.',
            icon: <Film className="w-12 h-12 text-purple-400" />,
            color: 'from-purple-900/40 to-purple-600/10',
            border: 'border-purple-500/30',
            link: '/games/frame-freeze',
            status: 'Coming Soon'
        }
    ];

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-16 animate-in slide-in-from-bottom-5 duration-700">
                <h1 className="text-5xl font-black mb-4 bg-linear-to-r from-accent to-purple-500 text-transparent bg-clip-text drop-shadow-lg">
                    Arcade Zone
                </h1>
                <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-8">
                    Challenge yourself with our collection of interactive movie games. 
                    Climb the leaderboards and prove you are the ultimate cinephile.
                </p>

                {/* AI Banner */}
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-linear-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/50 text-purple-200 text-sm font-medium animate-pulse shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                    <Sparkles size={16} className="text-purple-400" />
                    <span>AI-Powered Challenges Coming Soon: Infinite fun generated just for you!</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {games.map((game) => (
                    <Link 
                        to={game.status === 'Play Now' ? game.link : '#'} 
                        key={game.id}
                        className={`group relative overflow-hidden rounded-2xl border ${game.border} bg-surface transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-${game.color.split('-')[1]}-500/20`}
                    >
                        {/* Gradient Background */}
                        <div className={`absolute inset-0 bg-linear-to-br ${game.color} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                        
                        <div className="relative p-8 flex flex-col items-center text-center h-full">
                            <div className="mb-6 p-4 rounded-full bg-black/40 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                {game.icon}
                            </div>
                            
                            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-accent transition-colors">
                                {game.title}
                            </h3>
                            
                            <p className="text-gray-400 mb-8 grow leading-relaxed">
                                {game.description}
                            </p>
                            
                            <span className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${
                                game.status === 'Play Now' 
                                    ? 'bg-accent text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]' 
                                    : 'bg-gray-800 text-gray-500 border border-gray-700'
                            }`}>
                                {game.status}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default GamesHub;
