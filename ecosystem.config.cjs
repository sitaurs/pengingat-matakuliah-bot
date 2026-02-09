module.exports = {
  apps: [
    {
      name: 'wa-schedule-bot',
      script: 'npx',
      args: 'tsx src/index.ts',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
