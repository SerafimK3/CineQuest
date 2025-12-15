import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';

// Lazy Load Pages for Performance
const Home = lazy(() => import('./pages/Home'));
const Discover = lazy(() => import('./pages/Discover'));
const Search = lazy(() => import('./pages/Search'));
const Details = lazy(() => import('./pages/Details'));
const CineSpin = lazy(() => import('./pages/CineSpin'));
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
        <NavBar />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/search" element={<Search />} />
            <Route path="/cinespin" element={<CineSpin />} />
            
            {/* Games Routes */}
            <Route path="/games" element={<GamesHub />} />
            <Route path="/games/trivia" element={<TriviaGame />} />
            <Route path="/games/higher-lower" element={<HigherLowerGame />} />
            
            <Route path="/movie/:id" element={<Details />} />
            <Route path="/tv/:id" element={<Details />} />
          </Routes>
        </Suspense>
      </Router>
    </div>
  );
}

export default App;
