import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Security and PWA plugins
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.flowlet\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'mobile-api-cache',
              expiration: {
                maxEntries: 50, // Smaller cache for mobile
                maxAgeSeconds: 60 * 60 * 12 // 12 hours
              },
              cacheKeyWillBeUsed: async ({ request }) => {
                // Remove sensitive headers from cache key
                const url = new URL(request.url);
                url.searchParams.delete('token');
                url.searchParams.delete('session');
                return url.href;
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mobile-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Flowlet Mobile',
        short_name: 'Flowlet',
        description: 'Secure Mobile Financial Management',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['finance', 'business'],
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          }
        ],
        shortcuts: [
          {
            name: 'Quick Pay',
            short_name: 'Pay',
            description: 'Make a quick payment',
            url: '/payments?quick=true',
            icons: [{ src: '/icons/shortcut-pay.png', sizes: '96x96' }]
          },
          {
            name: 'Balance Check',
            short_name: 'Balance',
            description: 'Check account balance',
            url: '/dashboard?view=balance',
            icons: [{ src: '/icons/shortcut-balance.png', sizes: '96x96' }]
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@config': resolve(__dirname, './src/config'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@assets': resolve(__dirname, './src/assets')
    }
  },

  // Development server configuration
  server: {
    port: 3001, // Different port from web frontend
    host: '0.0.0.0',
    https: false, // Set to true in production with proper certificates
    cors: {
      origin: ['http://localhost:3001', 'https://mobile.flowlet.com', 'capacitor://localhost', 'ionic://localhost'],
      credentials: true
    },
    headers: {
      // Mobile-specific security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'X-Mobile-App': 'Flowlet-Mobile/1.0.0'
    }
  },

  // Build configuration optimized for mobile
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'terser',
    
    // Mobile-optimized build options
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'],
        // More aggressive compression for mobile
        passes: 2,
        unsafe: true,
        unsafe_comps: true
      },
      mangle: {
        safari10: true,
        toplevel: true
      },
      format: {
        comments: false
      }
    },

    // Rollup options for mobile optimization
    rollupOptions: {
      output: {
        // Smaller chunks for mobile
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-alert-dialog'],
          capacitor: ['@capacitor/core', '@capacitor/device', '@capacitor/haptics'],
          crypto: ['crypto-js'],
          utils: ['date-fns', 'clsx', 'tailwind-merge']
        },
        
        // Mobile-optimized asset naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      },

      // External dependencies
      external: [],

      // Input configuration
      input: {
        main: resolve(__dirname, 'index.html')
      }
    },

    // Smaller asset inline limit for mobile
    assetsInlineLimit: 2048, // 2kb
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Report compressed file sizes
    reportCompressedSize: true,
    
    // Smaller chunk size warning limit for mobile
    chunkSizeWarningLimit: 500
  },

  // CSS configuration for mobile
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/mobile-variables.scss";`
      }
    },
    postcss: {
      plugins: [
        // Mobile-specific PostCSS plugins
      ]
    }
  },

  // Environment variables for mobile
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __PLATFORM__: JSON.stringify('mobile'),
    __SECURITY_MODE__: JSON.stringify(process.env.NODE_ENV === 'production' ? 'strict' : 'development')
  },

  // Optimization for mobile
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@capacitor/core',
      '@capacitor/device',
      '@capacitor/haptics',
      '@capacitor/keyboard',
      '@capacitor/status-bar',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      'lucide-react',
      'date-fns',
      'clsx',
      'tailwind-merge'
    ],
    exclude: [
      // Exclude packages that should not be pre-bundled
    ]
  },

  // Preview server configuration for mobile testing
  preview: {
    port: 4174,
    host: '0.0.0.0',
    https: false,
    cors: true,
    headers: {
      // Mobile production-like security headers
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' capacitor://localhost ionic://localhost; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: capacitor://localhost ionic://localhost; connect-src 'self' https://api.flowlet.com capacitor://localhost ionic://localhost",
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'X-Mobile-App': 'Flowlet-Mobile/1.0.0'
    }
  },

  // ESBuild configuration for mobile
  esbuild: {
    target: 'es2020',
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none',
    // Mobile-specific optimizations
    treeShaking: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true
  },

  // Worker configuration
  worker: {
    format: 'es'
  },

  // JSON configuration
  json: {
    namedExports: true,
    stringify: false
  },

  // Mobile-specific experimental features
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        // Optimize JS loading for mobile
        return { js: `/${filename}` };
      } else {
        return { relative: true };
      }
    }
  }
});

