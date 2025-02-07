interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_BLOCKCHAIN_NETWORK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
