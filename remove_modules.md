# Pasos para solucionarlo en Windows/PowerShell:

## 1.Eliminar node_modules y lockfile (PowerShell):
```
Remove-Item -Recurse -Force node_modules
Remove-Item -Force pnpm-lock.yaml
```

## 2.Instalar de nuevo con pnpm
```
pnpm install
```

## 3.Verificar que el paquete está realmente en node_modules
```
ls node_modules/@supabase/supabase-js
```