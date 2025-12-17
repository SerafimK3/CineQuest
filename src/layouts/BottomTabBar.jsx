
import React from 'react';
import { Home, Sparkles, History, Compass, Gamepad2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const BottomTabBar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { id: 'home', icon: Home, label: 'Spin', path: '/' },
        { id: 'discover', icon: Compass, label: 'Discover', path: '/discover' },
        { id: 'vibe', icon: Sparkles, label: 'Oracle', path: '/chat', isHero: true },
        { id: 'games', icon: Gamepad2, label: 'Games', path: '/games' },
        { id: 'history', icon: History, label: 'History', path: '/history' },
    ];

    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 pb-safe-bottom bg-black/90 backdrop-blur-xl border-t border-x border-white/10 w-full max-w-lg md:rounded-t-3xl md:mb-4 shadow-2xl md:ring-1 md:ring-white/10 transition-all duration-500">
            <div className="flex justify-around items-end h-24 w-full pb-6 px-2">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path;
                    
                    if (tab.isHero) {
                        return (
                            <button
                                key={tab.id}
                                onClick={() => navigate(tab.path)}
                                className="relative -top-6 flex flex-col items-center justify-center group"
                            >
                                <div className={cn(
                                    "w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(124,77,255,0.4)] transition-all duration-300",
                                    isActive 
                                        ? "bg-gradient-to-tr from-accent to-purple-400 scale-110 shadow-[0_0_30px_rgba(124,77,255,0.8)]" 
                                        : "bg-surface border border-white/20 hover:scale-105"
                                )}>
                                    <tab.icon 
                                        size={28} 
                                        className={cn("text-white transition-transform duration-500", isActive && "animate-pulse")} 
                                        fill={isActive ? "currentColor" : "none"}
                                    />
                                </div>
                                <span className={cn(
                                    "absolute -bottom-5 text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center gap-1",
                                    isActive ? "text-accent" : "text-gray-500"
                                )}>
                                    {tab.label} <span className="text-[8px] bg-purple-600 text-white px-1 py-0.5 rounded-full">BETA</span>
                                </span>
                            </button>
                        );
                    }

                    return (
                        <button
                            key={tab.id}
                            onClick={() => navigate(tab.path)}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-12 gap-1 transition-all duration-300",
                                isActive ? "text-accent" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            <tab.icon 
                                size={22} 
                                className={cn("transition-all", isActive && "scale-110 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]")} 
                            />
                            <span className="text-[9px] font-bold tracking-widest uppercase opacity-80">
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomTabBar;
