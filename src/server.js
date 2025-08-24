const { PORT = 8000 } = process.env;

let app;
try {
  app = require('./app');
} catch (error) {
  console.error('Error loading app.js:', error.message);
  process.exit(1);
}

const listener = () => console.log(`Listening on Port ${PORT}!`);

app.listen(PORT, listener).on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', error.message);
  }
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, _promise) => {
  console.error('Unhandled promise rejection:', reason);
  process.exit(1);
});
