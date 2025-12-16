
import React from 'react';
import { Home, Sparkles, History, Send } from 'lucide-react';
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
        { id: 'vibe', icon: Sparkles, label: 'Vibe AI', path: '/chat' },
        { id: 'history', icon: History, label: 'History', path: '/history' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe-bottom bg-black/80 backdrop-blur-xl border-t border-white/10 md:hidden">
            <div className="flex justify-around items-center h-16 w-full">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => navigate(tab.path)}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300",
                                isActive ? "text-accent scale-110" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            <tab.icon 
                                size={24} 
                                className={cn("transition-all", isActive && "drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]")} 
                            />
                            <span className="text-[10px] font-bold tracking-widest uppercase opacity-80">
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
