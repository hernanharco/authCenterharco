# 🔑 Paso a Paso: Delegación de Autenticación a Python
El principio clave es que el backend de Python debe preguntar al backend de Node.js: "¿Es válido este token de cookie y, si lo es, cuál es el rol del usuario?".
____
## 1. ⚙️ Configuración del Auth Service (Node.js)
Debes crear la ruta que el backend de Python consumirá.

Archivo: authcenter/backend/src/routes/authRoutes.js (Añade esta ruta)
```
// 6. RUTA INTERNA: Usada por otros microservicios (Python) para verificar el token.
// Usa authenticateToken para validar la cookie y adjuntar el payload a req.user.
router.post('/internal/validate-token', authenticateToken, (req, res) => {
    // Si el middleware authenticateToken no lanza un error, el token es válido.
    res.json({
        isValid: true,
        id: req.user.sub || req.user.id, // ID del usuario
        role: req.user.role || 'authenticated', // Rol del usuario
        email: req.user.email
    });
});
```
promt
```

# Pasar al proyecto de Portfolio en la parte del backend esta la continuidad
