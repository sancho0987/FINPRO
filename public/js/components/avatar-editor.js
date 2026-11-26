import { api } from '../api.js';
import { html, raw, $, $$ } from '../utils.js';
import { avatarMarkup, AVATAR_OPTIONS, DEFAULT_AVATAR, normalizeAvatar } from './avatar.js';
import { openModal, modalHead, toast, setLoading } from '../ui.js';
import { app, notifyChange } from '../store.js';

const SECTIONS = [
  ['appearance', 'Apariencia'], ['skin', 'Tono de piel'], ['hairStyle', 'Cabello'], ['hairColor', 'Color de cabello'],
  ['eyes', 'Ojos'], ['brows', 'Cejas'], ['mouth', 'Boca'], ['accessory', 'Accesorios'], ['clothing', 'Ropa'], ['clothingColor', 'Color de ropa'],
];

function choiceMarkup(key, value, label, selected) {
  const isColor = key.endsWith('Color');
  const sample = isColor ? html`<span class="avatar-color-dot" style="--swatch:${value}"></span>`
    : key === 'appearance' ? avatarMarkup({ ...DEFAULT_AVATAR, appearance: value }, { size: 38, label })
      : key === 'skin' ? html`<span class="avatar-skin-dot" style="--skin:${({ light: '#f7d9c3', fair: '#edc1a2', medium: '#d99c73', tan: '#b87852', brown: '#8f563d', deep: '#603b30' })[value]}"></span>`
        : key === 'hairStyle' ? html`<span class="avatar-option-icon">${({ short: '✂️', long: '〰️', curly: '〽️', coily: '❋', bob: '◡', buzz: '⌒', bald: '◯' })[value]}</span>`
          : key === 'accessory' ? html`<span class="avatar-option-icon">${({ none: '◌', glasses: '👓', 'round-glasses': '🕶️', cap: '🧢', beanie: '🎩' })[value]}</span>`
            : key === 'clothing' ? html`<span class="avatar-option-icon">${({ tee: '👕', shirt: '👔', hoodie: '🧥', sweater: '🧶' })[value]}</span>`
              : html`<span class="avatar-option-icon">${({ almond: '◉', round: '●', happy: '⌣', soft: '⌒', straight: '―', arched: '⌁', smile: '☺', neutral: '😐', open: '😮' })[value]}</span>`;
  return html`<button type="button" class="avatar-choice ${isColor ? 'is-color' : ''}" data-avatar-choice="${key}" data-value="${value}" aria-pressed="${selected ? 'true' : 'false'}">
    ${sample}<span>${label}</span></button>`;
}

export function openAvatarEditor({ avatar, label, save }) {
  let draft = normalizeAvatar(avatar);
  const renderPreview = () => {
    const preview = $('#avatar-preview', modal.el);
    if (preview) preview.innerHTML = avatarMarkup(draft, { size: 176, label: `Vista previa: ${label}` }).toString();
  };
  const sectionMarkup = SECTIONS.map(([key, title]) => html`<section class="avatar-section" aria-label="${title}"><h3>${title}</h3><div class="avatar-options" role="group" aria-label="${title}">
    ${AVATAR_OPTIONS[key].map(([value, optionLabel]) => choiceMarkup(key, value, optionLabel, draft[key] === value))}</div></section>`);
  const modal = openModal(html`${modalHead('Personalizar avatar')}
    <div class="avatar-editor"><div class="avatar-preview-panel"><div id="avatar-preview">${avatarMarkup(draft, { size: 176, label: `Vista previa: ${label}` })}</div><strong>${label}</strong><span>Tu personaje se actualiza al elegir cada opción</span></div>
      <div class="avatar-controls">${sectionMarkup}</div></div>
    <div class="avatar-editor-footer"><button class="btn btn-ghost" type="button" id="avatar-reset">Restaurar predeterminado</button>
      <div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancelar</button><button class="btn btn-primary" id="avatar-save" type="button">Guardar avatar</button></div></div>`, { label: 'Personalizar avatar' });
  modal.el.classList.add('avatar-modal');
  modal.el.addEventListener('click', async (event) => {
    const option = event.target.closest('[data-avatar-choice]');
    if (option) {
      draft = normalizeAvatar({ ...draft, [option.dataset.avatarChoice]: option.dataset.value });
      $$('.avatar-choice', modal.el).forEach((button) => {
        if (button.dataset.avatarChoice === option.dataset.avatarChoice) button.setAttribute('aria-pressed', String(button.dataset.value === option.dataset.value));
      });
      renderPreview();
      return;
    }
    if (event.target.closest('#avatar-reset')) {
      draft = normalizeAvatar(DEFAULT_AVATAR);
      $$('.avatar-choice', modal.el).forEach((button) => button.setAttribute('aria-pressed', String(draft[button.dataset.avatarChoice] === button.dataset.value)));
      renderPreview();
      return;
    }
    const button = event.target.closest('#avatar-save');
    if (!button) return;
    setLoading(button, true, 'Guardando…');
    try {
      const result = await save(draft);
      if (result?.user) app.user = result.user;
      if (result?.member) app.members = app.members.map((member) => member.id === result.member.id ? result.member : member);
      toast('Avatar guardado');
      modal.close();
      notifyChange(true);
    } catch (error) {
      toast(error.message || 'No se pudo guardar el avatar. Revisa tu conexión e inténtalo de nuevo.', 'error');
      setLoading(button, false);
    }
  });
  return modal;
}

export const editMemberAvatar = (member) => openAvatarEditor({
  avatar: member.avatar, label: member.name, save: (avatar) => api.patch(`/api/members/${member.id}/avatar`, avatar),
});
export const editProfileAvatar = () => openAvatarEditor({
  avatar: app.user.avatar, label: app.user.name, save: (avatar) => api.patch('/api/auth/me/avatar', avatar),
});

