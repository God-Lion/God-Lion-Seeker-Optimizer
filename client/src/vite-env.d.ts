/// <reference types="vite/client" />

/**
 * Mock PWA register hooks
 * This file provides TypeScript definitions for vite-plugin-pwa
 */
declare module 'virtual:pwa-register/react' {
  export interface RegisterSWOptions {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: any) => void
  }

  export interface UseRegisterSWReturn {
    needRefresh: [boolean, (value: boolean) => void]
    offlineReady: [boolean, (value: boolean) => void]
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }

  export function useRegisterSW(options?: RegisterSWOptions): UseRegisterSWReturn
  export function registerSW(options?: RegisterSWOptions): UseRegisterSWReturn
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_URL: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly SSR: boolean
  // add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
