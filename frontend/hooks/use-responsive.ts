import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // Standard tablet breakpoint

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Custom hook to track responsive state (mobile, tablet, desktop).
 * It uses window.matchMedia for efficient and modern responsiveness checks.
 * @returns {ResponsiveState} The current responsive state.
 */
export function useResponsive(): ResponsiveState {
  const [responsiveState, setResponsiveState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  useEffect(() => {
    // Define media queries
    const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const tabletQuery = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: 1023px)`);
    const desktopQuery = window.matchMedia(`(min-width: 1024px)`);

    const updateState = () => {
      setResponsiveState({
        isMobile: mobileQuery.matches,
        isTablet: tabletQuery.matches,
        isDesktop: desktopQuery.matches,
      });
    };

    // Initial state setup
    updateState();

    // Add listeners
    mobileQuery.addEventListener('change', updateState);
    tabletQuery.addEventListener('change', updateState);
    desktopQuery.addEventListener('change', updateState);

    // Cleanup listeners
    return () => {
      mobileQuery.removeEventListener('change', updateState);
      tabletQuery.removeEventListener('change', updateState);
      desktopQuery.removeEventListener('change', updateState);
    };
  }, []);

  // Return the full state object
  return responsiveState;
}

// Export the old name for backward compatibility if needed, but the App.tsx uses useResponsive
export const useIsMobile = () => useResponsive().isMobile;
