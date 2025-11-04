import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      deleteOriginFile: false,
    }),
    // Brotli compression
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false,
    })
  ],
  resolve: {
    alias: {
      'src': path.resolve(__dirname, './src'),
      '@': path.resolve(__dirname, './src')
    },
    dedupe: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@mui/material',
      '@mui/material/styles',
      '@mui/material/utils',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      '@emotion/cache',
      'recharts',
      '@tanstack/react-query',
      '@tanstack/react-table',
      'axios',
      'zustand',
      '@floating-ui/react',
      '@floating-ui/react-dom'
    ],
    exclude: [],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  server: {
    port: 5000,
    open: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 1500,
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    // CRITICAL FIX: Disable CSS minification to preserve Tailwind classes
    // Tailwind classes with !important modifier (e.g., .!collapse) break CSS minifiers
    // The CSS will be compressed via gzip/brotli anyway (60-70% size reduction)
    cssMinify: false,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Normalize path separators for consistent matching
          const normalizedId = id.replace(/\\/g, '/')
          
          if (normalizedId.includes('node_modules')) {
            // React ecosystem - keep together to avoid circular deps
            if (normalizedId.includes('/react/') || normalizedId.includes('/react-dom/')) {
              return 'react-vendor'
            }
            
            // Emotion must come before MUI
            if (normalizedId.includes('@emotion/')) {
              return 'emotion-vendor'
            }

            // MUI - single chunk to prevent circular dependencies
            if (normalizedId.includes('@mui/')) {
              return 'mui-vendor'
            }

            // Recharts - isolated to prevent circular deps
            if (normalizedId.includes('/recharts/')) {
              return 'recharts-vendor'
            }

            // TanStack libraries
            if (normalizedId.includes('@tanstack/')) {
              return 'data-vendor'
            }

            // Utility libraries
            if (normalizedId.includes('axios') || 
                normalizedId.includes('zustand') || 
                normalizedId.includes('immer') ||
                normalizedId.includes('classnames') || 
                normalizedId.includes('clsx') ||
                normalizedId.includes('crypto-js') || 
                normalizedId.includes('date-fns')) {
              return 'utils-vendor'
            }

            // UI/Interaction libraries - FIX: Keep floating-ui with other UI libs
            if (normalizedId.includes('@floating-ui') || 
                normalizedId.includes('@reactour') ||
                normalizedId.includes('kbar') ||
                normalizedId.includes('idb')) {
              return 'ui-vendor'
            }

            // React helper libraries
            if (normalizedId.includes('react-router') || 
                normalizedId.includes('react-helmet') ||
                normalizedId.includes('react-i18next') || 
                normalizedId.includes('i18next') ||
                normalizedId.includes('react-hook-form') ||
                normalizedId.includes('react-toastify') ||
                normalizedId.includes('react-')) {
              return 'react-utils-vendor'
            }

            // Default vendor chunk for remaining node_modules
            return 'vendor'
          }
        },
        // Better chunk naming to identify issues
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || []
          const ext = info[info.length - 1]
          if (/\.(css)$/.test(assetInfo.name || '')) {
            return `css/[name]-[hash].${ext}`
          }
          return `assets/[name]-[hash].${ext}`
        }
      }
    }
  }
})
