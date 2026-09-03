// /var/www/konigsmassage/backend/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'konigsmassage-backend',
      cwd: '/var/www/konigsmassage/backend',

      // Bun runtime — DIKKAT: `interpreter: <bun yolu>` KULLANMA.
      // PM2 o durumda uygulamayi kendi ProcessContainerForkBun sarmalayicisi
      // icinde calistirir; sarmalayici surekli /proc/self/stat orneklemesi
      // yapip bellek ayirir ve bosta bile ~5-7% CPU yakar (2026-09-03 olcumu).
      // Bun'i dogrudan script olarak calistirmak bu yuku tamamen ortadan kaldirir
      // (kamanilan-backend bu sekilde ve bostayken %0.4).
      interpreter: 'none',
      script: '/home/orhan/.bun/bin/bun',
      args: 'dist/index.js',

      exec_mode: 'fork',
      instances: 1,

      watch: false,
      autorestart: true,

      max_memory_restart: '350M',

      min_uptime: '30s',
      max_restarts: 10,
      restart_delay: 5000,

      kill_timeout: 8000,
      listen_timeout: 10000,

      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 8093,

        // Puppeteer/Chromium
        PUPPETEER_EXECUTABLE_PATH: '/snap/bin/chromium',
      },

      out_file: '/home/orhan/.pm2/logs/konigsmassage-backend.out.log',
      error_file: '/home/orhan/.pm2/logs/konigsmassage-backend.err.log',
      combine_logs: true,
      time: true,
    },
  ],
};
