'use strict';
const nodemailer = require('nodemailer');
const config = require('../config');

let transport = null;
const getTransport = () => {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  }
  return transport;
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Guarda los correos "enviados" en memoria durante las pruebas
const outbox = [];

async function sendPasswordReset(user, link) {
  const subject = 'Recupera tu contraseña de FINPRO';
  const text =
    `Hola ${user.name},\n\nRecibimos una solicitud para restablecer tu contraseña de FINPRO.\n` +
    `Usa este enlace (válido por ${config.resetTokenMinutes} minutos):\n\n${link}\n\n` +
    'Si no fuiste tú, ignora este mensaje: tu contraseña no cambiará.\n';
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1a1e2a">
    <h2 style="color:#0f9f78">FINPRO</h2>
    <p>Hola ${esc(user.name)},</p>
    <p>Recibimos una solicitud para restablecer tu contraseña. El enlace es válido por ${config.resetTokenMinutes} minutos.</p>
    <p><a href="${esc(link)}" style="display:inline-block;background:#0f9f78;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Restablecer contraseña</a></p>
    <p style="font-size:12px;color:#667">Si el botón no funciona, copia este enlace en tu navegador:<br>${esc(link)}</p>
    <p style="font-size:12px;color:#667">Si no fuiste tú, ignora este mensaje.</p></div>`;

  if (config.isTest) {
    outbox.push({ to: user.email, subject, text, link });
    return;
  }
  if (!config.smtp.enabled) {
    console.log('\n[correo:desarrollo] SMTP no configurado. Enlace de recuperación para %s:\n  %s\n', user.email, link);
    return;
  }
  await getTransport().sendMail({ from: config.smtp.from, to: user.email, subject, text, html });
}

module.exports = { sendPasswordReset, outbox };
