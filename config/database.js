// config/database.js

// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

// Importa a classe Pool do driver PostgreSQL para Node.js
const { Pool } = require('pg');

// Log de inicialização para debug - mostra as configurações que serão usadas
console.log('Inicializando conexão com Supabase...');
console.log('Host:', process.env.DB_HOST);
console.log('Port:', process.env.DB_PORT);
console.log('User:', process.env.DB_USER);
console.log('Database:', process.env.DB_NAME);

/**
 * Configuração da pool de conexões para Supabase
 * Uma pool gerencia múltiplas conexões de forma eficiente,
 * reutilizando conexões existentes ao invés de criar novas a cada query
 */
const pool = new Pool({
  user: process.env.DB_USER,              // Usuário do banco de dados
  host: process.env.DB_HOST,              // Endereço do servidor Supabase
  database: process.env.DB_NAME || 'postgres', // Nome do banco (padrão: postgres)
  password: process.env.DB_PASSWORD,      // Senha do usuário
  port: parseInt(process.env.DB_PORT) || 5432, // Porta do PostgreSQL (padrão: 5432)
  
  // Configuração SSL obrigatória para Supabase (serviço na nuvem)
  ssl: {
    rejectUnauthorized: false // Aceita certificados auto-assinados do Supabase
  },
  
  // Configurações de timeout para conexões remotas (Supabase está na nuvem)
  connectionTimeoutMillis: 60000, // 60 segundos para estabelecer conexão inicial
  idleTimeoutMillis: 30000,       // 30 segundos antes de fechar conexão inativa
  
  // Configurações da pool de conexões
  max: 10,                        // Máximo de 10 conexões simultâneas
  allowExitOnIdle: true          // Permite que o processo termine mesmo com conexões inativas
});

/**
 * Event Listeners para monitoramento da pool de conexões
 * Úteis para debug e monitoramento em produção
 */

// Evento disparado quando uma nova conexão é estabelecida
pool.on('connect', (client) => {
  console.log('✅ Nova conexão estabelecida com Supabase');
});

// Evento disparado quando ocorre erro inesperado na pool
pool.on('error', (err, client) => {
  console.error('❌ Erro inesperado na pool do Supabase:', err);
});

/**
 * Teste inicial de conexão (IIFE - Immediately Invoked Function Expression)
 * Executa automaticamente quando o módulo é carregado para verificar se
 * a conexão com o Supabase está funcionando corretamente
 */
(async () => {
  try {
    // Obtém uma conexão da pool
    const client = await pool.connect();
    
    // Executa query de teste para verificar conectividade e obter info do servidor
    const result = await client.query('SELECT NOW(), version()');
    
    // Log de sucesso com informações do servidor
    console.log('✅ Conectado ao Supabase com sucesso!');
    console.log('Hora do servidor:', result.rows[0].now);
    console.log('Versão:', result.rows[0].version.substring(0, 50) + '...');
    
    // IMPORTANTE: Libera a conexão de volta para a pool
    client.release();
    
  } catch (err) {
    // Log de erro caso a conexão inicial falhe
    console.error('❌ Erro na conexão inicial com Supabase:', err.message);
  }
})();

// Exporta a pool para ser usada em outros módulos da aplicação
module.exports = pool;