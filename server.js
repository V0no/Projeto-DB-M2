// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware mais detalhado
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log('Body:', req.body);
  console.log('Query:', req.query);
  next();
});

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Sistema de Reserva de Salas API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      rooms: '/api/rooms',
      roomTypes: '/api/room-types',
      bookings: '/api/bookings',
      dashboard: '/api/dashboard/stats'
    }
  });
});

// Usando as rotas definidas
app.use('/api', routes);

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Middleware para tratamento de erros - MUITO IMPORTANTE
app.use((err, req, res, next) => {
  console.error('=== ERRO NO SERVIDOR ===');
  console.error('URL:', req.originalUrl);
  console.error('Method:', req.method);
  console.error('Error Stack:', err.stack);
  console.error('Error Message:', err.message);
  console.error('========================');
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Inicialização do servidor
const server = app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
})
.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Porta ${port} já está em uso. Tentando usar a porta ${port + 1}...`);
    const newPort = port + 1;
    server.close();
    app.listen(newPort, () => {
      console.log(`Servidor rodando na porta ${newPort}`);
    });
  } else {
    console.error('Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
});

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  console.error('Erro não capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promessa rejeitada não tratada:', reason);
});

module.exports = app;