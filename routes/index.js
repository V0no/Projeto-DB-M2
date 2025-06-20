// routes/index.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcrypt');

console.log('🚀 Carregando rotas da API...');

// === ROTAS DE AUTENTICAÇÃO ===
try {
  const AuthController = require('../controllers/AuthController');
  
  // Rotas de autenticação
  router.post('/auth/login', AuthController.login);
  router.get('/auth/me', AuthController.verificarSessao);
  router.post('/auth/logout', AuthController.logout);
  router.post('/auth/seed', AuthController.criarUsuariosPadrao);
  
  // Rotas de debug (remover em produção)
  router.post('/auth/debug', AuthController.debugUser);
  router.post('/auth/verify-password', AuthController.verifyPassword);
  router.post('/auth/fix-passwords', AuthController.corrigirSenhas);
  
  console.log('✅ AuthController carregado com sucesso - Todas as rotas configuradas');
} catch (error) {
  console.error('❌ Erro ao carregar AuthController:', error.message);
  console.log('💡 Certifique-se que o arquivo controllers/AuthController.js existe');
}

// === ROTAS DE USUÁRIOS ===
try {
  const UserController = require('../controllers/UserController');
  
  // Rotas GET
  router.get('/users', UserController.listarUsuarios);
  router.get('/users/:id', UserController.obterUsuario);
  router.get('/users/:id/bookings', UserController.listarReservasUsuario);
  
  // Rotas POST, PUT, PATCH, DELETE
  router.post('/users', UserController.criarUsuario);
  router.put('/users/:id', UserController.atualizarUsuario);
  router.put('/users/:id/password', UserController.alterarSenha);
  router.put('/users/:id/profile', UserController.atualizarPerfilProprio);
  router.patch('/users/:id/deactivate', UserController.desativarUsuario);
  router.patch('/users/:id/activate', UserController.reativarUsuario);
  
  console.log('✅ UserController carregado com sucesso - Todas as rotas configuradas');
} catch (error) {
  console.error('❌ Erro ao carregar UserController:', error.message);
}

// === ROTAS DE SALAS ===
try {
  const RoomController = require('../controllers/RoomController');
  
  // Rotas GET
  router.get('/rooms', RoomController.listarSalas);
  router.get('/rooms/:id', RoomController.obterSala);
  router.get('/rooms/:id/bookings', RoomController.listarReservasSala);
  router.get('/rooms/:id/availability', RoomController.verificarDisponibilidadeSala);
  
  // Rotas POST, PUT, PATCH, DELETE
  router.post('/rooms', RoomController.criarSala);
  router.put('/rooms/:id', RoomController.atualizarSala);
  router.patch('/rooms/:id/status', RoomController.alterarStatusSala);
  router.delete('/rooms/:id', RoomController.excluirSala);
  
  console.log('✅ RoomController carregado com sucesso - Todas as rotas configuradas');
} catch (error) {
  console.error('❌ Erro ao carregar RoomController:', error.message);
}

// === ROTAS DE TIPOS DE SALA ===
try {
  const RoomTypeController = require('../controllers/RoomTypeController');
  
  // Rotas GET
  router.get('/room-types', RoomTypeController.listarTiposSala);
  router.get('/room-types/:id', RoomTypeController.obterTipoSala);
  router.get('/room-types/:id/rooms', RoomTypeController.listarSalasPorTipo);
  
  // Rotas POST, PUT, DELETE
  router.post('/room-types', RoomTypeController.criarTipoSala);
  router.put('/room-types/:id', RoomTypeController.atualizarTipoSala);
  router.delete('/room-types/:id', RoomTypeController.excluirTipoSala);
  
  console.log('✅ RoomTypeController carregado com sucesso - Todas as rotas configuradas');
} catch (error) {
  console.error('❌ Erro ao carregar RoomTypeController:', error.message);
}

// === ROTAS DE RESERVAS ===
try {
  const BookingController = require('../controllers/BookingController');
  
  // Rotas GET
  router.get('/bookings', BookingController.listarReservas);
  router.get('/bookings/:id', BookingController.obterReserva);
  
  // Rotas POST, PUT, PATCH, DELETE
  router.post('/bookings', BookingController.criarReserva);
  router.put('/bookings/:id', BookingController.editarReserva);
  router.patch('/bookings/:id/cancel', BookingController.cancelarReserva);
  router.delete('/bookings/:id', BookingController.excluirReserva);
  
  // Rota especial para verificar disponibilidade
  router.post('/bookings/check-availability', BookingController.verificarDisponibilidade);
  
  console.log('✅ BookingController carregado com sucesso - Todas as rotas configuradas');
} catch (error) {
  console.error('❌ Erro ao carregar BookingController:', error.message);
}

