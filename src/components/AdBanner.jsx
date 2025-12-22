import React, { useEffect, useRef } from 'react';

/**
 * Google AdSense Banner Component
 * Displays responsive ads using Google AdSense
 */
const AdBanner = ({ className = '' }) => {
  const adRef = useRef(null);
  const isAdLoaded = useRef(false);

  useEffect(() => {
    // Only push ad once per component mount
    if (adRef.current && !isAdLoaded.current) {
      try {
        // Check if adsbygoogle is available
        if (window.adsbygoogle) {
          window.adsbygoogle.push({});
          isAdLoaded.current = true;
        }
      } catch (err) {
        console.warn('AdSense error:', err);
      }
    }
  }, []);

  return (
    <div className={`ad-container my-6 ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-6815957216068726"
        data-ad-slot="4647586707"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdBanner;
