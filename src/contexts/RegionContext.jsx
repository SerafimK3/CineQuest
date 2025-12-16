import React, { createContext, useState, useContext, useEffect } from 'react';

const RegionContext = createContext();

export const RegionProvider = ({ children }) => {
  // Default to null initially to trigger the Modal if not set
  const [userRegion, setUserRegion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from storage on mount
    const saved = localStorage.getItem('user_region_code');
    if (saved) {
      setUserRegion(saved);
    }
    setLoading(false);
  }, []);

  const changeRegion = (code) => {
    setUserRegion(code);
    localStorage.setItem('user_region_code', code);
  };

  return (
    <RegionContext.Provider value={{ userRegion, changeRegion, loading }}>
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = () => {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
};
