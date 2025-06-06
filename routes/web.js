// routes/web.js - VERSÃO ATUALIZADA COM CADASTRO
const express = require('express');
const router = express.Router();

// ======================================
// ROTA PRINCIPAL - REDIRECIONA PARA LOGIN
// ======================================

router.get('/', (req, res) => {
    res.redirect('/login');
});

// ======================================
// ÁREA PÚBLICA - LOGIN E CADASTRO
// ======================================

router.get('/login', (req, res) => {
    res.render('pages/login', { 
        title: 'Login - Sistema de Reservas',
        layout: false 
    });
});

router.get('/register', (req, res) => {
    res.render('pages/register', { 
        title: 'Cadastro - Sistema de Reservas',
        layout: false 
    });
});

// Rota para a página de setup (opcional - pode ser removida em produção)
router.get('/setup', (req, res) => {
    res.render('pages/setup', { 
        title: 'Setup - Sistema de Reservas',
        layout: false 
    });
});

// ======================================
// ÁREA ADMINISTRATIVA
// ======================================

// Dashboard admin
router.get('/admin/dashboard', (req, res) => {
    res.render('pages/admin/dashboard', { 
        title: 'Admin Dashboard - Sistema de Reservas',
        layout: false 
    });
});

// Páginas administrativas
router.get('/admin/users', (req, res) => {
    res.render('pages/user/list', {
        title: 'Admin - Usuários - Sistema de Reservas',
        currentPage: 'users',
        user: null,
        pageTitle: 'Gerenciar Usuários (Admin)',
        layout: false
    });
});

router.get('/admin/rooms', (req, res) => {
    res.render('pages/rooms/list', {
        title: 'Admin - Salas - Sistema de Reservas',
        currentPage: 'rooms',
        user: null,
        pageTitle: 'Gerenciar Salas (Admin)',
        layout: false
    });
});

router.get('/admin/bookings', (req, res) => {
    res.render('pages/bookings/list', {
        title: 'Admin - Reservas - Sistema de Reservas',
        currentPage: 'bookings',
        user: null,
        pageTitle: 'Gerenciar Reservas (Admin)',
        layout: false
    });
});

router.get('/admin/room-types', (req, res) => {
    res.render('pages/room-types/list', {
        title: 'Admin - Tipos de Sala - Sistema de Reservas',
        currentPage: 'room-types',
        user: null,
        pageTitle: 'Gerenciar Tipos (Admin)',
        layout: false
    });
});

router.get('/admin/reports', (req, res) => {
    res.render('pages/admin/reports', {
        title: 'Admin - Reports',
        currentPage: 'reports',
        user: null,
        pageTitle: 'Gerenciar Tipos (Admin)',
        layout: false
    });
});


// ======================================
// ÁREA DO USUÁRIO COMUM
// ======================================

// Dashboard do usuário (usando arquivo existente)
router.get('/user/dashboard', (req, res) => {
    res.render('pages/user/dashboard', {
        title: 'Meu Dashboard - Sistema de Reservas',
        currentPage: 'dashboard',
        layout: false
    });
});

// Páginas do usuário
router.get('/user/bookings', (req, res) => {
    res.render('pages/user/bookings', {
        title: 'Minhas Reservas - Sistema de Reservas',
        currentPage: 'bookings',
        layout: false
    });
});

router.get('/user/new-booking', (req, res) => {
    res.render('pages/user/new-booking', {
        title: 'Nova Reserva - Sistema de Reservas',
        currentPage: 'new-booking',
        layout: false
    });
});

router.get('/user/profile', (req, res) => {
    res.render('pages/user/profile', {
        title: 'Meu Perfil - Sistema de Reservas',
        currentPage: 'profile',
        layout: false
    });
});

// ======================================
// ROTAS DE COMPATIBILIDADE - REDIRECIONAM PARA ADMIN
// ======================================

router.get('/users', (req, res) => res.redirect('/admin/users'));
router.get('/rooms', (req, res) => res.redirect('/admin/rooms'));
router.get('/bookings', (req, res) => res.redirect('/admin/bookings'));
router.get('/room-types', (req, res) => res.redirect('/admin/room-types'));

// ======================================
// ROTA DE TESTE (OPCIONAL)
// ======================================

module.exports = router;