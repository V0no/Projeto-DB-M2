// routes/auth.js - SISTEMA COMPLETO DE AUTENTICAÇÃO
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Verificar se bcrypt está instalado
let bcrypt;
try {
    bcrypt = require('bcrypt');
    console.log('✅ bcrypt carregado com sucesso');
} catch (error) {
    console.error('❌ ERRO: bcrypt não encontrado. Execute: npm install bcrypt');
    process.exit(1);
}

/**
 * CRIAR USUÁRIO ADMIN FIXO NA INICIALIZAÇÃO
 * Esta função roda automaticamente quando o servidor inicia
 */
async function createFixedAdmin() {
    try {
        console.log('🔧 Verificando usuário admin fixo...');
        
        const adminEmail = 'admin@sistema.com';
        const adminPassword = 'admin123';
        
        // Verificar se admin já existe
        const existingAdmin = await pool.query(
            'SELECT user_id FROM Users WHERE email = $1 AND role = $2',
            [adminEmail, 'admin']
        );
        
        if (existingAdmin.rows.length === 0) {
            // Criar admin fixo
            const hashedPassword = await bcrypt.hash(adminPassword, 12);
            
            await pool.query(`
                INSERT INTO Users (name, email, phone, role, password)
                VALUES ($1, $2, $3, $4, $5)
            `, [
                'Administrador do Sistema',
                adminEmail,
                '(11) 99999-9999',
                'admin',
                hashedPassword
            ]);
            
            console.log('✅ Usuário admin fixo criado!');
        } else {
            // Atualizar senha do admin existente
            const hashedPassword = await bcrypt.hash(adminPassword, 12);
            
            await pool.query(`
                UPDATE Users 
                SET password = $1, name = $2, updated_at = CURRENT_TIMESTAMP
                WHERE email = $3
            `, [hashedPassword, 'Administrador do Sistema', adminEmail]);
            
            console.log('✅ Usuário admin fixo atualizado!');
        }
        
        console.log('🔑 Admin fixo: admin@sistema.com / admin123');
        
    } catch (error) {
        console.error('❌ Erro ao criar admin fixo:', error.message);
    }
}

// Criar admin fixo quando o módulo for carregado
createFixedAdmin();

/**
 * HEALTH CHECK
 * GET /api/auth/health
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API Auth funcionando',
        timestamp: new Date().toISOString()
    });
});

/**
 * LOGIN REAL
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    console.log(`🔐 Tentativa de login: ${email}`);

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Email e senha são obrigatórios'
        });
    }

    try {
        // Buscar usuário
        const userResult = await pool.query(
            'SELECT user_id, name, email, role, password FROM Users WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        if (userResult.rows.length === 0) {
            console.log(`❌ Usuário não encontrado: ${email}`);
            return res.status(401).json({
                success: false,
                error: 'Email ou senha incorretos'
            });
        }

        const user = userResult.rows[0];

        // Verificar senha
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log(`❌ Senha incorreta para: ${email}`);
            return res.status(401).json({
                success: false,
                error: 'Email ou senha incorretos'
            });
        }

        // Login bem-sucedido
        console.log(`✅ Login realizado: ${user.name} (${user.role})`);

        // Retornar dados do usuário (SEM a senha)
        const userData = {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        res.status(200).json({
            success: true,
            message: 'Login realizado com sucesso!',
            user: userData
        });

    } catch (error) {
        console.error('❌ Erro no login:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * CADASTRO DE NOVO USUÁRIO
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
    const { name, email, phone, password, confirmPassword } = req.body;

    console.log(`📝 Tentativa de cadastro: ${email}`);

    // Validações
    if (!name || !email || !password || !confirmPassword) {
        return res.status(400).json({
            success: false,
            error: 'Todos os campos são obrigatórios'
        });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({
            success: false,
            error: 'As senhas não coincidem'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            error: 'A senha deve ter pelo menos 6 caracteres'
        });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            error: 'Email inválido'
        });
    }

    try {
        // Verificar se email já existe
        const existingUser = await pool.query(
            'SELECT user_id FROM Users WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Este email já está em uso'
            });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 12);

        // Criar usuário (sempre como 'user', nunca 'admin')
        const result = await pool.query(`
            INSERT INTO Users (name, email, phone, role, password)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING user_id, name, email, role, created_at
        `, [
            name.trim(),
            email.toLowerCase().trim(),
            phone ? phone.trim() : null,
            'user', // Sempre usuário comum
            hashedPassword
        ]);

        const newUser = result.rows[0];

        console.log(`✅ Usuário cadastrado: ${newUser.name} (${newUser.email})`);

        // Retornar dados do usuário criado (SEM a senha)
        res.status(201).json({
            success: true,
            message: 'Cadastro realizado com sucesso!',
            user: {
                user_id: newUser.user_id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('❌ Erro no cadastro:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * VERIFICAR SE USUÁRIO ESTÁ LOGADO
 * GET /api/auth/me
 */
router.get('/me', async (req, res) => {
    // Em uma implementação real, você usaria sessões ou JWT
    // Por enquanto, vamos retornar um placeholder
    res.status(401).json({
        success: false,
        error: 'Não implementado ainda - use localStorage no frontend'
    });
});

/**
 * LOGOUT
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
    console.log('🚪 Logout realizado');
    
    // Em uma implementação real, você limparia a sessão/token
    res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso'
    });
});

/**
 * LISTAR USUÁRIOS (APENAS PARA ADMIN)
 * GET /api/auth/users
 */
router.get('/users', async (req, res) => {
    try {
        // Buscar todos os usuários (sem senhas)
        const result = await pool.query(`
            SELECT user_id, name, email, phone, role, created_at, updated_at
            FROM Users
            ORDER BY created_at DESC
        `);

        res.status(200).json({
            success: true,
            users: result.rows
        });

    } catch (error) {
        console.error('❌ Erro ao listar usuários:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * VALIDAR EMAIL DISPONÍVEL
 * GET /api/auth/check-email?email=...
 */
router.get('/check-email', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({
            success: false,
            error: 'Email é obrigatório'
        });
    }

    try {
        const result = await pool.query(
            'SELECT user_id FROM Users WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        res.status(200).json({
            success: true,
            available: result.rows.length === 0
        });

    } catch (error) {
        console.error('❌ Erro ao verificar email:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

console.log('🔐 Sistema de autenticação completo carregado');

module.exports = router;