import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import viteCompression from 'vite-plugin-compression';
// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tsconfigPaths(),
        // Gzip compression
        viteCompression({
            algorithm: 'gzip',
            ext: '.gz',
            threshold: 1024, // Only compress files larger than 1KB
            deleteOriginFile: false, // Keep original files
        }),
        // Brotli compression (better compression ratio than gzip)
        viteCompression({
            algorithm: 'brotliCompress',
            ext: '.br',
            threshold: 1024, // Only compress files larger than 1KB
            deleteOriginFile: false, // Keep original files
        })
    ],
    resolve: {
        dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled',
            'recharts',
            'apexcharts',
            '@tanstack/react-query',
            '@tanstack/react-table',
            'axios',
            'zustand'
        ],
        exclude: ['@mui/x-date-pickers']
    },
    server: {
        port: 3000,
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
        chunkSizeWarningLimit: 1000,
        sourcemap: false,
        minify: 'esbuild',
        target: 'es2015',
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    // Stable Core - rarely updated, can be cached for long periods
                    if (id.includes('node_modules')) {
                        // React ecosystem
                        if (id.includes('react') || id.includes('react-dom') ||
                            id.includes('react-router') || id.includes('react-helmet') ||
                            id.includes('react-i18next') || id.includes('react-hook-form') ||
                            id.includes('react-use') || id.includes('react-toastify') ||
                            id.includes('react-perfect-scrollbar') || id.includes('react-confirm-alert') ||
                            id.includes('react-cropper') || id.includes('react-csv') ||
                            id.includes('react-dropzone') || id.includes('react-otp-input') ||
                            id.includes('react-syntax-highlighter') || id.includes('react-to-print') ||
                            id.includes('react-hot-toast')) {
                            return 'react-vendor';
                        }
                        // MUI ecosystem
                        if (id.includes('@mui') || id.includes('@emotion')) {
                            return 'mui-vendor';
                        }
                        // Chart libraries
                        if (id.includes('recharts') || id.includes('apexcharts') ||
                            id.includes('react-apexcharts')) {
                            return 'charts-vendor';
                        }
                        // Data management libraries
                        if (id.includes('@tanstack') || id.includes('axios') ||
                            id.includes('zustand') || id.includes('redux')) {
                            return 'data-vendor';
                        }
                        // Utility libraries
                        if (id.includes('classnames') || id.includes('clsx') ||
                            id.includes('crypto-js') || id.includes('date-fns') ||
                            id.includes('uuid') || id.includes('yup') ||
                            id.includes('lodash') || id.includes('moment') ||
                            id.includes('dayjs') || id.includes('@faker-js') ||
                            id.includes('sass') || id.includes('styled-components')) {
                            return 'utils-vendor';
                        }
                        // UI component libraries
                        if (id.includes('@floating-ui') || id.includes('@reactour') ||
                            id.includes('swiper') || id.includes('idb')) {
                            return 'ui-vendor';
                        }
                        // Everything else goes to vendor chunk
                        return 'vendor';
                    }
                },
                // Optimize chunk naming for better caching
                chunkFileNames: function (chunkInfo) {
                    var _a;
                    var facadeModuleId = chunkInfo.facadeModuleId;
                    if (facadeModuleId) {
                        var fileName = (_a = facadeModuleId.split('/').pop()) === null || _a === void 0 ? void 0 : _a.replace('.tsx', '').replace('.ts', '');
                        return "js/[name]-[hash].js";
                    }
                    return "js/[name]-[hash].js";
                },
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
    },
});
