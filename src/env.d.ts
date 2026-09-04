/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_GA_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// gtag.js se inserta solo cuando PUBLIC_GA_ID está definido (ver BaseLayout.astro)
declare function gtag(...args: unknown[]): void;
