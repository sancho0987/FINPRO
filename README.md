# FINPRO — Control de gastos del hogar

Aplicación web para gestionar las finanzas personales y familiares: presupuesto por categoría, movimientos (gastos e ingresos), miembros de la familia, gastos hormiga, reportes y panel de administración.

**Stack:** Node.js + Express · SQLite (módulo `node:sqlite` incluido en Node, sin compilar nada) · Frontend en HTML/CSS/JavaScript (módulos ES, sin framework) · Chart.js. Se conservó la tecnología del prototipo original (JS vanilla + Chart.js); el prototipo original se guarda en `legacy/FINPRO.original.html`.

## 1. Requisitos
- **Node.js 22.13 o superior** (`node -v`; recomendado la versión LTS actual) y npm.
- No necesitas instalar ningún motor de base de datos ni herramientas de compilación: usa SQLite incluido en Node (un archivo). Node 22 puede mostrar un aviso «SQLite is an experimental feature»; es normal e inofensivo.

## 2. Instalación
```bash
cd FINPRO
npm install
cp .env.example .env        # en Windows: copy .env.example .env
```
Edita `.env` si quieres cambiar el puerto, la URL pública o configurar el correo (ver sección 6). Para probar en tu computador los valores por defecto sirven tal cual.

## 3. Base de datos
No hay que crearla a mano: al iniciar el servidor se crea el archivo `data/finpro.db` y se aplican las migraciones (`server/db/migrations/*.sql`) automáticamente. Para ejecutarlas por separado:
```bash
npm run migrate
```
**Tablas:** `users`, `sessions`, `password_resets`, `settings` (1–1 con usuario), `categories`, `members`, `transactions` (relacionadas con `users` por `user_id`, con borrado en cascada). Los montos se guardan en centavos (enteros).

## 4. Crear el primer administrador
Por seguridad nadie se vuelve administrador desde el registro público. Crea el primero por consola:
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
Abre **http://localhost:3000** — el backend sirve también el frontend, no hay que iniciar nada más.
Flujo: *Crear cuenta* → entras al resumen → registra movimientos (o pulsa «Cargar datos de ejemplo»).

## 6. Recuperación de contraseña y correo (servicio externo)
El enlace de recuperación se envía por correo. Sin SMTP configurado, **el enlace se imprime en la consola del servidor** (útil en desarrollo). Para producción configura en `.env` un servicio SMTP (Gmail con *contraseña de aplicación*, Brevo, Mailgun, etc.):
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
Define `NODE_ENV=production`, `APP_URL` con tu dominio HTTPS, `TRUST_PROXY=1` si hay proxy inverso, SMTP real, y respalda periódicamente `data/finpro.db`. Para varios servidores o mucho tráfico, migra a PostgreSQL/MySQL (la capa `models/` concentra todo el SQL).
