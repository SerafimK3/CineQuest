import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Film } from 'lucide-react';
import { getImageUrl, createSlug } from '../services/tmdb';

// Lightweight Card for non-swipable use (Discover, History grids)
// No react-spring overhead - massive performance improvement
const SimpleMovieCard = ({ movie, type }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  if (!movie) return null;

  const title = movie.title || movie.name;
  const date = movie.release_date || movie.first_air_date;
  const year = date ? new Date(date).getFullYear() : 'N/A';
  const mediaType = type || movie.media_type || 'movie';
  const slug = `${movie.id}-${createSlug(title)}`;

  return (
    <Link 
        to={`/${mediaType}/${slug}`} 
        className="block group"
    >
      <div className="relative overflow-hidden rounded-lg shadow-lg bg-surface transition transform group-hover:scale-105">
        <div className="aspect-[2/3] w-full relative">
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
  );
};

// Lazy load the heavy SwipableMovieCard only when needed
const SwipableMovieCard = React.lazy(() => import('./SwipableMovieCard'));

// Main Export - decides which card to render
const MovieCard = ({ movie, type, enableSwipe = false, onSwipeLeft, onSwipeRight }) => {
  if (enableSwipe) {
    return (
      <React.Suspense fallback={<SimpleMovieCard movie={movie} type={type} />}>
        <SwipableMovieCard 
          movie={movie} 
          type={type} 
          onSwipeLeft={onSwipeLeft} 
          onSwipeRight={onSwipeRight} 
        />
      </React.Suspense>
    );
  }
  
  return <SimpleMovieCard movie={movie} type={type} />;
};

export default MovieCard;
