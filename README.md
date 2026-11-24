# FINPRO — Control de gastos del hogar

Aplicación web para gestionar las finanzas personales y familiares: presupuesto por categoría, movimientos (gastos e ingresos), miembros de la familia, gastos hormiga, reportes y panel de administración.

**Stack:** Node.js + Express · PostgreSQL en Supabase para despliegues con `SUPABASE_URL` y `SUPABASE_ANON_KEY`; SQLite local continúa disponible cuando no se configuran · Frontend en HTML/CSS/JavaScript (módulos ES, sin framework) · Chart.js. Se conservó la tecnología del prototipo original (JS vanilla + Chart.js); el prototipo original se guarda en `legacy/FINPRO.original.html`.

## 1. Requisitos
- **Node.js 22.13 o superior** (`node -v`; recomendado la versión LTS actual) y npm.
- Node 22 incluye SQLite para el modo local. El despliegue usa Supabase PostgreSQL y requiere las dos variables descritas abajo.

## 2. Instalación
```bash
cd FINPRO
npm install
cp .env.example .env        # en Windows: copy .env.example .env
```
Edita `.env` para elegir el modo y la URL pública. Con las variables de Supabase configuradas, FINPRO utiliza Supabase Auth y PostgreSQL; sin ellas conserva el modo SQLite local.

## 3. Base de datos
En modo SQLite local, al iniciar el servidor se crea `data/finpro.db`; las migraciones locales están en `server/db/migrations/` y `npm run migrate` las ejecuta por separado. En Supabase, aplica los archivos `supabase/migrations/*.sql` en orden con el SQL Editor o Supabase CLI.

El esquema Supabase contiene `profiles`, `households`, `household_members`, `family_members`, `categories`, `incomes`, `expenses` y `budgets`. La vista `transactions` unifica ingresos y gastos. Los montos se guardan en centavos. Las tablas tienen RLS; perfiles, movimientos y presupuestos quedan restringidos al usuario o hogar asociado.

Variables requeridas para el modo Supabase:
```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<publishable-key>
```
La clave publicable se usa solo desde el servidor y se combina con sesiones Supabase Auth en cookies `httpOnly`. Nunca configures `service_role` ni una clave `secret` en la aplicación. Supabase envía los correos de confirmación y recuperación; configura las URL de redirección de Auth para los dominios local y desplegado.

## 4. Crear el primer administrador
En SQLite local, crea el primer administrador por consola:
```bash
npm run create-admin
# o, sin preguntas:
npm run create-admin -- --email admin@tu-correo.com --name "Administrador"
```
Te pedirá la contraseña (mínimo 8 caracteres, con letras y números). Si el correo ya existe como usuario normal, lo convierte en administrador.

## 5. Iniciar la aplicación
```bash
npm start          # producción/uso normal
npm run dev        # recarga automática al editar el servidor
```
Abre **http://localhost:3000** — el backend sirve también el frontend, no hay que iniciar nada más. En SQLite local puedes cargar datos de muestra; están desactivados cuando se usa Supabase.

## 6. Recuperación de contraseña y correo (servicio externo)
En SQLite, sin SMTP configurado el enlace de recuperación se imprime en la consola (útil en desarrollo). En Supabase, la confirmación de cuenta y la recuperación usan el servicio de correo de Supabase; define su URL de redirección para `APP_URL` y el callback `/reset.html`. Para producción con SQLite configura SMTP en `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_contraseña_de_aplicación
MAIL_FROM="FINPRO <tu_correo@gmail.com>"
APP_URL=https://tu-dominio.com
```
Estas credenciales las debes aportar tú; el proyecto no incluye ninguna.

## 7. Pruebas
```bash
npm test
```
41 pruebas automáticas (base de datos en memoria): registro, login y bloqueo por intentos, sesiones/logout, recuperación de contraseña, CSRF y cabeceras de seguridad, aislamiento entre usuarios, roles/administración, CRUD, filtros, paginación, reportes, exportación CSV y borrado de datos.

## 8. Funcionalidades
- **Cuentas:** registro, login, logout, recuperar y cambiar contraseña, editar perfil, cerrar otras sesiones, eliminar cuenta. Páginas privadas protegidas en servidor.
- **Resumen:** disponible del presupuesto, barra de composición del gasto con marca de alerta, alertas (presupuesto, categorías excedidas, gastos hormiga), gasto diario, últimos movimientos.
- **Movimientos:** crear/editar/eliminar; búsqueda, filtros (tipo, categoría, miembro, período/todo), orden, paginación, exportar CSV.
- **Familia:** miembros (CRUD) con gasto y porcentaje; gráfico de distribución. Al eliminar un miembro sus movimientos se conservan «sin asignar».
- **Reportes:** evolución 6/12 meses, top categorías, tabla presupuesto vs. gasto con estado.
- **Configuración:** nombre del hogar, moneda, **día de corte** (mes financiero), umbral de alerta, límite de gasto hormiga, presupuestos y categorías (CRUD con reasignación), exportar CSV/JSON, borrar todos los datos (pide contraseña).
- **Administración (rol admin):** lista/búsqueda de usuarios, cambiar rol, activar/desactivar, enviar enlace de recuperación, eliminar. El admin **no** puede ver los movimientos de otros usuarios. Protecciones: no auto-degradarse y siempre debe quedar un admin activo.
- **Interfaz:** tema claro/oscuro, responsive (barra inferior en móvil, riel en tablet), validación en vivo, toasts, diálogos accesibles.

## 9. Seguridad aplicada
- Contraseñas con **bcrypt**; sesiones en servidor (cookie `httpOnly`, `SameSite=Lax`, `Secure` en producción), token guardado como hash SHA-256; logout y cambio de contraseña invalidan sesiones.
- Bloqueo temporal tras 5 intentos fallidos + límite de peticiones en rutas de autenticación; respuestas que no revelan si un correo existe.
- Validación con **zod** en el backend y validación equivalente en el frontend.
- Todas las consultas filtran por `user_id` (cada usuario solo ve lo suyo); consultas parametrizadas.
- CSRF: cabecera personalizada + comprobación de `Origin`. CSP estricta y demás cabeceras con **helmet**; librerías y fuentes servidas localmente (sin CDN). Todo texto dinámico se escapa en el frontend (anti-XSS). CSV protegido contra inyección de fórmulas.
- Errores sin filtrar detalles internos; `.env` fuera de Git; `.env.example` sin credenciales.

## 10. Estructura
```
server/  config · db (migraciones) · models · services · controllers · routes · middleware · validators · scripts
public/  login/register/forgot/reset/app.html · css/ · js/ (api, ui, utils, store, forms, charts, pages/*)
tests/   pruebas automáticas
legacy/  prototipo original (FINPRO.original.html)
```

## 11. Despliegue (notas)
Render: conecta el repositorio usando el blueprint `render.yaml` (build `npm ci`, start `npm start`, comprobación `/api/health`, despliegue automático desactivado). Completa `SUPABASE_URL` y `SUPABASE_ANON_KEY`; `APP_URL` usa automáticamente `RENDER_EXTERNAL_URL` y se puede definir manualmente si se configura un dominio propio. Agrega el dominio HTTPS de Render a las URL de redirección de Supabase Auth, incluyendo `/reset.html`. Habilita el despliegue manual cuando hayan terminado las pruebas autenticadas. SQLite no es persistente entre despliegues de Render y no debe usarse como base de producción.
