#!/bin/bash

# AuthCenterharco Setup Script
# Este script configura el entorno de desarrollo para el proyecto

set -e

echo "🚀 Configurando AuthCenterharco..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes coloreados
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Verificar si Node.js está instalado
check_node() {
    print_step "Verificando Node.js..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js no está instalado. Por favor instala Node.js 18+ desde https://nodejs.org"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        print_error "Se requiere Node.js 18+. Versión actual: $NODE_VERSION"
        exit 1
    fi
    
    print_message "✅ Node.js $NODE_VERSION encontrado"
}

# Verificar si npm está instalado
check_npm() {
    print_step "Verificando npm..."
    if ! command -v npm &> /dev/null; then
        print_error "npm no está instalado"
        exit 1
    fi
    
    NPM_VERSION=$(npm -v)
    print_message "✅ npm $NPM_VERSION encontrado"
}

# Instalar dependencias del backend
install_backend_deps() {
    print_step "Instalando dependencias del backend..."
    cd backend
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    cd ..
    print_message "✅ Dependencias del backend instaladas"
}

# Instalar dependencias del frontend
install_frontend_deps() {
    print_step "Instalando dependencias del frontend..."
    cd frontend
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    cd ..
    print_message "✅ Dependencias del frontend instaladas"
}

# Crear archivo .env si no existe
setup_env() {
    print_step "Configurando variables de entorno..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_message "✅ Archivo .env creado desde .env.example"
            print_warning "⚠️  Por favor edita el archivo .env con tus credenciales de Supabase"
        else
            print_warning "⚠️  No se encontró .env.example. Creando archivo .env básico..."
            cat > .env << EOF
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
EOF
            print_message "✅ Archivo .env creado"
            print_warning "⚠️  Por favor edita el archivo .env con tus credenciales reales"
        fi
    else
        print_message "✅ Archivo .env ya existe"
    fi
}

# Verificar estructura del proyecto
check_structure() {
    print_step "Verificando estructura del proyecto..."
    
    required_dirs=("backend" "frontend")
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            print_error "Directorio requerido '$dir' no encontrado"
            exit 1
        fi
    done
    
    required_files=("backend/package.json" "frontend/package.json")
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Archivo requerido '$file' no encontrado"
            exit 1
        fi
    done
    
    print_message "✅ Estructura del proyecto verificada"
}

# Construir el backend
build_backend() {
    print_step "Construyendo el backend..."
    cd backend
    npm run build
    cd ..
    print_message "✅ Backend construido exitosamente"
}

# Construir el frontend
build_frontend() {
    print_step "Construyendo el frontend..."
    cd frontend
    npm run build
    cd ..
    print_message "✅ Frontend construido exitosamente"
}

# Construir con Docker
build_docker() {
    print_step "Construyendo imágenes Docker..."
    
    # Verificar si Docker está instalado
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado. Por favor instala Docker desde https://docker.com"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose no está instalado. Por favor instala Docker Compose"
        exit 1
    fi
    
    # Construir y levantar contenedores
    docker-compose build
    docker-compose up -d
    
    print_message "✅ Contenedores Docker construidos e iniciados"
}

# Mostrar comandos de inicio
show_start_commands() {
    print_message "🎉 ¡Configuración completada!"
    echo ""
    echo -e "${BLUE}Opciones de ejecución:${NC}"
    echo ""
    echo "1. Modo Desarrollo (Recomendado para desarrollo):"
    echo "   Terminal 1 (Backend):"
    echo "     cd backend && npm run dev"
    echo "   Terminal 2 (Frontend):"
    echo "     cd frontend && npm run dev"
    echo ""
    echo "2. Docker (Producción):"
    echo "   docker-compose up -d"
    echo "   docker-compose logs -f  # Ver logs"
    echo "   docker-compose down     # Detener"
    echo ""
    echo -e "${BLUE}Accesos:${NC}"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:4000"
    echo "  API Docs: http://localhost:4000/api"
    echo ""
    print_warning "⚠️  Asegúrate de haber configurado tus credenciales en el archivo .env"
}

# Función principal
main() {
    echo "========================================"
    echo "    AuthCenterharco Setup Script      "
    echo "========================================"
    echo ""
    
    # Verificar prerequisitos
    check_node
    check_npm
    check_structure
    
    # Instalar dependencias
    install_backend_deps
    install_frontend_deps
    
    # Configurar entorno
    setup_env
    
    # Construir proyectos
    build_backend
    build_frontend
    
    # Preguntar si quiere usar Docker
    echo ""
    read -p "¿Quieres construir y levantar los contenedores Docker? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_docker
    fi
    
    # Mostrar comandos de inicio
    show_start_commands
    
    echo ""
    print_message "✨ ¡Listo para empezar a desarrollar! ✨"
}

# Manejar interrupción
trap 'print_error "Setup interrumpido"; exit 1' INT

# Ejecutar script
main "$@"
