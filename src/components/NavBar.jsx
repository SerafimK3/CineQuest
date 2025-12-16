import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Film, Shuffle, Search, Gamepad2 } from 'lucide-react';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    const query = e.target.value;
    if (query.length >= 3) {
      navigate(`/search?q=${query}`, { replace: true });
    }
  };

  return (
    <nav className="bg-surface text-text-primary shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 text-2xl font-black tracking-tighter">
            <Film size={28} className="text-accent" />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-accent to-purple-500">
              CineQuest
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/chat" className="hover:text-accent transition font-bold flex items-center gap-1">
                 <span className="text-purple-400">AI</span> Vibe
            </Link>
            <Link to="/discover" className="hover:text-accent transition">Discover</Link>
            <Link to="/games" className="hover:text-accent transition font-bold text-orange-400">Games</Link>
            <Link to="/history" className="hover:text-accent transition text-gray-400">History</Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-surface border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block px-3 py-2 rounded-md hover:bg-gray-700 hover:text-accent" onClick={() => setIsOpen(false)}>Spin (Home)</Link>
            <Link to="/chat" className="block px-3 py-2 rounded-md hover:bg-gray-700 hover:text-accent" onClick={() => setIsOpen(false)}>Movie Oracle</Link>
            <Link to="/discover" className="block px-3 py-2 rounded-md hover:bg-gray-700 hover:text-accent" onClick={() => setIsOpen(false)}>Discover</Link>
            <Link to="/games" className="block px-3 py-2 rounded-md hover:bg-gray-700 text-orange-400 font-bold" onClick={() => setIsOpen(false)}>Games 🎮</Link>
            <Link to="/history" className="block px-3 py-2 rounded-md hover:bg-gray-700 text-gray-400" onClick={() => setIsOpen(false)}>History</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