// === ROTAS DE DASHBOARD ===
try {
  const DashboardController = require('../controllers/DashboardController');
  
  // Rotas GET para estatísticas e relatórios
  router.get('/dashboard/stats', DashboardController.obterEstatisticas);
  router.get('/dashboard/bookings/today', DashboardController.obterReservasHoje);
  router.get('/dashboard/rooms/occupancy', DashboardController.obterOcupacaoSalas);
  router.get('/dashboard/users/top', DashboardController.obterMaioresUsuarios);
  
  console.log('✅ DashboardController carregado com sucesso - Todas as rotas configuradas');
} catch (error) {
  console.error('❌ Erro ao carregar DashboardController:', error.message);
}

// === ROTAS ESPECÍFICAS PARA ÁREA DO USUÁRIO ===
// Estas são as rotas que estavam faltando e causando os erros 500

/**
 * OBTER RESERVAS DO USUÁRIO LOGADO
 * GET /api/user/bookings
 */
router.get('/user/bookings', async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({
            success: false,
            error: 'user_id é obrigatório'
        });
    }

    try {
        console.log(`📅 Carregando reservas do usuário ${user_id}`);

        const query = `
            SELECT 
                b.booking_id,
                b.title,
                b.description,
                b.start_time,
                b.end_time,
                b.status,
                b.created_at,
                r.name as room_name,
                r.location as room_location,
                r.capacity as room_capacity,
                rt.name as room_type_name
            FROM Bookings b
            JOIN Rooms r ON b.room_id = r.room_id
            LEFT JOIN Room_Types rt ON r.room_type_id = rt.room_type_id
            WHERE b.user_id = $1
            ORDER BY b.start_time DESC
        `;

        const result = await pool.query(query, [user_id]);

        console.log(`✅ Encontradas ${result.rows.length} reservas para o usuário ${user_id}`);

        res.status(200).json({
            success: true,
            bookings: result.rows
        });

    } catch (error) {
        console.error('❌ Erro ao carregar reservas do usuário:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * CRIAR NOVA RESERVA
 * POST /api/user/bookings
 */
router.post('/user/bookings', async (req, res) => {
    const { user_id, room_id, title, description, start_time, end_time } = req.body;

    console.log(`📝 Criando nova reserva para usuário ${user_id}`);

    // Validações
    if (!user_id || !room_id || !title || !start_time || !end_time) {
        return res.status(400).json({
            success: false,
            error: 'Campos obrigatórios: user_id, room_id, title, start_time, end_time'
        });
    }

    try {
        // 1. Verificar se a sala existe e está disponível
        const roomCheck = await pool.query(
            'SELECT room_id, name, status FROM Rooms WHERE room_id = $1',
            [room_id]
        );

        if (roomCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Sala não encontrada'
            });
        }

        if (roomCheck.rows[0].status !== 'available') {
            return res.status(400).json({
                success: false,
                error: 'Sala não está disponível'
            });
        }

        // 2. Verificar conflitos de horário
        const conflictCheck = await pool.query(`
            SELECT booking_id FROM Bookings
            WHERE room_id = $1
            AND status = 'confirmed'
            AND (
                (start_time <= $2 AND end_time > $2)      
                OR (start_time < $3 AND end_time >= $3)   
                OR (start_time >= $2 AND end_time <= $3)  
            )
        `, [room_id, start_time, end_time]);

        if (conflictCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Horário já está ocupado por outra reserva'
            });
        }

        // 3. Criar a reserva
        const insertQuery = `
            INSERT INTO Bookings (user_id, room_id, title, description, start_time, end_time, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING booking_id, title, start_time, end_time, status, created_at
        `;

        const result = await pool.query(insertQuery, [
            user_id,
            room_id,
            title,
            description || null,
            start_time,
            end_time,
            'confirmed'
        ]);

        const newBooking = result.rows[0];

        console.log(`✅ Reserva criada: ${newBooking.title} (ID: ${newBooking.booking_id})`);

        res.status(201).json({
            success: true,
            message: 'Reserva criada com sucesso!',
            booking: newBooking
        });

    } catch (error) {
        console.error('❌ Erro ao criar reserva:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * CANCELAR RESERVA
 * PATCH /api/user/bookings/:id/cancel
 */
router.patch('/user/bookings/:id/cancel', async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({
            success: false,
            error: 'user_id é obrigatório'
        });
    }

    try {
        console.log(`🚫 Cancelando reserva ${id} do usuário ${user_id}`);

        // Verificar se a reserva pertence ao usuário e pode ser cancelada
        const bookingCheck = await pool.query(`
            SELECT booking_id, title, start_time, status, user_id
            FROM Bookings 
            WHERE booking_id = $1 AND user_id = $2
        `, [id, user_id]);

        if (bookingCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Reserva não encontrada ou não pertence a você'
            });
        }

        const booking = bookingCheck.rows[0];

        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                error: 'Reserva já está cancelada'
            });
        }

        // Verificar se não é muito próximo do horário (2 horas de antecedência)
        const startTime = new Date(booking.start_time);
        const now = new Date();
        const diffHours = (startTime - now) / (1000 * 60 * 60);

        if (diffHours < 2 && diffHours > 0) {
            return res.status(400).json({
                success: false,
                error: 'Não é possível cancelar com menos de 2 horas de antecedência'
            });
        }

        // Cancelar a reserva
        const updateQuery = `
            UPDATE Bookings 
            SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
            WHERE booking_id = $1
            RETURNING *
        `;

        const result = await pool.query(updateQuery, [id]);

        console.log(`✅ Reserva cancelada: ${booking.title}`);

        res.status(200).json({
            success: true,
            message: 'Reserva cancelada com sucesso',
            booking: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Erro ao cancelar reserva:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * VERIFICAR DISPONIBILIDADE DE SALAS
 * POST /api/user/check-availability
 */
router.post('/user/check-availability', async (req, res) => {
    const { start_time, end_time } = req.body;

    if (!start_time || !end_time) {
        return res.status(400).json({
            success: false,
            error: 'start_time e end_time são obrigatórios'
        });
    }

    try {
        console.log(`🔍 Verificando disponibilidade para ${start_time} - ${end_time}`);

        // Buscar todas as salas
        const roomsQuery = `
            SELECT r.*, rt.name as room_type_name
            FROM Rooms r
            LEFT JOIN Room_Types rt ON r.room_type_id = rt.room_type_id
            WHERE r.status = 'available'
            ORDER BY r.name
        `;

        const roomsResult = await pool.query(roomsQuery);

        // Para cada sala, verificar se está disponível no horário
        const roomsWithAvailability = [];

        for (const room of roomsResult.rows) {
            const conflictQuery = `
                SELECT booking_id FROM Bookings
                WHERE room_id = $1
                AND status = 'confirmed'
                AND (
                    (start_time <= $2 AND end_time > $2)      
                    OR (start_time < $3 AND end_time >= $3)   
                    OR (start_time >= $2 AND end_time <= $3)  
                )
            `;

            const conflictResult = await pool.query(conflictQuery, [
                room.room_id, 
                start_time, 
                end_time
            ]);

            roomsWithAvailability.push({
                ...room,
                available: conflictResult.rows.length === 0
            });
        }

        const availableCount = roomsWithAvailability.filter(r => r.available).length;

        console.log(`✅ ${availableCount} salas disponíveis de ${roomsWithAvailability.length}`);

        res.status(200).json({
            success: true,
            rooms: roomsWithAvailability,
            summary: {
                total: roomsWithAvailability.length,
                available: availableCount,
                occupied: roomsWithAvailability.length - availableCount
            }
        });

    } catch (error) {
        console.error('❌ Erro ao verificar disponibilidade:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * ESTATÍSTICAS DO USUÁRIO
 * GET /api/user/stats
 */
router.get('/user/stats', async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({
            success: false,
            error: 'user_id é obrigatório'
        });
    }

    try {
        console.log(`📊 Carregando estatísticas do usuário ${user_id}`);

        // Total de reservas
        const totalQuery = 'SELECT COUNT(*) as total FROM Bookings WHERE user_id = $1';
        const totalResult = await pool.query(totalQuery, [user_id]);

        // Reservas confirmadas
        const confirmedQuery = `
            SELECT COUNT(*) as confirmed 
            FROM Bookings 
            WHERE user_id = $1 AND status = 'confirmed'
        `;
        const confirmedResult = await pool.query(confirmedQuery, [user_id]);

        // Próximas reservas
        const upcomingQuery = `
            SELECT COUNT(*) as upcoming 
            FROM Bookings 
            WHERE user_id = $1 
            AND status = 'confirmed' 
            AND start_time > CURRENT_TIMESTAMP
        `;
        const upcomingResult = await pool.query(upcomingQuery, [user_id]);

        // Data de criação do usuário
        const userQuery = 'SELECT created_at FROM Users WHERE user_id = $1';
        const userResult = await pool.query(userQuery, [user_id]);

        const stats = {
            total_bookings: parseInt(totalResult.rows[0].total),
            confirmed_bookings: parseInt(confirmedResult.rows[0].confirmed),
            upcoming_bookings: parseInt(upcomingResult.rows[0].upcoming),
            member_since: userResult.rows[0]?.created_at || null
        };

        console.log(`✅ Estatísticas carregadas para usuário ${user_id}`);

        res.status(200).json({
            success: true,
            stats: stats
        });

    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// === ROTA DE SAÚDE DO SISTEMA ===
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Sistema de Reservas API funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

console.log('✅ Rotas específicas de usuário adicionadas');

// === MIDDLEWARE PARA ROTAS NÃO ENCONTRADAS ===
router.use((req, res) => {
  console.log(`❌ Rota não encontrada: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// === MIDDLEWARE PARA TRATAMENTO DE ERROS ===
router.use((error, req, res, next) => {
  console.error('💥 Erro na API:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Todas as rotas da API foram carregadas com sucesso');

module.exports = router;