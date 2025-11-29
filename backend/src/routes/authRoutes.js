//backend/src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const { authenticateToken, hasRole } = require("../middleware/authMiddleware");

// 1. RUTA DE INTERCAMBIO DE TOKEN (CRÍTICA)
router.post("/set-cookie", async (req, res) => {
  const { access_token, refresh_token } = req.body;

  if (!access_token || !refresh_token) {
    return res
      .status(400)
      .json({ message: "Tokens (access_token y refresh_token) requeridos." });
  }

  try {
    // 1. Verificar el access_token antes de establecerlo
    await authService.verifySupabaseToken(access_token); // 2. Establecer HttpOnly Cookies (¡Ambas!)

    authService.setAuthCookie(res, access_token, "authToken");
    authService.setAuthCookie(res, refresh_token, "refreshToken");

    res.json({ message: "Cookie de sesión establecida correctamente." });
  } catch (error) {
    console.error("Error en set-cookie:", error.message);
    res
      .status(401)
      .json({ message: "Token inválido o error al establecer la cookie." });
  }
});

// 2. RUTA DE LOGOUT
router.post("/logout", async (req, res) => {
  // 1. Limpiar AMBAS cookies (authToken y refreshToken)
  authService.clearAuthCookie(res);

  res.json({ message: "Sesión cerrada exitosamente." });
});

// 3. RUTA PROTEGIDA (ejemplo /perfil)
router.get("/perfil", authenticateToken, (req, res) => {
  // req.user ya contiene el rol, id y email adjuntados por authenticateToken
  const userRole = req.user.role || "default_user";
  const userId = req.user.id;
  const userEmail = req.user.email;

  res.json({
    message: "¡Acceso Concedido a la información privada!",
    userData: {
      id: userId,
      email: userEmail,
      role: userRole,
    },
  });
});

// 4. RUTA PROTEGIDA POR ROL (Solo para 'admin')
router.get("/admin-data", authenticateToken, hasRole("admin"), (req, res) => {
  res.json({
    message: "¡Acceso Concedido! Eres un administrador.",
    secretData: "Datos confidenciales del administrador.",
  });
});

// 5. RUTA DE RENOVACIÓN DE SESIÓN
router.post("/refresh-session", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({
      message: "No se encontró el token de refresco. Por favor, inicie sesión.",
    });
  }

  try {
    // 1. Renovar la sesión con Supabase
    const newSession = await authService.refreshAuthToken(refreshToken); // 2. Establecer las nuevas HttpOnly Cookies (JWT y Refresh Token)

    authService.setAuthCookie(res, newSession.access_token, "authToken");
    authService.setAuthCookie(res, newSession.refresh_token, "refreshToken");

    res.json({ message: "Sesión renovada exitosamente." });
  } catch (error) {
    console.error("Error al renovar el token:", error.message); // 3. Limpiar AMBAS cookies si la renovación falla
    authService.clearAuthCookie(res);
    return res
      .status(401)
      .json({ message: "Sesión expirada. Vuelva a iniciar sesión." });
  }
});

module.exports = router;
