import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"
import MobileLayout from './layouts/MobileLayout';
import InstallPrompt from './components/InstallPrompt';

// Lazy Load Pages for Performance
const Discover = lazy(() => import('./pages/Discover'));
const VibeCoder = lazy(() => import('./pages/VibeCoder'));
const SpinHistory = lazy(() => import('./pages/SpinHistory'));
const CineSpin = lazy(() => import('./pages/CineSpin'));
const Details = lazy(() => import('./pages/Details'));
const GamesHub = lazy(() => import('./pages/games/GamesHub'));
const TriviaGame = lazy(() => import('./pages/games/TriviaGame'));
const HigherLowerGame = lazy(() => import('./pages/games/HigherLowerGame'));

// Loading Fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
     <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <div className="bg-background text-text-primary min-h-screen font-sans">
      <Router>
        <SpeedInsights />
        <Analytics />
        <InstallPrompt />
        <MobileLayout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<CineSpin />} />
              <Route path="/chat" element={<VibeCoder />} />
              <Route path="/history" element={<SpinHistory />} />
              
              <Route path="/discover" element={<Discover />} />
              {/* Search Route Removed - Legacy */}
              
              {/* Games Routes */}
              <Route path="/games" element={<GamesHub />} />
              <Route path="/games/trivia" element={<TriviaGame />} />
              <Route path="/games/higher-lower" element={<HigherLowerGame />} />
              
              <Route path="/movie/:id" element={<Details />} />
              <Route path="/tv/:id" element={<Details />} />
            </Routes>
          </Suspense>
        </MobileLayout>
      </Router>
    </div>
  );
}

export default App;
