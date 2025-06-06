// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const port = process.env.PORT || 3000;

// ======================================
// CONFIGURAÇÃO DE VIEWS (EJS + LAYOUTS)
// ======================================

// Configurar EJS com layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configurar express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// ======================================
// MIDDLEWARES GLOBAIS
// ======================================

// CORS
app.use(cors());

// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  // Só logar em desenvolvimento para não poluir logs de produção
  if (process.env.NODE_ENV === 'development') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    
    // Só mostrar body se não for muito grande
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('Body:', req.body);
    }
    
    if (req.query && Object.keys(req.query).length > 0) {
      console.log('Query:', req.query);
    }
  }
  next();
});

// ======================================
// IMPORTAR ROTAS
// ======================================

const apiRoutes = require('./routes/index');  // Suas rotas de API
const webRoutes = require('./routes/web');    // Rotas para Views

// ======================================
// ROTAS ESPECIAIS
// ======================================

// Health check (para monitoramento)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    timestamp: new Date(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ======================================
// CONFIGURAR ROTAS PRINCIPAIS
// ======================================

// IMPORTANTE: Rotas específicas ANTES das rotas gerais
// Rota de autenticação (DEVE vir ANTES de '/api')
app.use('/api/auth', require('./routes/auth'));

// Rotas específicas para usuários (DEVE vir ANTES de '/api')
app.use('/api/user', require('./routes/user-api'));


// Rotas de API (JSON) - Esta linha deve vir DEPOIS das rotas específicas
app.use('/api', apiRoutes);

// Rotas de Views (HTML/EJS)
app.use('/', webRoutes);

// ======================================
// MIDDLEWARE DE TRATAMENTO DE ERROS - VERSÃO SIMPLIFICADA
// ======================================

// Middleware para rotas não encontradas
app.use((req, res, next) => {
  // Se for uma requisição para API, retorna JSON
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ 
      error: 'Endpoint não encontrado',
      path: req.originalUrl,
      method: req.method
    });
  }
  
  // Se for uma requisição web, retorna HTML simples
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Página não encontrada</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
            h1 { color: #dc3545; }
            a { color: #007bff; text-decoration: none; padding: 10px 20px; background: #f8f9fa; border-radius: 4px; }
        </style>
    </head>
    <body>
        <h1>❌ Página não encontrada</h1>
        <p>A página <strong>${req.originalUrl}</strong> não foi encontrada.</p>
        <a href="/">🏠 Voltar ao Dashboard</a>
    </body>
    </html>
  `);
});

// Middleware para tratamento de erros gerais
app.use((err, req, res, next) => {
  console.error('=== ERRO NO SERVIDOR ===');
  console.error('URL:', req.originalUrl);
  console.error('Method:', req.method);
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('========================');
  
  // Se for uma requisição para API, retorna JSON
  if (req.originalUrl.startsWith('/api')) {
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
    });
  }
  
  // Se for uma requisição web, retorna HTML simples
  res.status(500).send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Erro interno</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
            h1 { color: #dc3545; }
            .error-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left; }
            a { color: #007bff; text-decoration: none; padding: 10px 20px; background: #f8f9fa; border-radius: 4px; }
        </style>
    </head>
    <body>
        <h1>💥 Erro interno do servidor</h1>
        <p>Algo deu errado. Nossa equipe foi notificada.</p>
        ${process.env.NODE_ENV === 'development' ? `
        <div class="error-details">
            <h3>Detalhes do erro (desenvolvimento):</h3>
            <p><strong>Mensagem:</strong> ${err.message}</p>
            <p><strong>URL:</strong> ${req.originalUrl}</p>
            <p><strong>Método:</strong> ${req.method}</p>
        </div>
        ` : ''}
        <a href="/">🏠 Voltar ao Dashboard</a>
    </body>
    </html>
  `);
});

// ======================================
// INICIALIZAÇÃO DO SERVIDOR
// ======================================

const server = app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`📱 Interface web: http://localhost:${port}`);
  console.log(`🔗 API endpoints: http://localhost:${port}/api`);
  console.log(`🔐 API Auth: http://localhost:${port}/api/auth`);
  console.log(`💚 Health check: http://localhost:${port}/health`);
  console.log(`⚙️ Setup: http://localhost:${port}/setup`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
})
.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${port} já está em uso.`);
    console.log(`🔄 Tentando usar a porta ${port + 1}...`);
    
    // Fechar servidor atual e tentar próxima porta
    server.close();
    
    const newPort = port + 1;
    app.listen(newPort, () => {
      console.log(`🚀 Servidor rodando na porta ${newPort}`);
      console.log(`📱 Interface web: http://localhost:${newPort}`);
      console.log(`🔗 API endpoints: http://localhost:${newPort}/api`);
    });
  } else {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
});

// ======================================
// TRATAMENTO DE EXCEÇÕES NÃO CAPTURADAS
// ======================================

process.on('uncaughtException', (err) => {
  console.error('💥 Exceção não capturada:', err);
  console.error('🔄 Reiniciando servidor...');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promise rejeitada não tratada:', reason);
  console.error('🔍 Promise:', promise);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido. Encerrando servidor graciosamente...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recebido. Encerrando servidor graciosamente...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});

module.exports = app;