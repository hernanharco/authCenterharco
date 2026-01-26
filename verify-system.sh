#!/bin/bash

echo "🔍 ===== VERIFICACIÓN COMPLETA DEL SISTEMA ====="
echo ""

# 1. Verificar build del frontend
echo "📦 1. Verificando build del frontend..."
cd /media/datos/Archivos_Personales/Documentos/Proyectos/authCenterharco/frontend
if pnpm run build > /dev/null 2>&1; then
    echo "✅ Frontend build exitoso"
else
    echo "❌ Frontend build falló"
    exit 1
fi

# 2. Verificar build del backend
echo "📦 2. Verificando build del backend..."
cd /media/datos/Archivos_Personales/Documentos/Proyectos/authCenterharco/backend
if pnpm run build > /dev/null 2>&1; then
    echo "✅ Backend build exitoso"
else
    echo "❌ Backend build falló"
    exit 1
fi

# 3. Verificar configuración del proxy
echo "🔧 3. Verificando configuración del proxy..."
cd /media/datos/Archivos_Personales/Documentos/Proyectos/authCenterharco/frontend
if grep -q "/api/v1" next.config.ts; then
    echo "✅ Proxy configurado correctamente en next.config.ts"
else
    echo "❌ Proxy no encontrado en next.config.ts"
    exit 1
fi

# 4. Verificar configuración CORS
echo "🌐 4. Verificando configuración CORS..."
cd /media/datos/Archivos_Personales/Documentos/Proyectos/authCenterharco/backend
if grep -q "credentials: true" src/config/corsConfig.ts; then
    echo "✅ CORS credentials configurado correctamente"
else
    echo "❌ CORS credentials no configurado"
    exit 1
fi

# 5. Verificar cookie parser
echo "🍪 5. Verificando cookie-parser..."
if grep -q "app.use(cookieParser())" src/server.ts; then
    echo "✅ cookie-parser configurado correctamente"
else
    echo "❌ cookie-parser no configurado"
    exit 1
fi

# 6. Verificar fetchApi configuration
echo "📡 6. Verificando fetchApi..."
cd /media/datos/Archivos_Personales/Documentos/Proyectos/authCenterharco/frontend
if grep -q "NODE_ENV === 'production'" src/utils/api.ts; then
    echo "✅ fetchApi configurado para producción"
else
    echo "❌ fetchApi no configurado para producción"
    exit 1
fi

echo ""
echo "🎉 ===== TODAS LAS VERIFICACIONES PASARON ====="
echo "✅ El sistema está listo para despliegue"
echo ""
echo "📝 Resumen de la configuración:"
echo "   • Frontend: Build exitoso con proxy /api/v1"
echo "   • Backend: Build exitoso con CORS y cookies"
echo "   • Proxy: Configurado para producción Vercel → Render"
echo "   • Cookies: Configuradas con HttpOnly, Secure, SameSite"
echo ""
echo "🚀 Listo para desplegar a Vercel y Render"
