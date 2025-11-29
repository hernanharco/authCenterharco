// Este es un ejemplo. Si tu archivo principal se llama app.js, úsalo.
//backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // NECESARIO
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL; // Usar la URL del frontend (e.g., http://localhost:3001)

// --- CRÍTICO: CONFIGURACIÓN CORS PARA PERMITIR COOKIES ---
app.use(cors({
    origin: FRONTEND_URL, // Permite el origen de tu frontend
    credentials: true, // ¡ESTO ES CRÍTICO! Permite el intercambio de HttpOnly Cookies
}));

// Middleware para parsear el body de las peticiones JSON
app.use(express.json());

// --- CRÍTICO: HABILITAR EL PARSEO DE COOKIES ---
app.use(cookieParser());

// Rutas de autenticación
app.use('/auth', authRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor de autenticación Express OK.');
});

app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
    console.log(`CORS habilitado para: ${FRONTEND_URL}`);
});