import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [phase, setPhase] = useState('enter'); // 'enter' | 'visible' | 'exit'

  useEffect(() => {
    // Phase timeline
    const enterTimer = setTimeout(() => setPhase('visible'), 100);
    const exitTimer = setTimeout(() => setPhase('exit'), 1800);
    const completeTimer = setTimeout(() => onComplete(), 2200);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-9999 bg-black flex flex-col items-center justify-center transition-opacity duration-500 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-[60px]"></div>
      </div>

      {/* Logo/Brand */}
      <div 
        className={`relative z-10 text-center transition-all duration-700 ${
          phase === 'enter' ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
        }`}
      >
        {/* Logo Text */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-2">
          Cine<span className="text-accent">Quest</span>
        </h1>
        
        {/* Tagline */}
        <p className="text-gray-400 text-sm md:text-base font-medium tracking-widest uppercase">
          Discover Your Next Watch
        </p>

        {/* Animated Loading Bar */}
        <div className="mt-8 w-48 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto">
          <div 
            className="h-full bg-linear-to-r from-accent to-purple-500 rounded-full animate-pulse"
            style={{
              width: phase === 'enter' ? '0%' : '100%',
              transition: 'width 1.5s ease-out'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
