const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Resolve absolute path to dist directory
const distPath = path.resolve(__dirname, 'dist');
const indexPath = path.resolve(distPath, 'index.html');

// Serve static assets from dist
app.use(express.static(distPath));

// Fallback all other routes to index.html (SPA client-side routing)
app.use((req, res) => {
  res.sendFile(indexPath);
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`SanityFlow Web Server active on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});

module.exports = { app, server };
