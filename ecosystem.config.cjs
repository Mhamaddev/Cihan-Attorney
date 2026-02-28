module.exports = {
  apps: [{
    name: 'lawyer-backend',
    script: './src/server.js',
    cwd: '/var/www/lawyer-app/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/lawyer-backend-error.log',
    out_file: '/var/log/pm2/lawyer-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
