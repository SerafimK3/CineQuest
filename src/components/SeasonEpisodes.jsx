import React, { useState, useEffect } from 'react';
import { getSeasonDetails, getImageUrl } from '../services/tmdb';
import { Play, ChevronDown } from 'lucide-react';
import useIsMobile from '../hooks/useIsMobile';

const SeasonEpisodes = ({ tvId, seasons }) => {
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const isMobile = useIsMobile();

  // Filter out specials (season 0) and sort
  const validSeasons = seasons
    ?.filter(s => s.season_number > 0)
    .sort((a, b) => a.season_number - b.season_number) || [];

  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!tvId || !selectedSeason) return;
      
      setLoading(true);
      setShowAll(false); // Reset when changing season
      try {
        const data = await getSeasonDetails(tvId, selectedSeason);
        setEpisodes(data.episodes || []);
      } catch (error) {
        console.error('Failed to fetch episodes:', error);
        setEpisodes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEpisodes();
  }, [tvId, selectedSeason]);

  if (!validSeasons.length) return null;

  // Responsive initial limit
  // Phone: 4, Tablet: 6, Desktop: 8
  const getInitialLimit = () => {
    if (typeof window === 'undefined') return 8;
    if (window.innerWidth < 640) return 4;      // Phone
    if (window.innerWidth < 1024) return 6;     // Tablet
    return 8;                                    // Desktop
  };

  const initialLimit = getInitialLimit();
  const displayedEpisodes = showAll ? episodes : episodes.slice(0, initialLimit);
  const hasMore = episodes.length > initialLimit;

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold mb-6 text-text-primary border-l-4 border-accent pl-2">
        Episodes
      </h3>

      {/* Season Selector - Horizontal Scroll */}
      <div className="relative mb-6">
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide snap-x snap-mandatory">
          {validSeasons.map(season => (
            <button
              key={season.season_number}
              onClick={() => setSelectedSeason(season.season_number)}
              className={`shrink-0 snap-start px-4 py-2 rounded-full text-sm font-bold transition-all ${
                selectedSeason === season.season_number
                  ? 'bg-accent text-black shadow-lg shadow-accent/30'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              Season {season.season_number}
            </button>
          ))}
        </div>
      </div>

      {/* Episodes Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : episodes.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No episodes available for this season.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedEpisodes.map(episode => (
              <div 
                key={episode.id} 
                className="bg-surface rounded-xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-colors group"
              >
                {/* Episode Thumbnail */}
                <div className="relative aspect-video bg-gray-900">
                  {episode.still_path ? (
                    <img
                      src={getImageUrl(episode.still_path, 'w500')}
                      alt={episode.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <Play className="text-gray-600" size={32} />
                    </div>
                  )}
                  {/* Episode Number Badge */}
                  <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs font-bold text-white">
                    E{episode.episode_number}
                  </div>
                  {/* Runtime Badge */}
                  {episode.runtime && (
                    <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-gray-300">
                      {episode.runtime}m
                    </div>
                  )}
                </div>

                {/* Episode Info */}
                <div className="p-3">
                  <h4 className="font-bold text-text-primary text-sm mb-1 line-clamp-1 group-hover:text-accent transition-colors">
                    {episode.name}
                  </h4>
                  {episode.overview && (
                    <p className="text-gray-500 text-xs line-clamp-2">
                      {episode.overview}
                    </p>
                  )}
                  {/* Air Date */}
                  {episode.air_date && (
                    <p className="text-gray-600 text-xs mt-2">
                      {new Date(episode.air_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Show All Button */}
          {hasMore && !showAll && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowAll(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-full transition-all hover:scale-105 border border-gray-700"
              >
                <ChevronDown size={20} />
                Show All {episodes.length} Episodes
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SeasonEpisodes;
