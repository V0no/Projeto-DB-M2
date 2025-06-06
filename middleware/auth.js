// middleware/auth.js

/**
 * Middleware para verificar autenticação (futuro)
 * Por enquanto, apenas passa, pois a verificação é feita no frontend
 */
const verificarAutenticacao = (req, res, next) => {
  // Futuramente pode verificar JWT tokens aqui
  // Por enquanto, só passa adiante
  next();
};

/**
 * Middleware para verificar se é admin (futuro)
 */
const verificarAdmin = (req, res, next) => {
  // Futuramente pode verificar role do token
  // Por enquanto, só passa adiante
  next();
};

module.exports = {
  verificarAutenticacao,
  verificarAdmin
};