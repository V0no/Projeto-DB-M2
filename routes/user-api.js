// routes/user-api.js - APIs ESPECÍFICAS PARA USUÁRIOS
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcrypt');

/**
 * OBTER RESERVAS DO USUÁRIO LOGADO
 * GET /api/user/bookings
 */
router.get('/bookings', async (req, res) => {
    // Em uma implementação real, você pegaria o user_id do token/sessão
    // Por enquanto, vamos pegar do query parameter
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
router.post('/bookings', async (req, res) => {
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
router.patch('/bookings/:id/cancel', async (req, res) => {
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
 * ATUALIZAR PERFIL DO USUÁRIO
 * PUT /api/user/profile
 */
router.put('/profile', async (req, res) => {
    const { user_id, name, phone } = req.body;

    if (!user_id || !name) {
        return res.status(400).json({
            success: false,
            error: 'user_id e name são obrigatórios'
        });
    }

    try {
        console.log(`👤 Atualizando perfil do usuário ${user_id}`);

        const updateQuery = `
            UPDATE Users 
            SET name = $1, phone = $2, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $3
            RETURNING user_id, name, email, phone, role, created_at, updated_at
        `;

        const result = await pool.query(updateQuery, [name, phone, user_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        const updatedUser = result.rows[0];

        console.log(`✅ Perfil atualizado: ${updatedUser.name}`);

        res.status(200).json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            user: updatedUser
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * ALTERAR SENHA DO USUÁRIO
 * PUT /api/user/password
 */
router.put('/password', async (req, res) => {
    const { user_id, current_password, new_password } = req.body;

    if (!user_id || !current_password || !new_password) {
        return res.status(400).json({
            success: false,
            error: 'Todos os campos são obrigatórios'
        });
    }

    if (new_password.length < 6) {
        return res.status(400).json({
            success: false,
            error: 'Nova senha deve ter pelo menos 6 caracteres'
        });
    }

    try {
        console.log(`🔐 Alterando senha do usuário ${user_id}`);

        // Buscar senha atual
        const userResult = await pool.query(
            'SELECT password FROM Users WHERE user_id = $1',
            [user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        // Verificar senha atual
        const isCurrentPasswordValid = await bcrypt.compare(
            current_password, 
            userResult.rows[0].password
        );

        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Senha atual incorreta'
            });
        }

        // Hash da nova senha
        const hashedNewPassword = await bcrypt.hash(new_password, 12);

        // Atualizar senha
        await pool.query(
            'UPDATE Users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
            [hashedNewPassword, user_id]
        );

        console.log(`✅ Senha alterada para usuário ${user_id}`);

        res.status(200).json({
            success: true,
            message: 'Senha alterada com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao alterar senha:', error);
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
router.post('/check-availability', async (req, res) => {
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
router.get('/stats', async (req, res) => {
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

        // Reservas passadas
        const pastQuery = `
            SELECT COUNT(*) as past 
            FROM Bookings 
            WHERE user_id = $1 
            AND end_time < CURRENT_TIMESTAMP
        `;
        const pastResult = await pool.query(pastQuery, [user_id]);

        // Data de criação do usuário
        const userQuery = 'SELECT created_at FROM Users WHERE user_id = $1';
        const userResult = await pool.query(userQuery, [user_id]);

        const stats = {
            total_bookings: parseInt(totalResult.rows[0].total),
            confirmed_bookings: parseInt(confirmedResult.rows[0].confirmed),
            upcoming_bookings: parseInt(upcomingResult.rows[0].upcoming),
            past_bookings: parseInt(pastResult.rows[0].past),
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

console.log('👤 APIs de usuário carregadas');

module.exports = router;