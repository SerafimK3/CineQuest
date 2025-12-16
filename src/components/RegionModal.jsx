import React, { useState, useEffect } from 'react';
import { useRegion } from '../contexts/RegionContext';
import { getCountries } from '../services/tmdb';
import { Search, MapPin, Globe, Check } from 'lucide-react';

const PRIORITY_REGIONS = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "IN", name: "India" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" }
];

const RegionModal = () => {
  const { userRegion, changeRegion, loading } = useRegion();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allCountries, setAllCountries] = useState(PRIORITY_REGIONS);

  useEffect(() => {
    const fetchCountries = async () => {
        try {
            const countries = await getCountries();
            // Map to our format { code: 'US', name: 'United States' }
            const formatted = countries.map(c => ({
                code: c.iso_3166_1,
                name: c.english_name || c.native_name
            }));
            
            // Sort alphabetically
            formatted.sort((a, b) => a.name.localeCompare(b.name));
            setAllCountries(formatted);
        } catch (e) {
            console.error("Failed to fetch countries", e);
            // Fallback to priority list is already in state default
        }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    if (!loading && !userRegion) {
      setIsOpen(true);
    }
  }, [loading, userRegion]);

  // Expand country list logic could go here (fetching full list)
  // For now, priority regions + search covers most valid cases for "Where to Watch"

  const filtered = allCountries.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (code) => {
    changeRegion(code);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-lg p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="text-accent" size={32} />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Where are you watching?</h2>
            <p className="text-gray-400 text-sm">We'll show you movies available in your country.</p>
        </div>

        {/* Search */}
        <div className="p-4 bg-gray-900 border-b border-gray-800">
            <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Search country..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-xl border border-gray-700 focus:border-accent focus:outline-none transition-colors"
                />
            </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-2 grow">
            {filtered.map(country => (
                <button
                    key={country.code}
                    onClick={() => handleSelect(country.code)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-800 rounded-xl group transition-colors text-left"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFlagEmoji(country.code)}</span>
                        <span className="font-bold text-gray-300 group-hover:text-white">{country.name}</span>
                    </div>
                </button>
            ))}
            {filtered.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                    No matching countries found.
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

// Helper for flags
function getFlagEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char =>  127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

export default RegionModal;
