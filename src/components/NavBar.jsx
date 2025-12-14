import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Film, Shuffle, Search } from 'lucide-react';

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
            <Link to="/" className="hover:text-accent transition">Home</Link>
            <Link to="/discover" className="hover:text-accent transition">Discover</Link>
            <Link to="/random" className="flex items-center space-x-1 hover:text-accent transition">
              <Shuffle size={18} />
              <span>Randomizer</span>
            </Link>
            <Link to="/trivia" className="flex items-center space-x-1 hover:text-accent transition text-orange-400 font-bold">
              <span className="text-xl">🎮</span>
              <span>Trivia</span>
            </Link>
            
            <div className="relative group">
              <input
                type="text"
                placeholder="Search..."
                onChange={handleSearch}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/search?q=${e.target.value}`);
                  }
                }}
                className="bg-gray-800 text-text-primary rounded-full px-4 py-1 pl-10 focus:outline-none focus:ring-2 focus:ring-accent w-32 focus:w-64 transition-all duration-300"
              />
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
            </div>
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
            <Link to="/" className="block px-3 py-2 rounded-md hover:bg-gray-700 hover:text-accent" onClick={() => setIsOpen(false)}>Home</Link>
            <Link to="/discover" className="block px-3 py-2 rounded-md hover:bg-gray-700 hover:text-accent" onClick={() => setIsOpen(false)}>Discover</Link>
            <Link to="/random" className="block px-3 py-2 rounded-md hover:bg-gray-700 hover:text-accent" onClick={() => setIsOpen(false)}>Randomizer</Link>
            <Link to="/trivia" className="block px-3 py-2 rounded-md hover:bg-gray-700 text-orange-400 font-bold" onClick={() => setIsOpen(false)}>Trivia 🎮</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
