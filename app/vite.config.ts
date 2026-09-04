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
})
