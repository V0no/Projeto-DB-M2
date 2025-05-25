// routes/index.js
const express = require('express');
const router = express.Router();

// Carregar UserController
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
  router.patch('/users/:id/deactivate', UserController.desativarUsuario);
  router.patch('/users/:id/activate', UserController.reativarUsuario);
  
  console.log('✅ UserController carregado com sucesso - Todas as rotas configuradas');
} catch (error) {
  console.error('❌ Erro ao carregar UserController:', error.message);
}

// Carregar RoomController
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

// Carregar RoomTypeController
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

// Carregar BookingController
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

// Carregar DashboardController
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

module.exports = router;