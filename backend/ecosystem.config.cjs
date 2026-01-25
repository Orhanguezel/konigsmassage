module.exports = {
  apps: [
    {
      name: 'konigsmassage-backend',
      cwd: '/var/www/konigsmassage/backend',

      // Node ile çalışıyorsa:
      script: 'dist/index.js',

      exec_mode: 'fork',
      instances: 1,
      watch: false,
      autorestart: true,
      max_memory_restart: '350M',

      min_uptime: '20s',
      max_restarts: 10,
      restart_delay: 3000,

      env: {
        NODE_ENV: 'production',

        // Güvenlik: dışa açma, sadece localhost
        HOST: '127.0.0.1',
        PORT: 8093,

        // Puppeteer/Chromium
        // Snap Chromium varsa:
        PUPPETEER_EXECUTABLE_PATH: '/snap/bin/chromium',
        PUPPETEER_NO_SANDBOX: '1',
      },

      out_file: '/home/orhan/.pm2/logs/konigsmassage-backend.out.log',
      error_file: '/home/orhan/.pm2/logs/konigsmassage-backend.err.log',
      combine_logs: true,
      time: true,
    },
  ],
};
