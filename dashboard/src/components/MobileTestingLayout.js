import React, { useState, useEffect } from 'react';

const MobileTestingLayout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const [touchSupport, setTouchSupport] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    // Detect orientation
    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    // Detect touch support
    const checkTouch = () => {
      setTouchSupport('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    // Update viewport size
    const updateViewport = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Initial checks
    checkMobile();
    checkOrientation();
    checkTouch();
    updateViewport();

    // Add event listeners
    window.addEventListener('resize', checkMobile);
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return (
    <div className={`mobile-testing-layout ${isMobile ? 'mobile' : 'desktop'} ${orientation}`}>
      {/* Mobile Testing Debug Panel (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mobile-debug-panel">
          <div className="debug-info">
            <span>📱 {isMobile ? 'Mobile' : 'Desktop'}</span>
            <span>🔄 {orientation}</span>
            <span>👆 {touchSupport ? 'Touch' : 'No Touch'}</span>
            <span>📐 {viewportSize.width}×{viewportSize.height}</span>
          </div>
        </div>
      )}

      {/* Add touch-friendly classes and optimizations */}
      <div className={`
        dashboard-container 
        ${isMobile ? 'mobile-optimized' : ''} 
        ${touchSupport ? 'touch-enabled' : ''}
        ${orientation === 'landscape' ? 'landscape-mode' : 'portrait-mode'}
      `}>
        {children}
      </div>
    </div>
  );
};

export default MobileTestingLayout; 