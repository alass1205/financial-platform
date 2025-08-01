const express = require('express');

const app = express();
const PORT = 3001;

// Middleware basique
app.use(express.json());

// Routes simples
app.get('/', (req, res) => {
  res.json({ message: 'Financial Platform API - Minimal Version' });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: 'minimal'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API test successful',
    environment: 'development'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Minimal server running on http://localhost:${PORT}`);
  console.log(`✅ Test: curl http://localhost:${PORT}/health`);
});
