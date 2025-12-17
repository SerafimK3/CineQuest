import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Film } from 'lucide-react';
import { getImageUrl } from '../services/tmdb';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

const MovieCard = ({ movie, type, enableSwipe = false, onSwipeLeft, onSwipeRight }) => {
  const [gone, setGone] = useState(false); // Track if card has been swiped away
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const [{ x, rot }, api] = useSpring(() => ({ 
      x: 0, 
      rot: 0, 
      config: { friction: 50, tension: 200 } 
  }));

  const bind = useDrag(({ down, movement: [mx], velocity: [vx], direction: [xDir] }) => {
      if (!enableSwipe || gone) return;

      const trigger = vx > 0.2; // Velocity threshold
      const dir = xDir < 0 ? -1 : 1; // Direction

      if (!down && trigger && Math.abs(mx) > 50) {
          // Swipe Triggered
          setGone(true);
          const isRight = dir === 1;
          const endX = (200 + window.innerWidth) * dir;
          
          api.start({ x: endX, rot: dir * 10, config: { friction: 50, tension: 200 } });

          // Callbacks
          if (isRight && onSwipeRight) onSwipeRight();
          if (!isRight && onSwipeLeft) onSwipeLeft();
      } else {
          // Dragging or Snap Back
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

  // Apply gestures only if enabled
  const AnimatedLink = enableSwipe ? animated(Link) : Link;
  const gestureProps = enableSwipe ? bind() : {};
  const styleProps = enableSwipe ? { x, rotate: rot, touchAction: 'none' } : {};

  return (
    <AnimatedLink 
        to={`/${mediaType}/${movie.id}`} 
        className={`block group ${gone ? 'pointer-events-none' : ''}`}
        style={styleProps}
        {...gestureProps}
    >
      <div className={`relative overflow-hidden rounded-lg shadow-lg bg-surface transition ${!enableSwipe ? 'transform group-hover:scale-105' : ''}`}>
        <div className="aspect-[2/3] w-full relative">
          {movie.poster_path ? (
            <>
              {/* Skeleton Loader (Reduces CLS) */}
              {!isImageLoaded && (
                  <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
                      <Film className="text-gray-700 w-12 h-12" />
                  </div>
              )}
              <img 
                src={getImageUrl(movie.poster_path, 'w780')} 
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
          
          {/* Overlay Hints for Swipe */}
          {enableSwipe && (
              <>
                <div className="absolute top-4 left-4 border-2 border-green-500 text-green-500 px-2 py-1 rounded font-black text-2xl uppercase opacity-0 -rotate-12 transition-opacity" style={{ opacity: x.to(val => (val > 50 ? val / 200 : 0)) }}>
                    LIKE
                </div>
                <div className="absolute top-4 right-4 border-2 border-red-500 text-red-500 px-2 py-1 rounded font-black text-2xl uppercase opacity-0 rotate-12 transition-opacity" style={{ opacity: x.to(val => (val < -50 ? Math.abs(val) / 200 : 0)) }}>
                    NOPE
                </div>
              </>
          )}

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
    </AnimatedLink>
  );
};

export default MovieCard;
