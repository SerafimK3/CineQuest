import React, { useEffect, useState } from 'react';
import { getTrending } from '../services/tmdb';
import MovieCard from '../components/MovieCard';
import HeroSlider from '../components/HeroSlider';

const Home = () => {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [heroMovies, setHeroMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const initHome = async () => {
      try {
        // Fetch Top 5 Today for Hero
        const todayTrending = await getTrending('movie', 'day');
        setHeroMovies(todayTrending.slice(0, 5));

        // Fetch Weekly Trending for Grid
        const weekTrending = await getTrending('movie', 'week', 1);
        setTrendingMovies(weekTrending);
      } catch (error) {
        console.error("Failed to fetch movies:", error);
      } finally {
        setLoading(false);
      }
    };

    initHome();
  }, []);

  const fetchTrending = async (pageNum) => {
    try {
      const movies = await getTrending('movie', 'week', pageNum);
      // Filter out duplicates based on ID
      setTrendingMovies(prev => {
        const newMovies = movies.filter(m => !prev.some(p => p.id === m.id));
        return [...prev, ...newMovies];
      });
    } catch (error) {
      console.error("Failed to fetch more movies:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTrending(nextPage);
  };

  return (
    <div className="min-h-screen">
      {!loading && <HeroSlider movies={heroMovies} />}
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-text-primary">Trending This Week</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-8">
            {trendingMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
          
          <div className="flex justify-center">
            <button 
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="bg-accent hover:bg-accent-hover text-white font-bold py-3 px-8 rounded-full transition disabled:opacity-50 flex items-center gap-2"
            >
              {loadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Loading...
                </>
              ) : (
                'Show 20 More'
              )}
            </button>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default Home;
