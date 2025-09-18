# Protección de la rama principal (main)

Este repositorio tiene configuradas protecciones para la rama `main` que garantizan que solo el propietario del repositorio (GustavoEraso) pueda realizar cambios directos.

## Reglas de protección implementadas

### 1. Pull Requests restringidos
- Solo **GustavoEraso** puede crear pull requests hacia la rama `main`
- Todos los PRs deben pasar las validaciones automáticas antes de poder ser mergeados

### 2. Validaciones automáticas
Los siguientes checks se ejecutan automáticamente en cada PR:
- ✅ Verificación de autoría del PR
- ✅ Linting del código (`pnpm lint`)
- ✅ Build del proyecto (`pnpm build`)

### 3. CODEOWNERS
- Se requiere aprobación de **GustavoEraso** para todos los cambios
- Especialmente protegidos:
  - Archivos de configuración de GitHub (`.github/`)
  - Código fuente (`src/`)
  - Configuraciones del proyecto (`package.json`, `tsconfig.json`, etc.)

## ¿Cómo trabajar con estas protecciones?

### Para GustavoEraso (propietario):
1. Crear ramas de desarrollo para nuevas funcionalidades
2. Hacer los cambios en la rama de desarrollo
3. Crear PR desde la rama de desarrollo hacia `main`
4. Las validaciones se ejecutarán automáticamente
5. Una vez que pasen todas las validaciones, el PR puede ser mergeado

### Para otros colaboradores:
1. Crear ramas de desarrollo
2. Hacer PRs hacia ramas de desarrollo (NO hacia `main`)
3. GustavoEraso revisará y mergeará los cambios apropiados

## Comandos útiles

```bash
# Crear una nueva rama de desarrollo
git checkout -b feature/nueva-funcionalidad

# Hacer commits en la rama de desarrollo
git add .
git commit -m "Descripción del cambio"

# Subir la rama al repositorio
git push origin feature/nueva-funcionalidad
```

## Beneficios de esta configuración

- 🔒 **Seguridad**: Previene cambios no autorizados en la rama principal
- 🧪 **Calidad**: Todas las validaciones deben pasar antes del merge
- 📝 **Trazabilidad**: Todos los cambios pasan por review obligatorio
- 🚀 **Estabilidad**: La rama main siempre mantiene código funcional

## Configuración técnica

Las protecciones están implementadas mediante:
- **GitHub Actions** (`.github/workflows/`)
- **CODEOWNERS** (`.github/CODEOWNERS`)
- **Validaciones automáticas** de linting y build

Esta configuración asegura que la rama `main` esté siempre protegida y que solo cambios autorizados y validados puedan ser incorporados.