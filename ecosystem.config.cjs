require('dotenv').config()

module.exports = {
  apps: [
    {
      name: 'assettracker',
      script: 'server.mjs',
      env: {
        NODE_ENV: 'production',
        ...process.env,
      },
    },
  ],
}
