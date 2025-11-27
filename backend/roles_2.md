# 1. 🛡️ Implementación de Gestión de Roles (RBAC)
Ahora que tienes la estructura y el JWT funciona, puedes usar los roles para restringir el acceso a rutas específicas.

- **Asignación de Roles:** En tu backend Express, modifica el middleware authenticateToken para que solo permita el acceso si el req.user.role coincide con el rol requerido.

- **Crear Roles Personalizados:** Puedes usar database triggers en Supabase para insertar roles personalizados (ej., admin, editor) en el app_metadata del JWT cuando un usuario se registra.
___

## 🛠️ Paso 1: Configuración de Roles en el Backend
Modificaremos el middleware de autenticación para que no solo verifique el JWT, sino que también compruebe si el usuario tiene el rol necesario para acceder a la ruta.

### 1.1. Modificar authMiddleware.js (Añadir hasRole)
En tu archivo backend/src/middleware/authMiddleware.js, añade una nueva función hasRole que usaremos en las rutas.
```
// Middleware para verificar si el usuario (que ya ha sido autenticado) tiene el rol requerido.
export const hasRole = (requiredRole) => {
    return (req, res, next) => {
        // El payload del JWT de Supabase ya está en req.user
        const userRole = req.user?.role; // Accede al rol que está en la raíz del payload

        if (!userRole) {
            // El JWT es válido, pero no tiene rol (no debería pasar con Supabase)
            return res.status(403).json({ message: 'Acceso denegado: Rol no encontrado.' });
        }

        if (userRole !== requiredRole) {
            // El rol del usuario no coincide con el rol requerido por la ruta
            return res.status(403).json({ 
                message: `Acceso denegado: Se requiere el rol '${requiredRole}'. Tu rol es '${userRole}'.` 
            });
        }

        // Si el rol coincide, pasa al siguiente middleware o a la función de la ruta
        next();
    };
};
```
### 1.2. Modificar authRoutes.js (Crear Ruta Protegida por Rol)
En tu archivo backend/src/routes/authRoutes.js, crea una nueva ruta y usa el middleware hasRole que acabas de definir.

**Asegúrate de importar hasRole en la parte superior:**
```
// backend/src/routes/authRoutes.js (Añade la importación)
import { authenticateToken, hasRole } from '../middleware/authMiddleware'; 
// ...
```
**Añade la nueva ruta de Administrador:**
```
// backend/src/routes/authRoutes.js (Añade la nueva ruta al final)

// 4. RUTA PROTEGIDA POR ROL (Solo para 'admin')
router.get('/admin-data', authenticateToken, hasRole('admin'), (req, res) => {
    res.json({
        message: '¡Acceso Concedido! Eres un administrador.',
        secretData: 'Datos confidenciales del administrador.'
    });
});
```
_____
## 🧪 Paso 2: Prueba de RBAC en Postman
Para probar esto, utilizaremos tu usuario actual (que tiene el rol authenticated).

**Prueba 4: Acceso a la Ruta de Administrador (Fallo Esperado)**
1. Asegúrate de que la cookie authToken de tu usuario normal (rol: authenticated) esté activa en Postman.

2. **Método:** GET

3. **URL:** http://localhost:3000/api/admin-data

4. **Resultado Esperado: 403 Forbidden** (Prohibido).

5. **Cuerpo de la Respuesta:** Deberías ver el mensaje: "Acceso denegado: Se requiere el rol 'admin'. Tu rol es 'authenticated'."

Esto confirma que el RBAC está funcionando en tu backend Express.
___
## 💡 Paso 3: Asignar un Rol de Administrador (Opcional)
Si deseas probar un acceso exitoso, debes modificar el rol de un usuario en la base de datos de Supabase para que su JWT cambie a admin.

1. **En tu base de datos de Supabase** (usando SQL Editor o el Panel de Usuarios), busca tu usuario de prueba.

2. **Modifica el rol:** En la tabla auth.users, puedes editar la columna role del usuario de authenticated a admin.

3. **Vuelve a iniciar sesión:** El usuario debe cerrar sesión y volver a iniciar sesión para que Supabase le emita un nuevo JWT que contenga el rol admin.

4. **Repite la Prueba 4:** Ahora debería dar **200 OK.**

Una vez que completes estos pasos, tu backend tendrá un sistema de gestión de roles básico implementado.
__
## 🔑 Paso a Paso: Asignar Rol 'admin' en Supabase
Esta operación se realiza directamente en la base de datos de tu proyecto Supabase.

### 1. 🖥️ Identificar el ID del Usuario
Antes de modificar la base de datos, necesitas el ID (UUID) del usuario que deseas convertir en administrador.

1. **Navega a la Sección de Autenticación:** En el panel de control de Supabase, haz clic en **Authentication** (el icono de candado).

2. **Ve a la Pestaña Users:** Busca el usuario que registraste (ej., nuevo.usuario.final@ejemplo.com).

3. **Copia el UUID:** Copia el **ID único de usuario** que es un formato largo de letras y números (UUID). Por ejemplo: 45e0ecb3-d65d-456a-951e-fb2a8ee71494.

### 2. 📝 Acceder al Editor SQL
Vamos a ejecutar una consulta SQL directa para actualizar el rol en la tabla interna de Supabase.

