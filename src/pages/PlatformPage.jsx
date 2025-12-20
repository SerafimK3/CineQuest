import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { discover, getImageUrl } from '../services/tmdb';
import { useRegion } from '../contexts/RegionContext';
import { Sparkles, Play, Film, ArrowRight, Tv } from 'lucide-react';

// Platform configuration
const PLATFORMS = {
  netflix: {
    name: 'Netflix',
    providerId: 8,
    color: 'from-red-600 to-red-800',
    accent: 'text-red-500',
  },
  disney: {
    name: 'Disney+',
    providerId: 337,
    color: 'from-blue-600 to-blue-900',
    accent: 'text-blue-400',
  },
  prime: {
    name: 'Amazon Prime',
    providerId: 9,
    color: 'from-cyan-500 to-blue-700',
    accent: 'text-cyan-400',
  },
  hbo: {
    name: 'HBO Max',
    providerId: 384,
    color: 'from-purple-600 to-purple-900',
    accent: 'text-purple-400',
  },
  apple: {
    name: 'Apple TV+',
    providerId: 350,
    color: 'from-gray-700 to-gray-900',
    accent: 'text-gray-300',
  },
};

// Parse slug to readable text
const parseSlug = (slug) => {
  if (!slug) return '';
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

const PlatformPage = () => {
  const { platform, slug } = useParams();
  const { userRegion } = useRegion();
  const location = useLocation();
  
  const platformConfig = PLATFORMS[platform] || PLATFORMS.netflix;
  const categoryText = parseSlug(slug);
  
  const pageTitle = `${categoryText} on ${platformConfig.name}`;
  const metaDescription = `Discover the ${categoryText.toLowerCase()} on ${platformConfig.name}. Updated daily with real-time availability for your region.`;
  
  const [movies, setMovies] = useState([]);
  const [tvShows, setTvShows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Determine media type from slug
  const isTV = slug?.includes('series') || slug?.includes('shows') || slug?.includes('tv');

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        // Determine sort and filters based on slug
        let filters = {
          with_watch_providers: platformConfig.providerId,
          watch_region: userRegion || 'US',
          'vote_count.gte': 50,
        };

        // Customize filters based on slug keywords
        if (slug?.includes('hidden-gems')) {
          filters.sort_by = 'vote_average.desc';
          filters['vote_count.gte'] = 100;
          filters['vote_count.lte'] = 5000;
        } else if (slug?.includes('best') || slug?.includes('top')) {
          filters.sort_by = 'vote_average.desc';
          filters['vote_count.gte'] = 500;
        } else if (slug?.includes('new') || slug?.includes('latest')) {
          filters.sort_by = 'release_date.desc';
        } else {
          filters.sort_by = 'popularity.desc';
        }

        // Genre-specific
        if (slug?.includes('action')) filters.with_genres = 28;
        if (slug?.includes('comedy')) filters.with_genres = 35;
        if (slug?.includes('horror')) filters.with_genres = 27;
        if (slug?.includes('drama')) filters.with_genres = 18;
        if (slug?.includes('thriller')) filters.with_genres = 53;
        if (slug?.includes('romantic') || slug?.includes('romance')) filters.with_genres = 10749;
        if (slug?.includes('animated') || slug?.includes('animation')) filters.with_genres = 16;
        if (slug?.includes('documentary')) filters.with_genres = 99;
        if (slug?.includes('sci-fi') || slug?.includes('scifi')) filters.with_genres = 878;

        // Fetch movies
        const movieResults = await discover('movie', filters, userRegion);
        setMovies(movieResults?.slice(0, 12) || []);

        // Also fetch TV shows
        const tvResults = await discover('tv', filters, userRegion);
        setTvShows(tvResults?.slice(0, 8) || []);

      } catch (error) {
        console.error('Failed to fetch platform content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [platform, slug, userRegion]);

  return (
    <>
      <Helmet>
        <title>{pageTitle} | CineQuest</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <link rel="canonical" href={`https://cinequest.app/${platform}/${slug}`} />
      </Helmet>

      <div className="min-h-screen bg-black text-white font-sans">
        {/* Hero Section */}
        <div className={`bg-linear-to-br ${platformConfig.color} py-16 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 container mx-auto px-4 text-center">
            <span className={`inline-block ${platformConfig.accent} text-sm font-bold uppercase tracking-widest mb-4`}>
              {platformConfig.name}
            </span>
            <h1 className="text-4xl md:text-6xl font-black mb-4">
              {categoryText}
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
              Updated daily with real-time availability in {userRegion || 'your region'}.
            </p>

            {/* CTA */}
            <Link 
              to="/chat"
              state={{ prefilledPrompt: `${categoryText} on ${platformConfig.name}` }}
              className="inline-flex items-center gap-3 bg-white text-black font-black text-lg px-8 py-4 rounded-full hover:scale-105 transition-transform"
            >
              <Sparkles size={24} />
              Get AI Recommendations
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        {/* Movies Section */}
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <Film className={platformConfig.accent} />
            Movies
          </h2>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : movies.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {movies.map(movie => (
                <Link 
                  key={movie.id} 
                  to={`/movie/${movie.id}-${(movie.title || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`}
                  className="group"
                >
                  <div className="relative aspect-2/3 rounded-xl overflow-hidden bg-gray-900 shadow-lg">
                    {movie.poster_path ? (
                      <img 
                        src={getImageUrl(movie.poster_path, 'w342')} 
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <Film className="text-gray-600" size={32} />
                      </div>
                    )}
                  </div>
                  <h3 className="mt-2 font-bold text-xs group-hover:text-accent transition-colors line-clamp-1">
                    {movie.title}
                  </h3>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No movies available in your region for this category.</p>
          )}
        </div>

        {/* TV Shows Section */}
        {tvShows.length > 0 && (
          <div className="container mx-auto px-4 py-12 border-t border-gray-800">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <Tv className={platformConfig.accent} />
              TV Shows
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tvShows.map(show => (
                <Link 
                  key={show.id} 
                  to={`/tv/${show.id}-${(show.name || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`}
                  className="group"
                >
                  <div className="relative aspect-2/3 rounded-xl overflow-hidden bg-gray-900 shadow-lg">
                    {show.poster_path ? (
                      <img 
                        src={getImageUrl(show.poster_path, 'w342')} 
                        alt={show.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <Tv className="text-gray-600" size={32} />
                      </div>
                    )}
                  </div>
                  <h3 className="mt-2 font-bold text-xs group-hover:text-accent transition-colors line-clamp-1">
                    {show.name}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SEO Content */}
        <div className="container mx-auto px-4 py-12 border-t border-gray-800">
          <div className="max-w-3xl mx-auto text-gray-400 text-sm leading-relaxed">
            <h2 className="text-xl font-bold text-white mb-4">About {categoryText} on {platformConfig.name}</h2>
            <p>
              Finding the {categoryText.toLowerCase()} on {platformConfig.name} can be overwhelming with thousands of options. 
              CineQuest helps you cut through the noise with AI-powered recommendations tailored to your taste.
              Our data is updated daily to reflect the latest additions and removals in your region.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlatformPage;
