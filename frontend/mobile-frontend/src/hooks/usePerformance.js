import { useEffect, useRef, useCallback, useState } from 'react';
import performanceService from '../services/performanceService.js';

export const usePerformance = () => {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    performanceService.initialize();
    
    // Update metrics periodically
    const interval = setInterval(() => {
      const currentMetrics = performanceService.getPerformanceMetrics();
      setMetrics(currentMetrics);
    }, 5000);

    return () => {
      clearInterval(interval);
      performanceService.cleanup();
    };
  }, []);

  const measureRender = useCallback((componentName, renderFunction) => {
    return performanceService.measureRenderTime(componentName, renderFunction);
  }, []);

  const debounce = useCallback((func, wait, immediate) => {
    return performanceService.debounce(func, wait, immediate);
  }, []);

  const throttle = useCallback((func, limit) => {
    return performanceService.throttle(func, limit);
  }, []);

  return {
    metrics,
    measureRender,
    debounce,
    throttle
  };
};

export const useLazyLoading = (componentName, loader) => {
  const elementRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (componentName && loader) {
      performanceService.registerLazyComponent(componentName, async () => {
        await loader();
        setIsLoaded(true);
      });
    }
  }, [componentName, loader]);

  useEffect(() => {
    const element = elementRef.current;
    if (element) {
      element.dataset.lazyComponent = componentName;
      performanceService.observeElement(element);

      return () => {
        performanceService.unobserveElement(element);
      };
    }
  }, [componentName]);

  return { elementRef, isLoaded };
};

export const useVirtualScrolling = (items, itemHeight, containerHeight, overscan = 5) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const visibleRange = performanceService.calculateVisibleItems(
    containerHeight,
    itemHeight,
    scrollTop,
    items.length,
    overscan
  );

  const visibleItems = items.slice(visibleRange.start, visibleRange.end + 1);

  const handleScroll = useCallback(
    performanceService.throttle((e) => {
      setScrollTop(e.target.scrollTop);
    }, 16), // ~60fps
    []
  );

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  return {
    containerRef,
    visibleItems,
    visibleRange,
    totalHeight: items.length * itemHeight,
    offsetY: visibleRange.offsetY
  };
};

export const useImageOptimization = () => {
  const optimizeImage = useCallback((src, options) => {
    return performanceService.optimizeImage(src, options);
  }, []);

  const preloadImage = useCallback((src) => {
    const img = new Image();
    img.src = src;
    return new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
  }, []);

  return { optimizeImage, preloadImage };
};

export const useResourcePreloading = () => {
  const preload = useCallback((href, as, crossorigin) => {
    performanceService.preloadResource(href, as, crossorigin);
  }, []);

  const prefetch = useCallback((href) => {
    performanceService.prefetchResource(href);
  }, []);

  return { preload, prefetch };
};

