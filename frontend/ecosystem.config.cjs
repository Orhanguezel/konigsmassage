// =============================================================
// FILE: ecosystem.config.cjs
// konigsmassage – Frontend (Next.js) PM2 config
// =============================================================

module.exports = {
  apps: [
    {
      name: 'konigsmassage-frontend',
      cwd: '/var/www/konigsmassage/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3055',
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      autorestart: true,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: '3055',
      },
      out_file: '/var/log/pm2/konigsmassage-frontend.out.log',
      error_file: '/var/log/pm2/konigsmassage-frontend.err.log',
      combine_logs: true,
      time: true,
    },
  ],
};
