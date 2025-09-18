# Guía de Contribución

## Protección de la rama principal

Este repositorio tiene protecciones implementadas para mantener la estabilidad y seguridad del código en la rama `main`.

### ⚠️ Restricciones importantes

- **Solo GustavoEraso puede hacer PR directos a `main`**
- **Solo GustavoEraso puede hacer push directo a `main`**
- Todos los cambios deben pasar validaciones automáticas

### 🔄 Flujo de trabajo recomendado

#### Para GustavoEraso (propietario del repositorio):

1. **Crear rama de desarrollo**
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

2. **Hacer cambios y commits**
   ```bash
   git add .
   git commit -m "feat: descripción del cambio"
   ```

3. **Subir la rama**
   ```bash
   git push origin feature/nueva-funcionalidad
   ```

4. **Crear Pull Request**
   - Ir a GitHub y crear PR desde la rama hacia `main`
   - Las validaciones se ejecutarán automáticamente
   - Una vez que pasen todas las validaciones, el PR puede ser mergeado

#### Para otros colaboradores:

1. **Fork del repositorio**
2. **Crear ramas de desarrollo en tu fork**
3. **Hacer PR hacia ramas de desarrollo (NO hacia `main`)**
4. **GustavoEraso revisará y mergeará los cambios apropiados**

### 🤖 Validaciones automáticas

Cada PR hacia `main` ejecuta automáticamente:

- ✅ **Verificación de autorización**: Solo GustavoEraso puede crear PRs
- ✅ **Linting**: `pnpm lint` para verificar calidad del código
- ✅ **Build**: `pnpm build` para asegurar que el código compila
- ✅ **Security check**: Verificación de archivos sensibles

### 📋 Mensajes de commit

Usa mensajes de commit descriptivos siguiendo convenciones:

```
feat: nueva funcionalidad
fix: corrección de bug
docs: actualización de documentación
style: cambios de formato
refactor: refactorización de código
test: adición de tests
chore: tareas de mantenimiento
```

### 🚨 ¿Qué pasa si intento hacer PR a main sin autorización?

Si no eres GustavoEraso e intentas crear un PR hacia `main`:

1. El workflow de validación fallará inmediatamente
2. Recibirás un mensaje de error explicando la restricción
3. Se te pedirá que crees el PR hacia una rama de desarrollo

### 💡 Consejos

- Mantén tus ramas de desarrollo actualizadas con `main`
- Haz commits pequeños y frecuentes
- Describe claramente tus cambios en los PRs
- Prueba tu código localmente antes de hacer push

### 🔧 Comandos útiles

```bash
# Mantener tu rama actualizada
git checkout main
git pull origin main
git checkout tu-rama
git merge main

# Verificar estado antes de commit
git status
git diff

# Verificar que el código compila
pnpm lint
pnpm build
```

### 📞 ¿Necesitas ayuda?

Si tienes dudas sobre el proceso de contribución o las protecciones implementadas, contacta a GustavoEraso.

---

Estas protecciones garantizan que el código en `main` siempre sea estable y que todos los cambios pasen por el proceso de revisión apropiado.