#!/bin/bash

# Script de configuración y despliegue para authCenterharco
# Este script configura el entorno y levanta los contenedores Docker

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${YELLOW}[STEP]${NC} $1"
}

# Verificar si se está ejecutando como root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "No se recomienda ejecutar este script como root"
        read -p "¿Desea continuar? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Verificar dependencias del sistema
check_dependencies() {
    log_step "Verificando dependencias del sistema..."
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker no está instalado. Por favor instale Docker primero."
        exit 1
    fi
    log_success "Docker encontrado: $(docker --version)"
    
    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose no está instalado. Por favor instale Docker Compose primero."
        exit 1
    fi
    
    if command -v docker-compose &> /dev/null; then
        log_success "Docker Compose encontrado: $(docker-compose --version)"
        COMPOSE_CMD="docker-compose"
    else
        log_success "Docker Compose encontrado: $(docker compose version)"
        COMPOSE_CMD="docker compose"
    fi
    
    # Verificar pnpm
    if ! command -v pnpm &> /dev/null; then
        log_warning "pnpm no está instalado localmente. Los contenedores usarán pnpm instalado en Docker."
    else
        log_success "pnpm encontrado: $(pnpm --version)"
    fi
}

# Verificar estructura del proyecto
check_project_structure() {
    log_step "Verificando estructura del proyecto..."
    
    required_files=(
        "docker-compose.yml"
        "backend/Dockerfile"
        "frontend/Dockerfile"
        "backend/package.json"
        "frontend/package.json"
        "backend/pnpm-lock.yaml"
        "frontend/pnpm-lock.yaml"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Archivo requerido no encontrado: $file"
            exit 1
        fi
    done
    
    log_success "Estructura del proyecto verificada"
}

# Verificar archivo .env
check_env_file() {
    log_step "Verificando archivo de entorno..."
    
    if [[ ! -f ".env" ]]; then
        log_warning "Archivo .env no encontrado"
        if [[ -f ".env.example" ]]; then
            log_info "Copiando .env.example a .env"
            cp .env.example .env
            log_warning "Por favor configure las variables de entorno en el archivo .env"
        else
            log_error "No se encontró .env.example. Por favor cree un archivo .env con las variables necesarias."
            exit 1
        fi
    else
        log_success "Archivo .env encontrado"
    fi
}

# Limpiar contenedores y volúmenes anteriores (opcional)
cleanup() {
    log_step "Limpiando contenedores anteriores..."
    
    # Detener y remover contenedores
    $COMPOSE_CMD down --remove-orphans 2>/dev/null || true
    
    # Preguntar si se desea limpiar volúmenes
    read -p "¿Desea limpiar también los volúmenes Docker? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        $COMPOSE_CMD down -v 2>/dev/null || true
        log_info "Volúmenes limpiados"
    fi
    
    # Preguntar si se desea limpiar imágenes
    read -p "¿Desea limpiar también las imágenes Docker? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        $COMPOSE_CMD down --rmi all 2>/dev/null || true
        log_info "Imágenes limpiadas"
    fi
    
    log_success "Limpieza completada"
}

# Construir y levantar contenedores
build_and_deploy() {
    log_step "Construyendo y levantando contenedores..."
    
    # Construir imágenes
    log_info "Construyendo imágenes Docker..."
    $COMPOSE_CMD build --no-cache
    
    # Levantar servicios
    log_info "Levantando servicios..."
    $COMPOSE_CMD up -d
    
    log_success "Servicios levantados"
}

# Verificar estado de los servicios
check_services() {
    log_step "Verificando estado de los servicios..."
    
    # Esperar un momento para que los servicios inicien
    sleep 10
    
    # Verificar estado de los contenedores
    if $COMPOSE_CMD ps | grep -q "Up"; then
        log_success "Contenedores están corriendo"
        $COMPOSE_CMD ps
    else
        log_error "Algunos contenedores no están corriendo correctamente"
        $COMPOSE_CMD ps
        $COMPOSE_CMD logs --tail=20
        exit 1
    fi
    
    # Verificar health checks
    log_info "Esperando health checks..."
    sleep 30
    
    if $COMPOSE_CMD ps | grep -q "healthy"; then
        log_success "Servicios saludables"
    else
        log_warning "Algunos servicios podrían no estar completamente listos"
        $COMPOSE_CMD ps
    fi
}

# Mostrar información de acceso
show_access_info() {
    log_step "Información de acceso:"
    echo
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:4000"
    echo
    echo "Comandos útiles:"
    echo "  Ver logs: $COMPOSE_CMD logs -f"
    echo "  Detener servicios: $COMPOSE_CMD down"
    echo "  Reiniciar servicios: $COMPOSE_CMD restart"
    echo
    echo "Para ver los logs de un servicio específico:"
    echo "  Frontend: $COMPOSE_CMD logs -f frontend"
    echo "  Backend: $COMPOSE_CMD logs -f backend"
    echo
}

# Función principal
main() {
    echo "🚀 Script de configuración para authCenterharco"
    echo "============================================"
    echo
    
    # Parsear argumentos
    CLEANUP=false
    SKIP_DEPS=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --cleanup)
                CLEANUP=true
                shift
                ;;
            --skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            --help|-h)
                echo "Uso: $0 [OPCIONES]"
                echo
                echo "Opciones:"
                echo "  --cleanup    Limpia contenedores, volúmenes e imágenes anteriores"
                echo "  --skip-deps  Omite la verificación de dependencias del sistema"
                echo "  --help, -h   Muestra esta ayuda"
                echo
                exit 0
                ;;
            *)
                log_error "Opción desconocida: $1"
                echo "Use --help para ver las opciones disponibles"
                exit 1
                ;;
        esac
    done
    
    # Ejecutar pasos
    check_root
    
    if [[ "$SKIP_DEPS" == false ]]; then
        check_dependencies
    fi
    
    check_project_structure
    check_env_file
    
    if [[ "$CLEANUP" == true ]]; then
        cleanup
    fi
    
    build_and_deploy
    check_services
    show_access_info
    
    log_success "🎉 Configuración completada exitosamente!"
}

# Capturar interrupciones
trap 'log_error "Setup interrumpido"; exit 1' INT TERM

# Ejecutar función principal
main "$@"
