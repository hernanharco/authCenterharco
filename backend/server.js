// ./server.js

require('dotenv').config(); 
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de Middlewares
app.use(bodyParser.json());
app.use(cookieParser());

// Configuración de CORS (CRÍTICO para peticiones entre frontend y backend)
// En desarrollo, permitimos al frontend acceder. AJUSTA ESTO A TU DOMINIO REAL EN PROD.
app.use((req, res, next) => {
    // URL de tu frontend Next.js
    res.header('Access-Control-Allow-Origin', 'http://localhost:3001'); 
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    next();
});


// Montar Rutas
app.use('/auth', authRoutes);
app.use('/api', authRoutes); // También montamos el perfil en /api

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor Express de Autenticación funcionando.');
});

// Iniciar el Servidor
app.listen(port, () => {
    console.log(`Backend de Auth escuchando en http://localhost:${port}`);
    console.log(`¡Recuerda iniciar el Frontend en http://localhost:3001!`);
});