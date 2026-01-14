module.exports = {
  apps: [
    {
      name: 'konigsmassage-backend',
      cwd: '/var/www/konigsmassage/backend',
      script: '/var/www/konigsmassage/backend/dist/index.js',

      exec_mode: 'fork',
      instances: 1,
      watch: false,
      autorestart: true,
      max_memory_restart: '300M',

      env: {
        NODE_ENV: 'production',
        PORT: '8093',

        // ✅ Puppeteer/Chromium
        // Sunucunda hangi path varsa onu koy:
        //   which chromium || which chromium-browser || which google-chrome
        // Yaygın default:
        PUPPETEER_EXECUTABLE_PATH: '/snap/bin/chromium',

        // Puppeteer çoğu VPS'de sandbox yüzünden patlar; argümanları kodda veriyorsan gerek yok
        // Ama bazı projelerde env ile okunuyor:
        PUPPETEER_NO_SANDBOX: '1',
      },

      out_file: '/var/log/pm2/konigsmassage-backend.out.log',
      error_file: '/var/log/pm2/konigsmassage-backend.err.log',
      combine_logs: true,
      time: true,
    },
  ],
};
