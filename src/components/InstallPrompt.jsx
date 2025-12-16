import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('install-prompt-dismissed');
    if (isDismissed) return;

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (iOS && !isStandalone) {
        setIsIOS(true);
        // Show immediately for iOS (since no beforeinstallprompt)
        // delayed slightly for better UX
        setTimeout(() => setIsVisible(true), 3000);
    }

    // Android / Desktop PWA Standard
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('install-prompt-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[100] animate-in slide-in-from-top-full duration-500">
      <div className="bg-gray-900/95 backdrop-blur-md border-b border-white/10 p-4 shadow-2xl flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-accent/20 p-2 rounded-lg">
            <Smartphone className="text-accent" size={24} />
          </div>
          <div>
            <p className="text-white font-bold text-sm md:text-base">Add CineQuest to Home Screen</p>
            <p className="text-gray-400 text-xs md:text-sm">For the best full-screen experience.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isIOS ? (
            <div className="text-xs text-gray-400 font-medium mr-2 hidden sm:block">
              Tap <span className="text-blue-400">Share</span> → <span className="text-white">Add to Home Screen</span>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="bg-linear-to-r from-accent to-purple-600 hover:from-accent-hover hover:to-purple-500 text-white text-xs md:text-sm font-bold py-2 px-4 rounded-full shadow-lg shadow-accent/20 flex items-center gap-2 transform transition hover:scale-105 active:scale-95"
            >
              <Download size={16} /> Install
            </button>
          )}

          <button 
            onClick={handleDismiss}
            className="p-2 text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default InstallPrompt;
