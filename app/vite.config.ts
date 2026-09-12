import { fileURLToPath, URL } from 'node:url'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/* The built stylesheet is otherwise a plain `<link rel="stylesheet">` — one
   render-blocking request before first paint. Swap it for the standard
   preload-then-apply pattern (load async, flip `rel` to `stylesheet` on
   arrival) with a `<noscript>` fallback for the no-JS case, build-only so the
   dev server keeps serving CSS the normal (HMR-friendly) way. */
function nonBlockingCss(): Plugin {
  return {
    name: 'non-blocking-css',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(
          /<link rel="stylesheet"([^>]*?)href="([^"]+)"([^>]*)>/g,
          (_match, before, href, after) =>
            `<link rel="preload" as="style"${before}href="${href}"${after} onload="this.onload=null;this.rel='stylesheet'">` +
            `<noscript><link rel="stylesheet" href="${href}"></noscript>`,
        )
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), nonBlockingCss()],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
  build: {
    /* Two independent pages, two independent bundles: the AAVA product
       (index.html) and the standalone Interaction Library (interaction.html,
       served at /interaction via vercel.json's rewrite). Neither imports the
       other's entry, so this stays a clean split rather than one bundle with
       dead code from the other surface. */
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        interaction: fileURLToPath(new URL('./interaction.html', import.meta.url)),
      },
    },
  },
})
