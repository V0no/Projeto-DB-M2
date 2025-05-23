// routes/index.js
const express = require('express');
const router = express.Router();

// Importar rotas de teste (manter)
const testRoutes = require('./test');
router.use('/test', testRoutes);

// Rota de teste básica (manter)
router.get('/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date() });
});

// Carregar UserController (já funcionando)
try {
  const UserController = require('../controllers/UserController');
  router.get('/users', UserController.listarUsuarios);
  router.get('/users/:id', UserController.obterUsuario);
  console.log('✅ UserController carregado com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar UserController:', error.message);
}

// Carregar RoomController
try {
  const RoomController = require('../controllers/RoomController');
  router.get('/rooms', RoomController.listarSalas);
  router.get('/rooms/:id', RoomController.obterSala);
  console.log('✅ RoomController carregado com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar RoomController:', error.message);
}

try {
  const RoomTypeController = require('../controllers/RoomTypeController');
  router.get('/room-types', RoomTypeController.listarTiposSala);
  router.get('/room-types/:id', RoomTypeController.obterTipoSala);
  console.log('✅ RoomTypeController carregado com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar RoomTypeController:', error.message);
}

try {
  const BookingController = require('../controllers/BookingController');
  router.get('/bookings', BookingController.listarReservas);
  router.get('/bookings/:id', BookingController.obterReserva);
  router.post('/bookings', BookingController.criarReserva);
  console.log('✅ BookingController carregado com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar BookingController:', error.message);
}

try {
  const DashboardController = require('../controllers/DashboardController');
  router.get('/dashboard/stats', DashboardController.obterEstatisticas);
  router.get('/dashboard/bookings/today', DashboardController.obterReservasHoje);
  console.log('✅ DashboardController carregado com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar DashboardController:', error.message);
}

module.exports = router;