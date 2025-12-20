import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { discover, getDetails, getImageUrl, searchMovies } from '../services/tmdb';
import { useRegion } from '../contexts/RegionContext';
import { Sparkles, Play, RefreshCw, Film, ArrowRight } from 'lucide-react';

// Parse slug to movie name: "movies-like-interstellar" -> "Interstellar"
const parseMovieName = (slug) => {
  if (!slug) return '';
  // Remove "movies-like-" or "shows-like-" prefix
  const cleaned = slug
    .replace(/^movies-like-/i, '')
    .replace(/^shows-like-/i, '')
    .replace(/^like-/i, '')
    .replace(/-/g, ' ');
  // Title case
  return cleaned.replace(/\b\w/g, c => c.toUpperCase());
};

const LikeMoviePage = () => {
  const { slug } = useParams();
  const { userRegion } = useRegion();
  
  const movieName = parseMovieName(slug);
  const pageTitle = `Movies Like ${movieName}`;
  const metaDescription = `Looking for movies similar to ${movieName}? Let AI find the perfect match based on vibe, themes, and style. Free and instant recommendations.`;
  
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sourceMovie, setSourceMovie] = useState(null);

  // Fetch similar movies on load
  useEffect(() => {
    const fetchSimilarMovies = async () => {
      setLoading(true);
      try {
        // First, find the source movie
        const searchResult = await searchMovies(movieName);
        const movies = searchResult?.results || [];
        
        if (movies.length > 0) {
          const source = movies[0];
          setSourceMovie(source);
          
          // Get details with recommendations
          const details = await getDetails('movie', source.id);
          
          // Use TMDB's similar movies
          if (details.similar?.results?.length > 0) {
            setRecommendations(details.similar.results.slice(0, 8));
          } else if (details.recommendations?.results?.length > 0) {
            setRecommendations(details.recommendations.results.slice(0, 8));
          }
        }
      } catch (error) {
        console.error('Failed to fetch similar movies:', error);
      } finally {
        setLoading(false);
      }
    };

    if (movieName) {
      fetchSimilarMovies();
    }
  }, [movieName]);

  return (
    <>
      <Helmet>
        <title>{pageTitle} | CineQuest AI</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <link rel="canonical" href={`https://cinequest.app/like/${slug}`} />
      </Helmet>

      <div className="min-h-screen bg-black text-white font-sans">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background blur from source movie */}
          {sourceMovie?.backdrop_path && (
            <div className="absolute inset-0 z-0">
              <img 
                src={getImageUrl(sourceMovie.backdrop_path, 'w1280')} 
                alt="" 
                className="w-full h-full object-cover opacity-20 blur-sm"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
            </div>
          )}

          <div className="relative z-10 container mx-auto px-4 py-16 text-center">
            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-linear-to-r from-purple-400 via-pink-500 to-red-500">
              {pageTitle}
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Loved <span className="text-white font-bold">{movieName}</span>? Here are movies with the same vibe, style, and energy.
            </p>

            {/* CTA to Spin */}
            <Link 
              to="/chat" 
              state={{ prefilledPrompt: `Movies with the exact same vibe as ${movieName}` }}
              className="inline-flex items-center gap-3 bg-linear-to-r from-accent to-purple-600 text-black font-black text-lg px-8 py-4 rounded-full hover:scale-105 transition-transform shadow-lg shadow-accent/30"
            >
              <Sparkles size={24} />
              Get AI Recommendations
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        {/* Recommendations Grid */}
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <Film className="text-accent" />
            Similar Movies
          </h2>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recommendations.map(movie => (
                <Link 
                  key={movie.id} 
                  to={`/movie/${movie.id}-${(movie.title || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`}
                  className="group"
                >
                  <div className="relative aspect-2/3 rounded-xl overflow-hidden bg-gray-900 shadow-lg">
                    {movie.poster_path ? (
                      <img 
                        src={getImageUrl(movie.poster_path, 'w500')} 
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <Film className="text-gray-600" size={48} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="mt-3 font-bold text-sm group-hover:text-accent transition-colors line-clamp-1">
                    {movie.title}
                  </h3>
                  <p className="text-gray-500 text-xs">
                    {movie.release_date?.split('-')[0] || 'N/A'}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <p>No similar movies found. Try the AI spinner for better results!</p>
            </div>
          )}

          {/* Second CTA */}
          <div className="text-center mt-12">
            <p className="text-gray-400 mb-4">Want more personalized recommendations?</p>
            <Link 
              to="/chat"
              className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-bold px-6 py-3 rounded-full transition-colors"
            >
              <RefreshCw size={18} />
              Try the AI Movie Spinner
            </Link>
          </div>
        </div>

        {/* SEO Content Section */}
        <div className="container mx-auto px-4 py-12 border-t border-gray-800">
          <div className="max-w-3xl mx-auto text-gray-400 text-sm leading-relaxed">
            <h2 className="text-xl font-bold text-white mb-4">Why You'll Love These Movies</h2>
            <p className="mb-4">
              If you enjoyed {movieName}, you're not alone. Millions of viewers have searched for similar movies 
              that capture the same feeling, themes, and storytelling style. CineQuest uses AI to analyze 
              not just genres, but the deeper elements that make movies feel alike.
            </p>
            <p>
              Our recommendations consider pacing, cinematography style, emotional tone, and narrative structure 
              to find movies that truly match your taste. <Link to="/" className="text-accent hover:underline">Try our AI-powered spinner</Link> for 
              even more personalized suggestions.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LikeMoviePage;
