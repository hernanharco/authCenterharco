// Archivo: test-env.ts
// Ejecutar con: ts-node test-env.ts

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

async function testSupabaseConnection() {
  console.log("\n🧪 ===== TEST DE CONEXIÓN SUPABASE =====\n");

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. Verificar que existen
  console.log("1️⃣ Verificando variables...");
  if (!url || !anonKey || !serviceKey) {
    console.error("❌ Faltan variables de entorno");
    process.exit(1);
  }
  console.log("✅ Todas las variables definidas\n");

  // 2. Test con cliente normal (anon key)
  console.log("2️⃣ Probando conexión con ANON KEY...");
  try {
    const supabase = createClient(url, anonKey);
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error("❌ Error con anon key:", error.message);
    } else {
      console.log("✅ Conexión exitosa con anon key");
    }
  } catch (err: any) {
    console.error("❌ Excepción con anon key:", err.message);
  }

  // 3. Test con cliente admin (service key)
  console.log("\n3️⃣ Probando conexión con SERVICE KEY...");
  try {
    const supabaseAdmin = createClient(url, serviceKey);
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    
    if (error) {
      console.error("❌ Error con service key:", error.message);
    } else {
      console.log("✅ Conexión exitosa con service key");
      console.log(`   Total de usuarios en el sistema: ${data.users.length > 0 ? 'OK' : '0'}`);
    }
  } catch (err: any) {
    console.error("❌ Excepción con service key:", err.message);
  }

  // 4. Verificar estructura de la base de datos
  console.log("\n4️⃣ Verificando tabla 'users'...");
  try {
    const supabase = createClient(url, anonKey);
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(1);
    
    if (error) {
      console.error("❌ Error al acceder a tabla 'users':", error.message);
      console.warn("   ⚠️  Verifica que la tabla existe y tiene las columnas correctas");
    } else {
      console.log("✅ Tabla 'users' accesible");
      if (data && data.length > 0) {
        console.log("   Estructura confirmada:", Object.keys(data[0]));
      }
    }
  } catch (err: any) {
    console.error("❌ Excepción al verificar tabla:", err.message);
  }

  console.log("\n========================================\n");
}

testSupabaseConnection().catch(console.error);