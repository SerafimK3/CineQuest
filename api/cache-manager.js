import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.resolve(process.cwd(), 'vibe-cache.json');

// Ensure cache file exists
function ensureCache() {
    if (!fs.existsSync(CACHE_FILE)) {
        fs.writeFileSync(CACHE_FILE, JSON.stringify({}), 'utf-8');
    }
}

export const getCachedVibe = (prompt, region) => {
    try {
        ensureCache();
        const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        const key = `${region.toLowerCase()}:${prompt.toLowerCase().trim()}`;
        return data[key] || null;
    } catch (e) {
        console.error("Cache Read Error:", e);
        return null;
    }
};

export const setCachedVibe = (prompt, region, result) => {
    try {
        ensureCache();
        const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        const key = `${region.toLowerCase()}:${prompt.toLowerCase().trim()}`;
        
        data[key] = result;
        
        fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error("Cache Write Error:", e);
    }
};
