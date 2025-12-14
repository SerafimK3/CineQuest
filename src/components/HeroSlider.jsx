import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Info, Play } from 'lucide-react';
import { getImageUrl } from '../services/tmdb';

const HeroSlider = ({ movies }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!movies || movies.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [movies]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="relative w-full h-[60vh] md:h-[70vh] mb-10 group overflow-hidden shadow-2xl">
      {/* Slider Track */}
      <div 
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {movies.map((movie) => (
          <div key={movie.id} className="min-w-full h-full relative">
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${getImageUrl(movie.backdrop_path, 'original')})` 
              }}
            >
              <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent"></div>
              <div className="absolute inset-0 bg-linear-to-r from-background via-background/40 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-10 flex flex-col justify-end h-full items-start">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-4 drop-shadow-lg tracking-tight max-w-3xl leading-tight">
                {movie.title}
              </h2>
              <p className="text-gray-200 text-lg md:text-xl mb-8 max-w-2xl line-clamp-3 drop-shadow-md">
                {movie.overview}
              </p>
              
              <div className="flex space-x-4">
                <Link 
                  to={`/movie/${movie.id}`}
                  className="bg-accent hover:bg-accent-hover text-white px-8 py-3 rounded-full font-bold flex items-center transition-all transform hover:scale-105 shadow-lg shadow-accent/25"
                >
                  <Play size={20} className="mr-2 fill-current" /> Where to Watch
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-accent/80 text-white p-3 rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100 border border-white/10 z-20 cursor-pointer"
      >
        <ChevronLeft size={24} />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-accent/80 text-white p-3 rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100 border border-white/10 z-20 cursor-pointer"
      >
        <ChevronRight size={24} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 right-8 flex space-x-2 z-20">
        {movies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'w-8 bg-accent' : 'w-2 bg-gray-500 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
