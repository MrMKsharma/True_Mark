/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly APTOS_PRIVATE_KEY: string
  readonly APTOS_NODE_URL: string
  readonly APTOS_FAUCET_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
