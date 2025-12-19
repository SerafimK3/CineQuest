import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getDetails, getImageUrl, parseIdFromSlug } from '../services/tmdb';
import { useRegion } from '../contexts/RegionContext';
import MovieCard from '../components/MovieCard';
import SeasonEpisodes from '../components/SeasonEpisodes';
import { Star, Clock, Calendar, Play, ChevronDown, Check, Search as SearchIcon } from 'lucide-react';



const PRIORITY_REGIONS = [
  "US", "GB", "CA", "AU", "DE", "FR", "IT", "ES", "PT", "NL", "BE", "CH", "AT", "SE", "NO", "DK", "FI", "IE", 
  "RU", "PL", "CZ", "HU", "GR", "TR", "BG", "RO", "UA", "IN", "JP", "KR", "CN", "TW", "HK", "TH", "VN", "ID", 
  "MY", "SG", "PH", "BR", "MX", "AR", "CL", "CO", "PE", "VE", "ZA", "EG", "SA", "AE", "IL", "NZ"
];

const PROVIDER_URLS = {
  "Netflix": "https://www.netflix.com",
  "Disney Plus": "https://www.disneyplus.com",
  "Amazon Prime Video": "https://www.amazon.com/primevideo",
  "Apple TV Plus": "https://tv.apple.com",
  "Apple TV": "https://tv.apple.com",
  "Hulu": "https://www.hulu.com",
  "Max": "https://www.max.com",
  "HBO Max": "https://www.max.com",
  "Peacock": "https://www.peacocktv.com",
  "Peacock Premium": "https://www.peacocktv.com",
  "Paramount Plus": "https://www.paramountplus.com",
  "YouTube": "https://www.youtube.com",
  "YouTube Premium": "https://www.youtube.com",
  "Google Play Movies": "https://play.google.com/store/movies",
  "Crunchyroll": "https://www.crunchyroll.com",
};

const getProviderLink = (providerName, title) => {
    const baseUrl = PROVIDER_URLS[providerName];
    if (baseUrl) return baseUrl;
    return `https://www.google.com/search?q=watch+${encodeURIComponent(title)}+on+${encodeURIComponent(providerName)}`;
};

const tryGetRegionName = (code, regionNames) => {
    try {
        return regionNames.of(code);
    } catch {
        return code;
    }
};

