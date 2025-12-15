import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { getImageUrl } from '../services/tmdb';

const MovieCard = ({ movie, type }) => {
  if (!movie) return null;
  
  const title = movie.title || movie.name;
  const date = movie.release_date || movie.first_air_date;
  const year = date ? new Date(date).getFullYear() : 'N/A';
  
  // Determine media type: explicit prop > object property > default 'movie'
  const mediaType = type || movie.media_type || 'movie';

  return (
    <Link to={`/${mediaType}/${movie.id}`} className="block group">
      <div className="relative overflow-hidden rounded-lg shadow-lg bg-surface transition transform group-hover:scale-105">
        <div className="aspect-[2/3] w-full">
          {movie.poster_path ? (
            <img 
              src={getImageUrl(movie.poster_path, 'w500')} 
              alt={title} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400">
              No Image
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

export default MovieCard;
