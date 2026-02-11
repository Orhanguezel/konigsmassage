// =============================================================
// FILE: ecosystem.config.cjs
// Ensotek – Frontend (Next.js) PM2 config
// =============================================================

module.exports = {
  apps: [
    {
      name: 'tavvuk-frontend',
      cwd: '/var/www/tavvuk/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3019',
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      autorestart: true,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: '3019',
      },
      out_file: '/var/log/pm2/tavvuk-frontend.out.log',
      error_file: '/var/log/pm2/tavvuk-frontend.err.log',
      combine_logs: true,
      time: true,
    },
  ],
};