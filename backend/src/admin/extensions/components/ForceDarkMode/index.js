import { useEffect } from 'react';

const ForceDarkMode = () => {
  useEffect(() => {
    // Force dark mode globally - this needs to run immediately and persistently
    const forceDarkMode = () => {
      try {
        // Set Strapi's theme preferences
        localStorage.setItem('strapi-theme', 'dark');
        localStorage.setItem('STRAPI_THEME', 'dark');
        
        // Set data-theme on document
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.setAttribute('data-theme', 'dark');
        
        // Force dark class
        document.body.classList.add('theme-dark');
        document.body.classList.remove('theme-light');
        
      } catch (error) {
        // Silently handle errors
      }
    };
    
    // Apply immediately on mount
    forceDarkMode();
    
    // Apply on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', forceDarkMode);
    }
    
    // Watch for any theme changes and override them aggressively
    const observer = new MutationObserver(() => {
      // Re-apply dark mode on any DOM changes
      setTimeout(forceDarkMode, 1);
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true
    });
    
    // Override theme toggle clicks
    const interceptThemeChanges = () => {
      // Find and override theme toggle buttons
      const themeButtons = document.querySelectorAll('[data-testid="theme-toggle"], button[aria-label*="theme"], button[aria-label*="Theme"]');
      themeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          forceDarkMode();
        }, true);
      });
    };
    
    // Run periodically to catch new theme buttons
    const intervalId = setInterval(() => {
      forceDarkMode();
      interceptThemeChanges();
    }, 1000);
    
    return () => {
      observer.disconnect();
      clearInterval(intervalId);
      document.removeEventListener('DOMContentLoaded', forceDarkMode);
    };
  }, []);

  return null;
};

export default ForceDarkMode;