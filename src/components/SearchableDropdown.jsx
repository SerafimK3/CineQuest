import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

const SearchableDropdown = ({ options, value, onChange, placeholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-900 text-white px-3 py-2.5 rounded border border-gray-700 hover:border-gray-500 focus:outline-none focus:border-accent flex justify-between items-center transition-colors text-xs sm:text-sm"
      >
        <div className="flex items-center gap-2 truncate">
            {icon && <span className="text-gray-400">{icon}</span>}
            <span className={selectedOption ? 'text-white font-medium' : 'text-gray-400'}>
                {selectedOption ? selectedOption.label : placeholder}
            </span>
        </div>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          
          {/* Search Input */}
          <div className="p-2 border-b border-gray-800 bg-gray-900 sticky top-0">
             <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-gray-800 text-white pl-8 pr-2 py-1.5 rounded text-xs border border-gray-700 focus:border-accent focus:outline-none"
                    autoFocus
                />
                 {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                        <X size={12} />
                    </button>
                )}
             </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-48 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
             {/* "All" Option */}
             <div 
                onClick={() => {
                    onChange('');
                    setIsOpen(false);
                    setSearchTerm('');
                }}
                className={`px-3 py-2 cursor-pointer text-xs sm:text-sm hover:bg-gray-800 transition-colors ${value === '' ? 'bg-accent/10 text-accent font-bold' : 'text-gray-300'}`}
             >
                 All Countries
             </div>

             {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                    <div
                        key={option.value}
                        onClick={() => {
                            onChange(option.value);
                            setIsOpen(false);
                            setSearchTerm('');
                        }}
                        className={`px-3 py-2 cursor-pointer text-xs sm:text-sm hover:bg-gray-800 transition-colors flex justify-between items-center ${value === option.value ? 'bg-accent/10 text-accent font-bold' : 'text-gray-300'}`}
                    >
                        <span>{option.label}</span>
                        {value === option.value && <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>}
                    </div>
                ))
             ) : (
                 <div className="px-3 py-4 text-center text-xs text-gray-500">
                     No results found
                 </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
