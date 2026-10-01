import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    // Kaynak haritası yok: tarayıcının kaynak sekmesinde okunur tek dosya çıkmasın
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    assetsInlineLimit: 0,          // sprite'lar ayrı dosya olarak sunulsun
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[hash].js',
        chunkFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash][extname]',
        // Kod alanlara bölünür: tek büyük dosya yerine birkaç parça
        manualChunks(id) {
          if (id.includes('/src/data/')) return 'data';
          if (id.includes('/src/sim/')) return 'sim';
          if (id.includes('/src/ui/')) return 'ui';
        },
      },
    },
  },
  esbuild: {
    legalComments: 'none',
    // Yorumları ve okunur adları at
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },
});
