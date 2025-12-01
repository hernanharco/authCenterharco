```
            ┌───────────────┐
            │   Frontend    │
            │ (React/Next)  │
            └───────┬───────┘
                    │
     HTTP Request con body JSON o cookies (authToken / refreshToken)
                    │
                    ▼
           ┌──────────────────┐
           │   Express Route  │
           │  /auth/perfil    │
           └───────┬──────────┘
                   │
          Middleware: authenticateToken
                   │
                   ▼
       ┌─────────────────────────┐
       │ authService.verifyToken │
       │   - Verifica JWT        │
       │   - Decodifica payload  │
       └─────────┬──────────────┘
                 │
          Si JWT válido → next
          Si inválido → 401
                 │
                 ▼
       ┌─────────────────────────┐
       │ authService.getUserRole │
       │   - Consulta DB Supabase│
       │   - Obtiene rol real    │
       └─────────┬──────────────┘
                 │
       Guarda en req.user {id, email, role, ...payload}
                 │
                 ▼
        Middleware: hasRole("admin")?
        ┌─────────────┴─────────────┐
        │ Si la ruta requiere rol   │
        │ y coincide → next()       │
        │ Si no coincide → 403      │
        └─────────────┬─────────────┘
                      │
                      ▼
             ┌───────────────────┐
             │   Route Handler   │
             │   /perfil o admin │
             │ - Usa req.user    │
             │ - Devuelve JSON   │
             └───────────────────┘
                      │
                      ▼
                Response JSON
                      │
                      ▼
                ┌─────────────┐
                │  Frontend   │
                └─────────────┘

```