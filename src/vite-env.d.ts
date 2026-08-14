/// <reference types="vite/client" />
interface ImportMetaEnv { readonly VITE_PACE_CONTRACT_ADDRESS?: `0x${string}` }
interface ImportMeta { readonly env: ImportMetaEnv }