1. **Navega a la Base de Datos:** En el menú lateral izquierdo de Supabase, haz clic en **Database** (Base de Datos) (el icono del cohete o similar).

2. **Abre el Editor SQL:** Haz clic en **SQL Editor.**

### 3. ⚙️ Ejecutar la Sentencia SQL de Actualización
Ejecuta la siguiente consulta para actualizar el rol. Esta consulta busca el usuario por su ID y cambia su campo role de la tabla interna auth.users.

**Importante:** La tabla está en el esquema auth, no en public.
```
UPDATE auth.users
SET role = 'admin'
WHERE id = '[PEGA AQUÍ EL UUID DE TU USUARIO]';
```
1. Pega esta sentencia en el editor, reemplazando el ID.

2. Haz clic en el botón **RUN** (Ejecutar) o **RUN QUERY.**

3. Deberías ver un mensaje de éxito, indicando que una fila fue actualizada.
_______
### 4. 🔄 Cerrar Sesión y Volver a Iniciar Sesión
El JWT actual de tu usuario (el que está en la cookie authToken) sigue diciendo que el rol es authenticated. Para que el cambio de rol se refleje, debes obtener un nuevo JWT:

1. **Cierra la Sesión en el Frontend:** Ve a tu aplicación Next.js y haz clic en **Cerrar Sesión** para borrar la authToken cookie.

2. **Vuelve a Iniciar Sesión:** Usa el mismo email y contraseña para **iniciar sesión (Login).**

Al iniciar sesión de nuevo, Supabase generará un nuevo JWT que ahora contendrá {"role": "admin"} en el payload.
____
### 5. ✅ Probar la Ruta de Administrador
Finalmente, prueba la ruta protegida por RBAC en Postman (o en tu frontend):

1. **URL de Prueba:** http://localhost:3000/api/admin-data (o http://localhost:3000/auth/admin-data, si usas el prefijo /auth).

2. **Resultado Esperado:** Ahora deberías recibir **200 OK** y el mensaje: "¡Acceso Concedido! Eres un administrador."

Esto confirmará que el middleware hasRole('admin') funciona y que tu Express está leyendo correctamente el rol modificado del JWT.

**en el punto 5 de primera parte no funciono la solucion fue la siguiente**
## 🛑 Análisis del Error: El Token es Incorrecto
El problema no es el código de RBAC ni la modificación SQL que hiciste, sino el token JWT que estás usando para la prueba en Postman.

1. ¿Qué es service_role?
El rol service_role es un rol de muy alto privilegio utilizado por la Service Key de Supabase (la clave secreta). Este rol otorga permisos para evitar la seguridad de nivel de fila (RLS) y manipular la base de datos a nivel de sistema.

**Este rol NUNCA debe aparecer en el token JWT de un usuario normal.**

2. ¿Por qué aparece?
Esto solo puede ocurrir si:

- Accidentalmente usaste la Service Role Secret Key de Supabase como el token en la ruta /auth/set-cookie.

- O si hay un error en tu código de authService que está usando la clave secreta en lugar del JWT del usuario. (Asumo que el authService está usando la clave anon o está bien configurado, por lo que el primer punto es más probable).

3. El Token del Usuario Admin
Tu usuario tiene ahora el rol admin en la base de datos, pero para que ese rol se active, debes obtener un nuevo JWT de usuario después de que el cambio SQL fue aplicado y el usuario volvió a iniciar sesión.
__
### 🛠️ Solución: Obtener y Usar el JWT de Usuario (Rol admin)
Necesitas repetir el flujo de inicio de sesión para asegurarte de que Postman tenga el nuevo JWT con el rol admin.

#### Paso 1: Cerrar Sesión y Volver a Iniciar Sesión (Necesario para Generar el JWT admin)
1. **Cierra la Sesión:** Ve a tu frontend (donde iniciaste sesión) y haz clic en "Cerrar Sesión" (o borra la cookie authToken en Postman).

2. **Vuelve a Iniciar Sesión:** Inicia sesión de nuevo con el usuario que modificaste a admin.

Este proceso fuerza a Supabase a emitir un **nuevo JWT** que contiene el rol actualizado (admin).

#### Paso 2: Re-enviar el JWT Correcto a /auth/set-cookie
Si estás probando el flujo completo en Postman (en lugar de confiar en el frontend):

1. Obtén el Nuevo JWT: Después del inicio de sesión (OAuth o email/pass), Supabase te proporciona el nuevo JWT. Cópialo.

2. Actualiza la Cookie authToken: Vuelve a la ruta /auth/set-cookie en Postman.

- Método: POST

- URL: http://localhost:3000/auth/set-cookie

- Body (JSON):
```
{
    "token": "[PEGA AQUÍ EL NUEVO JWT DE USUARIO - NO LA SERVICE KEY]"
}
```
- Envía la solicitud. Deberías obtener un 200 OK y la cookie authToken se actualizará con el JWT que tiene el rol admin.

#### Paso 3: Prueba Final de Éxito
Ahora, con la cookie authToken correcta (la que contiene el rol admin):

1. Método: GET

2. URL: http://localhost:3000/api/admin-data

3. Resultado Esperado: 200 OK con el mensaje de éxito:
```
{
    "message": "¡Acceso Concedido! Eres un administrador.",
    "secretData": "Datos confidenciales del administrador."
}
```
El error service_role ahora desaparecerá, y verás que el RBAC te permite el acceso.