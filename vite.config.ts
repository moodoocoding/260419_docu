import { defineConfig } from 'vite'

import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  root: 'src',
  envDir: '../',
  publicDir: '../public',
  plugins: [],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        create: resolve(__dirname, 'src/create.html'),
        settings: resolve(__dirname, 'src/settings.html'),
        login: resolve(__dirname, 'src/login.html'),
        history: resolve(__dirname, 'src/history.html'),
        calendar: resolve(__dirname, 'src/calendar.html'),
        contacts: resolve(__dirname, 'src/contacts.html'),
        guide_setup: resolve(__dirname, 'src/guides/guide_setup.html'),
        guide_edufine: resolve(__dirname, 'src/guides/guide_edufine.html'),
        guide_hwp: resolve(__dirname, 'src/guides/guide_hwp.html'),
        guide_report: resolve(__dirname, 'src/guides/guide_report.html'),
        messenger: resolve(__dirname, 'src/messenger.html'),
        leading: resolve(__dirname, 'src/leading.html'),
      },
    },
  },
})
