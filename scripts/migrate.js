// scripts/migrate.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();
const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

class MigrationManager {
  constructor() {
    this.migrationsPath = path.join(__dirname, '..', 'migrations');
  }

  // Inicializar tabela de controle de migrações
  async initializeMigrationTable() {
    try {
      const schemaVersionPath = path.join(this.migrationsPath, 'schema_version.sql');
      const sql = fs.readFileSync(schemaVersionPath, 'utf8');
      await pool.query(sql);
      console.log('✅ Tabela de migrações inicializada');
    } catch (error) {
      console.error('❌ Erro ao inicializar tabela de migrações:', error);
      throw error;
    }
  }

  // Obter migrações já executadas
  async getExecutedMigrations() {
    try {
      const result = await pool.query('SELECT version FROM schema_migrations ORDER BY version');
      return result.rows.map(row => row.version);
    } catch (error) {
      console.error('❌ Erro ao obter migrações executadas:', error);
      return [];
    }
  }

  // Obter arquivos de migração disponíveis
  getMigrationFiles() {
    try {
      const files = fs.readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql') && file !== 'schema_version.sql')
        .sort();
      
      return files.map(file => ({
        version: path.basename(file, '.sql'),
        filename: file,
        path: path.join(this.migrationsPath, file)
      }));
    } catch (error) {
      console.error('❌ Erro ao ler arquivos de migração:', error);
      return [];
    }
  }

  // Calcular checksum do arquivo
  calculateChecksum(content) {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  // Executar migração específica
  async executeMigration(migration) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Ler conteúdo da migração
      const content = fs.readFileSync(migration.path, 'utf8');
      const checksum = this.calculateChecksum(content);
      
      // Extrair descrição do comentário
      const lines = content.split('\n');
      const descriptionLine = lines.find(line => line.trim().startsWith('--') && !line.includes('migrations/'));
      const description = descriptionLine ? descriptionLine.replace(/^--\s*/, '').trim() : '';
      
      console.log(`🔄 Executando migração: ${migration.version}`);
      console.log(`📝 Descrição: ${description}`);
      
      // Executar SQL da migração
      await client.query(content);
      
      // Registrar migração como executada
      await client.query(
        'INSERT INTO schema_migrations (version, description, checksum) VALUES ($1, $2, $3)',
        [migration.version, description, checksum]
      );
      
      await client.query('COMMIT');
      console.log(`✅ Migração ${migration.version} executada com sucesso`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Erro ao executar migração ${migration.version}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Executar todas as migrações pendentes
  async runMigrations() {
    try {
      console.log('🚀 Iniciando processo de migração...\n');
      
      // Inicializar tabela de controle
      await this.initializeMigrationTable();
      
      // Obter migrações executadas e disponíveis
      const executedMigrations = await this.getExecutedMigrations();
      const availableMigrations = this.getMigrationFiles();
      
      // Filtrar migrações pendentes
      const pendingMigrations = availableMigrations.filter(
        migration => !executedMigrations.includes(migration.version)
      );
      
      if (pendingMigrations.length === 0) {
        console.log('ℹ️  Todas as migrações já foram executadas');
        return;
      }
      
      console.log(`📋 ${pendingMigrations.length} migração(ões) pendente(s):`);
      pendingMigrations.forEach(migration => {
        console.log(`   - ${migration.version}`);
      });
      console.log('');
      
      // Executar migrações pendentes
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }
      
      console.log('\n🎉 Todas as migrações foram executadas com sucesso!');
      
    } catch (error) {
      console.error('\n💥 Erro durante o processo de migração:', error);
      process.exit(1);
    }
  }

  // Mostrar status das migrações
  async showStatus() {
    try {
      await this.initializeMigrationTable();
      
      const executedMigrations = await this.getExecutedMigrations();
      const availableMigrations = this.getMigrationFiles();
      
      console.log('\n📊 STATUS DAS MIGRAÇÕES');
      console.log('========================\n');
      
      if (availableMigrations.length === 0) {
        console.log('ℹ️  Nenhuma migração encontrada');
        return;
      }
      
      availableMigrations.forEach(migration => {
        const isExecuted = executedMigrations.includes(migration.version);
        const status = isExecuted ? '✅ EXECUTADA' : '⏳ PENDENTE';
        console.log(`${status} - ${migration.version}`);
      });
      
      const pendingCount = availableMigrations.length - executedMigrations.length;
      console.log(`\n📈 Total: ${availableMigrations.length} migrações`);
      console.log(`✅ Executadas: ${executedMigrations.length}`);
      console.log(`⏳ Pendentes: ${pendingCount}`);
      
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
    }
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'run';
  
  const migrationManager = new MigrationManager();
  
  try {
    switch (command) {
      case 'run':
        await migrationManager.runMigrations();
        break;
      case 'status':
        await migrationManager.showStatus();
        break;
      default:
        console.log('Comandos disponíveis:');
        console.log('  node scripts/migrate.js run    - Executar migrações pendentes');
        console.log('  node scripts/migrate.js status - Mostrar status das migrações');
    }
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = MigrationManager;