const HISTORY_KEY = 'cinequest_spin_history';
const MAX_HISTORY = 50;

export const saveSpin = (movie) => {
  if (!movie) return;
  
  try {
    const history = getHistory();
    // Avoid duplicates at the top of the list
    if (history.length > 0 && history[0].id === movie.id) return;
    
    // Add timestamp
    const entry = {
        ...movie,
        spunAt: new Date().toISOString()
    };

    const updated = [entry, ...history].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("History save failed", e);
  }
};

export const getHistory = () => {
    try {
        const stored = localStorage.getItem(HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

export const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
};
