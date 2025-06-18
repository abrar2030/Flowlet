// Performance Optimization Service
class PerformanceService {
  constructor() {
    this.observers = new Map();
    this.lazyComponents = new Map();
    this.performanceMetrics = {
      loadTime: 0,
      renderTime: 0,
      interactionTime: 0,
      memoryUsage: 0
    };
  }

  // Initialize performance monitoring
  initialize() {
    this.measureLoadTime();
    this.setupIntersectionObserver();
    this.setupPerformanceObserver();
    this.monitorMemoryUsage();
  }

  // Measure page load time
  measureLoadTime() {
    if (performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      this.performanceMetrics.loadTime = loadTime;
      console.log(`Page load time: ${loadTime}ms`);
    }
  }

  // Setup Intersection Observer for lazy loading
  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const element = entry.target;
              const componentName = element.dataset.lazyComponent;
              
              if (componentName && this.lazyComponents.has(componentName)) {
                this.loadLazyComponent(componentName);
                this.intersectionObserver.unobserve(element);
              }
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.1
        }
      );
    }
  }

  // Setup Performance Observer for monitoring
  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Monitor paint metrics
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            console.log(`First Contentful Paint: ${entry.startTime}ms`);
          }
          if (entry.name === 'largest-contentful-paint') {
            console.log(`Largest Contentful Paint: ${entry.startTime}ms`);
          }
        });
      });

      try {
        paintObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
      } catch (error) {
        console.warn('Performance Observer not supported for paint metrics');
      }

      // Monitor layout shifts
      const layoutShiftObserver = new PerformanceObserver((list) => {
        let cumulativeLayoutShift = 0;
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            cumulativeLayoutShift += entry.value;
          }
        });
        if (cumulativeLayoutShift > 0) {
          console.log(`Cumulative Layout Shift: ${cumulativeLayoutShift}`);
        }
      });

      try {
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Performance Observer not supported for layout shifts');
      }
    }
  }

  // Monitor memory usage
  monitorMemoryUsage() {
    if ('memory' in performance) {
      const updateMemoryUsage = () => {
        this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
      };

      updateMemoryUsage();
      setInterval(updateMemoryUsage, 30000); // Update every 30 seconds
    }
  }

  // Register lazy component
  registerLazyComponent(name, loader) {
    this.lazyComponents.set(name, loader);
  }

  // Load lazy component
  async loadLazyComponent(name) {
    const loader = this.lazyComponents.get(name);
    if (loader) {
      try {
        const startTime = performance.now();
        await loader();
        const loadTime = performance.now() - startTime;
        console.log(`Lazy component ${name} loaded in ${loadTime}ms`);
      } catch (error) {
        console.error(`Failed to load lazy component ${name}:`, error);
      }
    }
  }

  // Observe element for lazy loading
  observeElement(element) {
    if (this.intersectionObserver && element) {
      this.intersectionObserver.observe(element);
    }
  }

  // Unobserve element
  unobserveElement(element) {
    if (this.intersectionObserver && element) {
      this.intersectionObserver.unobserve(element);
    }
  }

  // Debounce function for performance optimization
  debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  // Throttle function for performance optimization
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Optimize images for better performance
  optimizeImage(src, options = {}) {
    const {
      width = 'auto',
      height = 'auto',
      quality = 80,
      format = 'webp'
    } = options;

    // In a real implementation, this would use a service like Cloudinary or ImageKit
    // For now, we'll return the original src with some basic optimizations
    const optimizedSrc = src.includes('?') 
      ? `${src}&w=${width}&h=${height}&q=${quality}&f=${format}`
      : `${src}?w=${width}&h=${height}&q=${quality}&f=${format}`;

    return optimizedSrc;
  }

  // Preload critical resources
  preloadResource(href, as = 'script', crossorigin = null) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (crossorigin) {
      link.crossOrigin = crossorigin;
    }
    document.head.appendChild(link);
  }

  // Prefetch resources for future navigation
  prefetchResource(href) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }

  // Measure component render time
  measureRenderTime(componentName, renderFunction) {
    const startTime = performance.now();
    const result = renderFunction();
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    console.log(`${componentName} render time: ${renderTime}ms`);
    this.performanceMetrics.renderTime = renderTime;
    
    return result;
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      timestamp: Date.now()
    };
  }

  // Virtual scrolling helper for large lists
  calculateVisibleItems(containerHeight, itemHeight, scrollTop, totalItems, overscan = 5) {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      totalItems - 1
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(totalItems - 1, visibleEnd + overscan);

    return {
      start,
      end,
      visibleStart,
      visibleEnd,
      offsetY: start * itemHeight
    };
  }

  // Cleanup observers
  cleanup() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    this.observers.clear();
    this.lazyComponents.clear();
  }
}

export default new PerformanceService();

