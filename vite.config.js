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
        /* Elle parçalama YOK.
           Modüller arasında kasıtlı döngüler var (ekonomi ↔ veri ↔ arayüz);
           bunları ayrı parçalara bölmek Rollup'ın "Circular chunk" uyarısını
           ve tarayıcıda "başlatılmadan erişim" hatalarını doğuruyordu.
           Tek parça hem küçük hem güvenli: yükleme sırası garanti. */
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
