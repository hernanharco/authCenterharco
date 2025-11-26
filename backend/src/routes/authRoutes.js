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
router.get("/perfil", authenticateToken, (req, res) => {
  // 1. Acceso Seguro al Rol usando Encadenamiento Opcional (?.):
  // El payload de Supabase NO tiene 'role' en el nivel raíz.
  // Buscamos 'user_role' (o 'role') dentro de app_metadata de forma segura.
  const userRole = req.user.app_metadata?.user_role || "default_user";

  // 2. Acceso Seguro a Propiedades Raíz:
  // Aseguramos que 'sub' (ID) y 'email' existen antes de usarlos.
  const userId = req.user?.sub;
  const userEmail = req.user?.email;

  // Si tu código tenía esta estructura original, el error estaba en la línea 53:
  /*
    const userRole = req.user.app_metadata 
                     ? (req.user.app_metadata.role || 'default_user') 
                     : 'default_user'; // Ocurre el error si 'app_metadata' es undefined
    */

  // --- Respuesta Final (Línea 53 corregida) ---
  res.json({
    message: "¡Acceso Concedido a la información privada!",
    userData: {
      id: userId,
      email: userEmail,
      role: userRole,
      // Si el error de 'role' persiste, temporalmente usa fullPayload
    },
    // Temporalmente, incluye el payload completo para que veas la estructura real
    // fullPayload: req.user
  });
});

module.exports = router;
