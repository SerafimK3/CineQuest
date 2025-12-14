import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Discover from './pages/Discover';
import Search from './pages/Search';
import Details from './pages/Details';
import Randomizer from './pages/Randomizer';
import Trivia from './pages/Trivia';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-text-primary">
        <NavBar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/search" element={<Search />} />
            <Route path="/movie/:id" element={<Details />} />
            <Route path="/random" element={<Randomizer />} />
            <Route path="/trivia" element={<Trivia />} />
            {/* Add more routes here */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
