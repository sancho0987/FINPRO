import { api } from '../api.js';
import { html, raw, setHtml, $, fmtDate } from '../utils.js';
import { app, notifyChange } from '../store.js';
import { toast, setLoading, showFieldErrors, clearFieldErrors, setFormError, runRules, validators as v, passwordDialog, confirmDialog, passwordToggle, liveValidate } from '../ui.js';
import { icon } from '../icons.js';
import { avatarMarkup } from '../components/avatar.js';
import { editProfileAvatar } from '../components/avatar-editor.js';

export async function render({ root }) {
  const u = app.user;
  setHtml(root, html`
    <div class="page-head"><div><h1>Mi perfil</h1><p>Datos de tu cuenta y seguridad</p></div></div>
    <div class="grid-2">
      <section class="panel"><div class="panel-head"><h2>Datos personales</h2><span class="pill ${u.role === 'admin' ? 'info' : ''}">${u.role === 'admin' ? 'Administrador' : 'Usuario'}</span></div>
        <div class="profile-avatar-row">${avatarMarkup(u.avatar, { size: 68, label: `Tu avatar, ${u.name}` })}<div class="profile-avatar-actions"><button class="btn btn-ghost btn-sm" type="button" id="edit-profile-avatar">✦ Personalizar avatar</button>
          <div class="muted" style="font-size:13px">Cuenta creada el ${fmtDate(u.createdAt.slice(0, 10), { day: 'numeric', month: 'long', year: 'numeric' })}</div></div></div>
        <form id="profile-form" novalidate><div class="form-error" hidden role="alert"></div>
          <div class="field"><label for="p-name">Nombre</label><input class="input" id="p-name" name="name" maxlength="80" value="${u.name}" required><span class="error"></span></div>
          <div class="field"><label for="p-email">Correo electrónico</label><input class="input" id="p-email" name="email" type="email" value="${u.email}" required><span class="error"></span></div>
          <button class="btn btn-primary" type="submit">Guardar cambios</button></form></section>
      <section class="panel"><div class="panel-head"><h2>Cambiar contraseña</h2></div>
        <form id="pw-form-p" novalidate><div class="form-error" hidden role="alert"></div>
          <div class="field"><label for="pw-cur">Contraseña actual</label><div class="input-wrap"><input class="input" id="pw-cur" name="currentPassword" type="password" autocomplete="current-password"><button class="btn btn-icon toggle" type="button" data-toggle-password aria-label="Mostrar contraseña">${raw(icon('eye'))}</button></div><span class="error"></span></div>
          <div class="field"><label for="pw-new">Nueva contraseña</label><div class="input-wrap"><input class="input" id="pw-new" name="newPassword" type="password" autocomplete="new-password"><button class="btn btn-icon toggle" type="button" data-toggle-password aria-label="Mostrar contraseña">${raw(icon('eye'))}</button></div><span class="hint">Mínimo 8 caracteres, con letras y números.</span><span class="error"></span></div>
          <div class="field"><label for="pw-rep">Repetir nueva contraseña</label><input class="input" id="pw-rep" name="repeat" type="password" autocomplete="new-password"><span class="error"></span></div>
          <button class="btn btn-primary" type="submit">Actualizar contraseña</button></form></section>
    </div>
    <section class="panel mb"><div class="panel-head"><h2>Sesiones</h2></div>
      <div class="action-row"><div><b>Cerrar sesión en otros dispositivos</b><span>Termina todas las sesiones abiertas excepto esta.</span></div><button class="btn btn-ghost btn-sm" type="button" id="others">Cerrar otras sesiones</button></div></section>
    <section class="panel danger-zone"><div class="panel-head"><h2>Zona de peligro</h2></div>
      <div class="action-row"><div><b>Eliminar mi cuenta</b><span>Borra tu cuenta y todos tus datos de forma permanente.</span></div><button class="btn btn-danger" type="button" id="del-acc">Eliminar cuenta</button></div></section>`);

  passwordToggle(root);
  $('#edit-profile-avatar', root).addEventListener('click', editProfileAvatar);
  const pf = $('#profile-form', root);
  const pr = { name: (x) => (x.trim().length < 2 ? 'Escribe tu nombre (mínimo 2 letras).' : ''), email: v.email };
  liveValidate(pf, pr);
  pf.addEventListener('submit', async (e) => {
    e.preventDefault(); clearFieldErrors(pf); setFormError(pf, '');
    const errs = runRules(pf, pr); if (Object.keys(errs).length) return void showFieldErrors(pf, errs);
    const btn = $('button[type=submit]', pf); setLoading(btn, true);
    try { await api.patch('/api/auth/me', { name: pf.elements.name.value.trim(), email: pf.elements.email.value.trim() }); toast('Perfil actualizado'); notifyChange(true); }
    catch (ex) { setLoading(btn, false); if (!(ex.fields && showFieldErrors(pf, ex.fields))) setFormError(pf, ex.message); }
  });

  const wf = $('#pw-form-p', root);
  const wr = { currentPassword: v.required('La contraseña actual'), newPassword: v.password, repeat: (x, f) => (x !== f.elements.newPassword.value ? 'Las contraseñas no coinciden.' : '') };
  liveValidate(wf, wr);
  wf.addEventListener('submit', async (e) => {
    e.preventDefault(); clearFieldErrors(wf); setFormError(wf, '');
    const errs = runRules(wf, wr); if (Object.keys(errs).length) return void showFieldErrors(wf, errs);
    const btn = $('button[type=submit]', wf); setLoading(btn, true);
    try { await api.post('/api/auth/change-password', { currentPassword: wf.elements.currentPassword.value, newPassword: wf.elements.newPassword.value }); toast('Contraseña actualizada'); wf.reset(); setLoading(btn, false); }
    catch (ex) { setLoading(btn, false); if (!(ex.fields && showFieldErrors(wf, ex.fields))) setFormError(wf, ex.message); }
  });

  $('#others', root).addEventListener('click', async () => {
    if (!(await confirmDialog({ title: 'Cerrar otras sesiones', message: 'Se cerrará tu sesión en todos los demás dispositivos.', confirmText: 'Cerrar sesiones' }))) return;
    try { await api.post('/api/auth/logout-others'); toast('Se cerraron las otras sesiones'); } catch (ex) { toast(ex.message, 'error'); }
  });
  $('#del-acc', root).addEventListener('click', () => passwordDialog({ title: 'Eliminar cuenta', message: 'Se borrarán tu cuenta y todos tus datos para siempre. Confirma con tu contraseña.', confirmText: 'Eliminar mi cuenta',
    action: async (password) => { await api.del('/api/auth/me', { password }, { silent401: true }); location.href = '/login.html'; } }));
}
