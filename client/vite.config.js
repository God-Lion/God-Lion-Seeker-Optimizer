import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import path from 'path';
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
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'utils-vendor': ['zustand', 'axios', 'crypto-js', 'classnames'],
                    // Make sure React is loaded before utils
                },
                // Better chunk naming to identify issues
                chunkFileNames: 'js/[name]-[hash].js',
                entryFileNames: 'js/[name]-[hash].js',
                assetFileNames: function (assetInfo) {
                    var _a;
                    var info = ((_a = assetInfo.name) === null || _a === void 0 ? void 0 : _a.split('.')) || [];
                    var ext = info[info.length - 1];
                    if (/\.(css)$/.test(assetInfo.name || '')) {
                        return "css/[name]-[hash].".concat(ext);
                    }
                    return "assets/[name]-[hash].".concat(ext);
                }
            }
        }
    }
});
