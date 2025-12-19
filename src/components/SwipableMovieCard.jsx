import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Film } from 'lucide-react';
import { getImageUrl, createSlug } from '../services/tmdb';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

// Full Swipable Card with animations (only for VibeCoder)
const SwipableMovieCard = ({ movie, type, onSwipeLeft, onSwipeRight }) => {
  const [gone, setGone] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const [{ x, rot }, api] = useSpring(() => ({ 
      x: 0, 
      rot: 0, 
      config: { friction: 50, tension: 200 } 
  }));

  const bind = useDrag(({ down, movement: [mx], velocity: [vx], direction: [xDir] }) => {
      if (gone) return;

      const trigger = vx > 0.2;
      const dir = xDir < 0 ? -1 : 1;

      if (!down && trigger && Math.abs(mx) > 50) {
          setGone(true);
          const isRight = dir === 1;
          const endX = (200 + window.innerWidth) * dir;
          
          api.start({ x: endX, rot: dir * 10, config: { friction: 50, tension: 200 } });

          if (isRight && onSwipeRight) onSwipeRight();
          if (!isRight && onSwipeLeft) onSwipeLeft();
      } else {
          api.start({ 
              x: down ? mx : 0, 
              rot: down ? mx / 20 : 0, 
              immediate: down 
          });
      }
  });

  if (!movie) return null;

  const title = movie.title || movie.name;
  const date = movie.release_date || movie.first_air_date;
  const year = date ? new Date(date).getFullYear() : 'N/A';
  const mediaType = type || movie.media_type || 'movie';
  const slug = `${movie.id}-${createSlug(title)}`;

  return (
    <animated.div 
        style={{ x, rotate: rot, touchAction: 'none' }}
        {...bind()}
        className={`block ${gone ? 'pointer-events-none' : ''}`}
    >
      <Link to={`/${mediaType}/${slug}`}>
        <div className="relative overflow-hidden rounded-lg shadow-lg bg-surface">
          <div className="aspect-2/3 w-full relative">
            {movie.poster_path ? (
              <>
                {!isImageLoaded && (
                    <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
                        <Film className="text-gray-700 w-12 h-12" />
                    </div>
                )}
                <img 
                  src={getImageUrl(movie.poster_path, 'w500')} 
                  alt={title} 
                  width="500"
                  height="750"
                  className={`w-full h-full object-cover pointer-events-none select-none transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setIsImageLoaded(true)}
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
                <span className="text-xs font-bold uppercase tracking-widest">No Image</span>
              </div>
            )}
            
            {/* Swipe Hints */}
            <animated.div 
              className="absolute top-4 left-4 border-2 border-green-500 text-green-500 px-2 py-1 rounded font-black text-2xl uppercase -rotate-12"
              style={{ opacity: x.to(val => (val > 50 ? val / 200 : 0)) }}
            >
              LIKE
            </animated.div>
            <animated.div 
              className="absolute top-4 right-4 border-2 border-red-500 text-red-500 px-2 py-1 rounded font-black text-2xl uppercase rotate-12"
              style={{ opacity: x.to(val => (val < -50 ? Math.abs(val) / 200 : 0)) }}
            >
              NOPE
            </animated.div>
          </div>
          <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded-md flex items-center space-x-1 text-yellow-400 text-sm font-bold">
            <Star size={14} fill="currentColor" />
            <span>{movie.vote_average?.toFixed(1)}</span>
          </div>
          <div className="p-3">
            <h3 className="text-text-primary font-semibold truncate" title={title}>{title}</h3>
            <p className="text-text-secondary text-sm">{year}</p>
          </div>
        </div>
      </Link>
    </animated.div>
  );
};

export default SwipableMovieCard;
