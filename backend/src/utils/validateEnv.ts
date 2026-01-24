// Crea este archivo: src/utils/validateEnv.ts

import "dotenv/config";

interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): EnvValidationResult {
  const result: EnvValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  console.log("\n🔍 ===== VALIDACIÓN DE VARIABLES DE ENTORNO =====\n");

  // Variables requeridas
  const requiredVars = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV
  };

  // Variables opcionales pero recomendadas
  const optionalVars = {
    FRONTEND_URL: process.env.FRONTEND_URL,
    AUTH_FRONTEND_URL: process.env.AUTH_FRONTEND_URL,
    PORT: process.env.PORT
  };

  // 1. Verificar que existen
  console.log("📋 Variables Requeridas:");
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      console.error(`  ❌ ${key}: NO DEFINIDA`);
      result.errors.push(`${key} no está definida`);
      result.isValid = false;
    } else {
      console.log(`  ✅ ${key}: Definida`);
    }
  }

  console.log("\n📋 Variables Opcionales:");
  for (const [key, value] of Object.entries(optionalVars)) {
    if (!value) {
      console.warn(`  ⚠️  ${key}: No definida (usando default)`);
      result.warnings.push(`${key} no está definida`);
    } else {
      console.log(`  ✅ ${key}: ${value}`);
    }
  }

  // 2. Validar formato de SUPABASE_URL
  if (requiredVars.SUPABASE_URL) {
    const urlPattern = /^https:\/\/[a-z0-9]+\.supabase\.co$/;
    if (!urlPattern.test(requiredVars.SUPABASE_URL)) {
      console.error("\n  ❌ SUPABASE_URL tiene formato incorrecto");
      console.error(`     Esperado: https://xxxxxxxx.supabase.co`);
      console.error(`     Recibido: ${requiredVars.SUPABASE_URL}`);
      result.errors.push("SUPABASE_URL tiene formato inválido");
      result.isValid = false;
    } else {
      console.log("\n  ✅ SUPABASE_URL formato correcto");
    }
  }

  // 3. Validar que las keys sean JWT (tienen 3 partes separadas por punto)
  const validateJWT = (key: string, value: string | undefined) => {
    if (!value) return;
    
    const parts = value.split('.');
    if (parts.length !== 3) {
      console.error(`\n  ❌ ${key} NO es un JWT válido (debe tener 3 partes)`);
      console.error(`     Partes encontradas: ${parts.length}`);
      result.errors.push(`${key} no es un JWT válido`);
      result.isValid = false;
    } else {
      console.log(`  ✅ ${key} es un JWT válido`);
    }
  };

  console.log("\n🔐 Validación de Tokens JWT:");
  validateJWT("SUPABASE_ANON_KEY", requiredVars.SUPABASE_ANON_KEY);
  validateJWT("SUPABASE_SERVICE_ROLE_KEY", requiredVars.SUPABASE_SERVICE_ROLE_KEY);

  // 4. Mostrar información de conexión
  console.log("\n🌐 Información de Conexión:");
  console.log(`  • Entorno: ${requiredVars.NODE_ENV || 'development'}`);
  console.log(`  • Puerto: ${optionalVars.PORT || '4000'}`);
  console.log(`  • Frontend Principal: ${optionalVars.FRONTEND_URL || 'No definido'}`);
  console.log(`  • Auth Frontend: ${optionalVars.AUTH_FRONTEND_URL || 'No definido'}`);

  // 5. Test de conexión a Supabase
  console.log("\n🔌 Test de Conexión:");
  console.log(`  • Supabase URL: ${requiredVars.SUPABASE_URL}`);
  
  // Mostrar primeros/últimos caracteres de las keys (por seguridad)
  if (requiredVars.SUPABASE_ANON_KEY) {
    const anonPreview = `${requiredVars.SUPABASE_ANON_KEY.slice(0, 20)}...${requiredVars.SUPABASE_ANON_KEY.slice(-20)}`;
    console.log(`  • Anon Key: ${anonPreview}`);
  }
  
  if (requiredVars.SUPABASE_SERVICE_ROLE_KEY) {
    const servicePreview = `${requiredVars.SUPABASE_SERVICE_ROLE_KEY.slice(0, 20)}...${requiredVars.SUPABASE_SERVICE_ROLE_KEY.slice(-20)}`;
    console.log(`  • Service Key: ${servicePreview}`);
  }

  // 6. Resumen final
  console.log("\n" + "=".repeat(50));
  if (result.isValid) {
    console.log("✅ TODAS LAS VARIABLES DE ENTORNO SON VÁLIDAS");
  } else {
    console.error("❌ SE ENCONTRARON ERRORES EN LAS VARIABLES DE ENTORNO");
    console.error("\nErrores:");
    result.errors.forEach(err => console.error(`  • ${err}`));
  }

  if (result.warnings.length > 0) {
    console.warn("\n⚠️  Advertencias:");
    result.warnings.forEach(warn => console.warn(`  • ${warn}`));
  }

  console.log("=".repeat(50) + "\n");

  return result;
}

// Ejecutar validación si se importa
export function initEnvValidation() {
  const validation = validateEnvironment();
  
  if (!validation.isValid) {
    console.error("\n🚨 El servidor no puede iniciar con variables de entorno inválidas\n");
    process.exit(1);
  }
  
  return validation;
}