// PM2 process configuration for the MedExplorer API.
// Place this at the repo root; PM2 reads it via `pm2 start ecosystem.config.cjs`.
module.exports = {
  apps: [
    {
      name: "medexplorer-api",
      script: "apps/api/src/index.ts",
      interpreter: "bun",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
      // Load .env file before starting (so DATABASE_URL etc. are present)
      env_file: ".env",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      out_file: "/var/log/medexplorer/api.out.log",
      error_file: "/var/log/medexplorer/api.err.log",
      time: true,
    },
  ],
};
