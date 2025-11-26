// ./src/routes/authRoutes.js

const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const { authenticateToken } = require("../middleware/authMiddleware");

// 1. RUTA DE INTERCAMBIO DE TOKEN (CRÍTICA)
// El frontend nos enviará el JWT que Supabase le dio.
// Nosotros lo establecemos como una HttpOnly Cookie.
router.post("/set-cookie", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res
      .status(400)
      .json({ message: "Token requerido para establecer la cookie." });
  }

  try {
    // Opcional pero recomendado: verificar el token antes de establecerlo
    await authService.verifySupabaseToken(token);

    // Establecer la HttpOnly Cookie
    authService.setAuthCookie(res, token);

    res.json({ message: "Cookie de sesión establecida correctamente authRoutes.js." });
  } catch (error) {
    res
      .status(401)
      .json({ message: "Token inválido o error al establecer la cookie." });
  }
});

// 2. RUTA DE LOGOUT
router.post("/logout", async (req, res) => {
  // 1. Limpiar la cookie en la respuesta
  authService.clearAuthCookie(res);

  // 2. Opcional: Llama a la función de sign out de Supabase si fuera necesario
  //    (aunque la eliminación de la cookie y la expiración del token son suficientes)
  // await authService.supabase.auth.signOut();

  res.json({ message: "Sesión cerrada exitosamente." });
});

// 3. RUTA PROTEGIDA (ejemplo)
router.get('/perfil', authenticateToken, (req, res) => {
    // ACCESO CORREGIDO AL ROL: Usamos req.user.role, que Supabase garantiza que existe.
    const userRole = req.user.role || 'default_user';
    
    // Accedemos a las propiedades necesarias
    const userId = req.user.sub || req.user.id; 
    const userEmail = req.user.email; 

    res.json({
        message: '¡Acceso Concedido a la información privada!',
        userData: {
            id: userId,
            email: userEmail,
            role: userRole, // Ahora esto debe ser 'authenticated'
        },
        // Opcional: Esto ya no debería ser necesario, pero ayuda a confirmar.
        // fullPayload: req.user 
    });
});

module.exports = router;
