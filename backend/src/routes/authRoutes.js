// ./src/routes/authRoutes.js

const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const { authenticateToken, hasRole } = require("../middleware/authMiddleware");

// 1. RUTA DE INTERCAMBIO DE TOKEN (CRÍTICA)
// El frontend nos enviará el JWT que Supabase le dio.
// Nosotros lo establecemos como una HttpOnly Cookie.
router.post("/set-cookie", async (req, res) => {
  const { access_token, refresh_token } = req.body; //<-- Recibe ambos tokens

  if (!access_token || !refresh_token) {
    return res
      .status(400)
      .json({ message: "Tokens Requeridos authRoutes.js" });
  }

  try {
    // Opcional pero recomendado: verificar el token antes de establecerlo
    await authService.verifySupabaseToken(token);

    // Establecer HttpOnly Cookies (¡Ambas!)
    authService.setAuthCookie(res, access_token, 'authToken');
    authService.setAuthCookie(res, refresh_token, 'refreshToken'); // <-- Guardar el refresh token

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

// 4. RUTA PROTEGIDA POR ROL (Solo para 'admin')
router.get('/admin-data', authenticateToken, hasRole('admin'), (req, res) => {
    res.json({
        message: '¡Acceso Concedido! Eres un administrador.',
        secretData: 'Datos confidenciales del administrador.'
    });
});

// 5. RUTA DE RENOVACIÓN DE SESIÓN
// Usa el refresh token para obtener un nuevo JWT sin que el usuario inicie sesión de nuevo.
router.post('/refresh-session', async (req, res) => {
    // 1. Obtener el Refresh Token de la cookie
    const refreshToken = req.cookies.refreshToken; 
    
    if (!refreshToken) {
        // Si no hay refresh token, la sesión ha expirado completamente
        return res.status(401).json({ message: 'No se encontró el token de refresco. Por favor, inicie sesión.' });
    }

    try {
        // 2. Renovar la sesión con Supabase
        const newSession = await authService.refreshAuthToken(refreshToken);
        
        // 3. Establecer las nuevas HttpOnly Cookies (JWT y Refresh Token)
        authService.setAuthCookie(res, newSession.access_token, 'authToken');
        authService.setAuthCookie(res, newSession.refresh_token, 'refreshToken'); // ¡Importante!

        res.json({ message: "Sesión renovada exitosamente." });
    } catch (error) {
        console.error('Error al renovar el token:', error.message);
        
        // 4. Limpiar cookies si la renovación falla (refresh token expirado o inválido)
        authService.clearAuthCookie(res, 'authToken');
        authService.clearAuthCookie(res, 'refreshToken');
        
        return res.status(401).json({ message: 'Sesión expirada. Vuelva a iniciar sesión.' });
    }
});

module.exports = router;
