// server.js
require('dotenv').config();

const http = require('http');
const env        = require('./src/config/env');
const connectDB  = require('./src/config/db');
const app        = require('./src/app');
const { initSocket } = require('./src/socket');

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.name, err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.name, err.message);
  server.close(() => process.exit(1));
});

const start = async () => {
  await connectDB();

  // Wrap Express in a plain http.Server so Socket.io can share the port
  const server = http.createServer(app);

  initSocket(server, app);

  server.listen(env.PORT, () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
};

start();