const RegionSelector = ({ currentRegion, onRegionChange, availableRegions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

  // Merge available regions with priority regions to ensure major countries are always listable
  const allRegionCodes = Array.from(new Set([...availableRegions, ...PRIORITY_REGIONS]));

  const regions = allRegionCodes
    .map(code => {
      try {
        return { code, name: regionNames.of(code) };
      } catch (e) {
        return { code, name: code };
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredRegions = regions.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <button 
        onClick={() => {
            setIsOpen(!isOpen);
            setSearchTerm(''); // Reset search on open
        }}
        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-text-primary px-4 py-2 rounded-lg transition border border-gray-600 shadow-sm min-w-[160px] justify-between"
      >
        <span className="truncate">{tryGetRegionName(currentRegion, regionNames)}</span>
        <ChevronDown size={16} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden flex flex-col">
           <div className="p-2 bg-gray-800 border-b border-gray-700">
              <div className="relative">
                <SearchIcon size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input 
                    type="text"
                    placeholder="Search country..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-900 text-sm text-text-primary pl-9 pr-3 py-2 rounded border border-gray-700 focus:outline-none focus:border-accent"
                    autoFocus
                />
              </div>
           </div>
           
           <div className="overflow-y-auto">
                <div className="p-2 sticky top-0 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 z-10">
                    <span className="text-xs text-secondary font-bold px-2 uppercase tracking-wider text-gray-500">
                        {filteredRegions.length} Countries
                    </span>
                </div>
               {filteredRegions.map((r) => (
                 <button
                   key={r.code}
                   onClick={() => {
                     onRegionChange(r.code);
                     setIsOpen(false);
                   }}
                   className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition flex justify-between items-center ${currentRegion === r.code ? 'text-accent font-bold bg-accent/10' : 'text-gray-300'}`}
                 >
                   <div className="flex items-center gap-2">
                        <span>{r.name}</span>
                        {/* Show a small indicator if this region actually has data */}
                        {availableRegions.includes(r.code) && (
                          <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-500/20">
                            <Check size={10} /> Available
                          </span>
                        )}
                   </div>
                   {currentRegion === r.code && <span className="w-2 h-2 rounded-full bg-accent"></span>}
                 </button>
               ))}
               {filteredRegions.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">No countries found.</div>
               )}
           </div>
        </div>
      )}
    </div>
  );
};

const ReviewCard = ({ review }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.content.length > 300;

  return (
    <div 
      className={`bg-surface p-6 rounded-xl border border-gray-800 shadow-md transition-all ${isLong ? 'cursor-pointer hover:border-gray-600' : ''}`}
      onClick={() => isLong && setExpanded(!expanded)}
    >
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-accent text-lg">{review.author}</h4>
        {review.author_details?.rating && (
          <span className="flex items-center gap-1 text-yellow-500 font-bold bg-yellow-500/10 px-2 py-1 rounded">
            <Star size={14} fill="currentColor" /> {review.author_details.rating}
          </span>
        )}
      </div>
      <p className={`text-gray-300 leading-relaxed text-sm ${expanded ? '' : 'line-clamp-4'}`}>
        "{review.content}"
      </p>
      {isLong && (
        <span className="text-accent text-xs mt-2 block font-bold uppercase tracking-wider">
          {expanded ? 'Show Less' : 'Read More'}
        </span>
      )}
    </div>
  );
};

const Details = () => {
  const { id: slugId } = useParams();
  const location = useLocation();
  const mediaType = location.pathname.includes('/tv/') ? 'tv' : 'movie';
  
  // Parse actual ID from slug (e.g., "1398-the-sopranos" -> "1398")
  const id = parseIdFromSlug(slugId);

  const { userRegion } = useRegion();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState(userRegion || 'US');

  useEffect(() => {
    if (userRegion) {
        setRegion(userRegion);
    }
  }, [userRegion]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await getDetails(mediaType, id);
        setMovie(data);
      } catch (error) {
        console.error("Failed to fetch details:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetails();
  }, [id, mediaType]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!movie) return <div className="text-center text-text-primary py-20">Content not found</div>;

  const providers = movie['watch/providers']?.results?.[region];
  const flatrate = providers?.flatrate || [];
  const rent = providers?.rent || [];
  const buy = providers?.buy || [];

  // Normalize Data for TV vs Movie
  const title = movie.title || movie.name;
  const releaseDate = movie.release_date || movie.first_air_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
  const runtime = movie.runtime || (movie.episode_run_time?.length > 0 ? movie.episode_run_time[0] : null);

  return (
    <div className="relative">
      {/* Backdrop */}
      <div 
        className="absolute top-0 left-0 w-full h-[30vh] md:h-[50vh] bg-cover bg-top z-0"
        style={{ backgroundImage: `url(${getImageUrl(movie.backdrop_path, 'original')})` }}
      >
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-background"></div>
      </div>

      <div className="container mx-auto px-4 pt-[30vh] md:pt-[50vh] relative z-10 pb-20">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="w-full md:w-1/3 lg:w-1/4">
            <img 
              src={getImageUrl(movie.poster_path, 'w500')} 
              alt={title} 
              className="w-full rounded-lg shadow-2xl border-4 border-surface"
            />
          </div>

          {/* Info */}
          <div className="w-full md:w-2/3 lg:w-3/4 text-text-primary">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-text-secondary mb-6">
              <span className="flex items-center gap-1"><Star size={16} className="text-yellow-400" fill="currentColor"/> {movie.vote_average?.toFixed(1)}</span>
              {runtime && <span className="flex items-center gap-1"><Clock size={16} /> {runtime} min</span>}
              {movie.number_of_seasons && <span className="flex items-center gap-1 text-accent font-bold">{movie.number_of_seasons} Seasons</span>}
              <span className="flex items-center gap-1"><Calendar size={16} /> {releaseYear}</span>
              <div className="flex gap-2">
                {movie.genres.map(g => (
                  <span key={g.id} className="bg-gray-700 px-2 py-1 rounded text-xs">{g.name}</span>
                ))}
              </div>
            </div>

            <p className="text-lg text-text-secondary mb-8 leading-relaxed">{movie.overview}</p>

            {/* Streaming Section */}
            <div className="bg-surface p-6 rounded-lg mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Play size={20} className="text-accent" /> Where to Watch
                </h3>
                <RegionSelector 
                  currentRegion={region} 
                  onRegionChange={setRegion} 
                  availableRegions={movie['watch/providers']?.results ? Object.keys(movie['watch/providers'].results) : []}
                />
              </div>

              {!providers ? (
                <p className="text-text-secondary">No streaming information available for this region.</p>
              ) : (
                <div className="space-y-4">
                  {flatrate.length > 0 && (
                    <div>
                      <h4 className="text-sm text-text-secondary mb-2">Stream</h4>
                      <div className="flex flex-wrap gap-3">
                        {flatrate.map(p => (
                          <a 
                            key={p.provider_id}
                            href={getProviderLink(p.provider_name, title)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:scale-110 transition-transform duration-200"
                          >
                            <img 
                                src={getImageUrl(p.logo_path, 'w92')} 
                                alt={p.provider_name} 
                                title={`Watch on ${p.provider_name}`}
                                className="w-10 h-10 rounded-md shadow-md"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {rent.length > 0 && (
                    <div>
                      <h4 className="text-sm text-text-secondary mb-2">Rent</h4>
                      <div className="flex flex-wrap gap-3">
                        {rent.map(p => (
                          <a 
                            key={p.provider_id}
                            href={getProviderLink(p.provider_name, title)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:scale-110 transition-transform duration-200"
                          >
                            <img 
                                src={getImageUrl(p.logo_path, 'w92')} 
                                alt={p.provider_name} 
                                title={`Rent on ${p.provider_name}`}
                                className="w-10 h-10 rounded-md shadow-md"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {buy.length > 0 && (
                    <div>
                      <h4 className="text-sm text-text-secondary mb-2">Buy</h4>
                      <div className="flex flex-wrap gap-3">
                        {buy.map(p => (
                          <a 
                            key={p.provider_id}
                            href={getProviderLink(p.provider_name, title)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:scale-110 transition-transform duration-200"
                          >
                            <img 
                                src={getImageUrl(p.logo_path, 'w92')} 
                                alt={p.provider_name} 
                                title={`Buy on ${p.provider_name}`}
                                className="w-10 h-10 rounded-md shadow-md"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* TV Show Episodes Browser */}
            {mediaType === 'tv' && movie.seasons && (
              <SeasonEpisodes tvId={id} seasons={movie.seasons} />
            )}
          </div>
        </div>

        {/* Full Width Sections */}
        <div className="mt-12 space-y-12">
          {/* Cast Section */}
          {movie.credits?.cast?.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold mb-6 text-text-primary border-l-4 border-accent pl-2">Top Cast</h3>
              <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide snap-x snap-mandatory">
                {movie.credits.cast.slice(0, 15).map(person => (
                  <div key={person.id} className="min-w-[120px] w-[120px] text-center shrink-0 snap-start">
                    <div className="w-28 h-28 rounded-full overflow-hidden mb-3 mx-auto border-2 border-gray-700 shadow-lg">
                      {person.profile_path ? (
                        <img 
                          src={getImageUrl(person.profile_path, 'w185')} 
                          alt={person.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">No Image</div>
                      )}
                    </div>
                    <p className="text-sm font-bold text-text-primary truncate">{person.name}</p>
                    <p className="text-xs text-text-secondary truncate">{person.character}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trailer Section */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-text-primary border-l-4 border-accent pl-2">Trailer</h3>
            {movie.videos?.results?.find(v => v.type === "Trailer" && v.site === "YouTube") ? (
              <div className="aspect-video w-full rounded-xl overflow-hidden shadow-2xl">
                <iframe 
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${movie.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube").key}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="bg-surface p-8 rounded-xl text-center border border-gray-800">
                 <p className="text-text-secondary text-lg">No trailer available for this title yet.</p>
              </div>
            )}
          </div>

          {/* Reviews Section */}
          {movie.reviews?.results?.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold mb-6 text-text-primary border-l-4 border-accent pl-2">User Reviews</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {movie.reviews.results.slice(0, 4).map(review => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </div>
          )}

          {/* Similar Movies Section */}
          {movie.similar?.results?.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold mb-6 text-text-primary border-l-4 border-accent pl-2">You Might Also Like</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {movie.similar.results.slice(0, 10).map(similar => (
                  <MovieCard key={similar.id} movie={similar} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Details;
