/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IMGLY_PUBLIC_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
