import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"
import MobileLayout from './layouts/MobileLayout';
import InstallPrompt from './components/InstallPrompt';
import SplashScreen from './components/SplashScreen';

import { RegionProvider } from './contexts/RegionContext';
import RegionModal from './components/RegionModal';
import PostHogPageviewTracker from './components/PostHogPageviewTracker';

// Lazy Load Pages for Performance
const Discover = lazy(() => import('./pages/Discover'));
const VibeCoder = lazy(() => import('./pages/VibeCoder'));
const SpinHistory = lazy(() => import('./pages/SpinHistory'));
const CineSpin = lazy(() => import('./pages/CineSpin'));
const Details = lazy(() => import('./pages/Details'));
const GamesHub = lazy(() => import('./pages/games/GamesHub'));
const TriviaGame = lazy(() => import('./pages/games/TriviaGame'));
const HigherLowerGame = lazy(() => import('./pages/games/HigherLowerGame'));

// SEO Landing Pages
const LikeMoviePage = lazy(() => import('./pages/LikeMoviePage'));
const PlatformPage = lazy(() => import('./pages/PlatformPage'));
const ToolPage = lazy(() => import('./pages/ToolPage'));

// Loading Fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
     <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  // Splash screen only shows on first launch per session
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splash_shown');
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('splash_shown', 'true');
    setShowSplash(false);
  };

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <div className="bg-background text-text-primary min-h-screen font-sans">
      <RegionProvider>
        <Router>
          <PostHogPageviewTracker />
          <SpeedInsights />
          <Analytics />
          <InstallPrompt />
          <RegionModal />
          <MobileLayout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Main App Routes */}
              <Route path="/" element={<CineSpin />} />
              <Route path="/chat" element={<VibeCoder />} />
              <Route path="/history" element={<SpinHistory />} />
              <Route path="/discover" element={<Discover />} />
              
              {/* Games Routes */}
              <Route path="/games" element={<GamesHub />} />
              <Route path="/games/trivia" element={<TriviaGame />} />
              <Route path="/games/higher-lower" element={<HigherLowerGame />} />
              
              {/* Details Routes */}
              <Route path="/movie/:id" element={<Details />} />
              <Route path="/tv/:id" element={<Details />} />
              
              {/* SEO Landing Pages - Bucket C: "Movies Like X" */}
              <Route path="/like/:slug" element={<LikeMoviePage />} />
              
              {/* SEO Landing Pages - Bucket B: Platform-Specific */}
              <Route path="/netflix/:slug" element={<PlatformPage />} />
              <Route path="/disney/:slug" element={<PlatformPage />} />
              <Route path="/prime/:slug" element={<PlatformPage />} />
              <Route path="/hbo/:slug" element={<PlatformPage />} />
              <Route path="/apple/:slug" element={<PlatformPage />} />
              
              {/* SEO Landing Pages - Bucket A: Tools */}
              <Route path="/tools/:slug" element={<ToolPage />} />
            </Routes>
          </Suspense>
        </MobileLayout>
        </Router>
      </RegionProvider>
    </div>
  );
}

export default App;
