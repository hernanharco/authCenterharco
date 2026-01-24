# AuthCenterharco

Plataforma de autenticación multi-tenant construida con Next.js frontend y Express.js backend, integrada con Supabase para la gestión de base de datos y autenticación.

## 🏗️ Arquitectura

- **Frontend**: Next.js 16 con TypeScript, Tailwind CSS y componentes Radix UI
- **Backend**: Express.js con TypeScript, CORS y manejo de cookies
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: JWT con Supabase Auth

## 🚀 Características

- ✅ Autenticación de usuarios con Supabase
- ✅ Gestión de roles y permisos
- ✅ Arquitectura multi-tenant
- ✅ API RESTful con Express.js
- ✅ Interfaz moderna con Next.js y Tailwind CSS
- ✅ Manejo seguro de cookies y tokens
- ✅ CORS configurado para desarrollo

## 📋 Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Git

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd authCenterharco
   ```

2. **Instalar dependencias del backend**
   ```bash
   cd backend
   npm install
   ```

3. **Instalar dependencias del frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configurar variables de entorno**
   ```bash
   # Copiar el archivo de ejemplo
   cp .env.example .env
   
   # Editar con tus credenciales de Supabase
   nano .env
   ```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Supabase Configuration
SUPABASE_URL=tu_supabase_url
SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# JWT Configuration
JWT_SECRET=tu_jwt_secreto

# Server Configuration
PORT=4000
NODE_ENV=development

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:3000
```

## 🏃‍♂️ Ejecución

### Modo Desarrollo

1. **Iniciar el backend**
   ```bash
   cd backend
   npm run dev
   ```
   El backend correrá en `http://localhost:4000`

2. **Iniciar el frontend** (en otra terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   El frontend correrá en `http://localhost:3000`

### Modo Producción

1. **Construir el backend**
   ```bash
   cd backend
   npm run build
   npm start
   ```

2. **Construir el frontend**
   ```bash
   cd frontend
   npm run build
   npm start
   ```

## 📁 Estructura del Proyecto

```
authCenterharco/
├── backend/                 # API RESTful con Express.js
│   ├── src/
│   │   ├── routes/         # Rutas de la API
│   │   ├── middleware/     # Middleware personalizado
│   │   └── server.ts       # Servidor principal
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # Aplicación Next.js
│   ├── src/
│   │   ├── app/           # App Router de Next.js
│   │   ├── components/    # Componentes React
│   │   └── lib/          # Utilidades y configuración
│   ├── package.json
│   └── tailwind.config.js
├── .env.example           # Plantilla de variables de entorno
├── .env                  # Variables de entorno (no versionado)
├── .gitignore           # Archivos ignorados por Git
├── Dockerfile           # Configuración de Docker
└── README.md           # Este archivo
```

## 🔌 Endpoints de la API

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/profile` - Obtener perfil de usuario

### Usuarios
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obtener usuario específico
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

## 🐳 Docker

Para ejecutar la aplicación con Docker:

```bash
# Construir la imagen
docker build -t authcenterharco .

# Ejecutar el contenedor
docker run -p 4000:4000 -p 3000:3000 authcenterharco
```

O usar docker-compose si está disponible:

```bash
docker-compose up -d
```

## 🔧 Tecnologías Utilizadas

### Backend
- **Express.js** - Framework web
- **TypeScript** - Tipado estático
- **Supabase** - Base de datos y autenticación
- **JWT** - Tokens de autenticación
- **CORS** - Compartir recursos entre orígenes
- **Cookie-parser** - Manejo de cookies

### Frontend
- **Next.js 16** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework CSS
- **Radix UI** - Componentes accesibles
- **Lucide React** - Iconos
- **Framer Motion** - Animaciones

## 🤝 Contribución

1. Fork del proyecto
2. Crear una rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit de los cambios (`git commit -am 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto está licenciado bajo la Licencia ISC - ver el archivo [LICENSE](LICENSE) para detalles.

## 🐛 Issues

Si encuentras algún bug o tienes sugerencias, por favor abre un issue en el repositorio.

## 📞 Contacto

- **Autor**: Hernán Harco
- **Email**: [hernan.harco@gmail.com]
- **GitHub**: [[tu-github](https://github.com/hernanharco)]

---

**Nota**: Asegúrate de nunca subir tu archivo `.env` a repositorios públicos. Usa siempre `.env.example` como referencia.
