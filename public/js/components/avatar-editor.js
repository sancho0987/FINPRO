import { api } from '../api.js';
import { html, raw, $ } from '../utils.js';
import { avatarMarkup, avatarAccessoryMarkup, AVATAR_OPTIONS, AVATAR_PRESETS, DEFAULT_AVATAR, normalizeAvatar } from './avatar.js';
import { AVATAR_PICKER_PRESETS, AVATAR_ACCESSORIES, AVATAR_ACCESSORY_CATALOG, accessoryConflicts, canEditAppearance, canUseAccessory } from './avatar-catalog.js';
import { openModal, modalHead, toast, setLoading } from '../ui.js';
import { app, notifyChange } from '../store.js';

const APPEARANCE_FIELDS = {
  appearance: 'Apariencia', faceShape: 'Forma del rostro', skin: 'Tono de piel', hairStyle: 'Peinado',
  hairColor: 'Color de cabello', eyes: 'Ojos', eyeColor: 'Color de ojos', brows: 'Cejas',
  mouth: 'Expresión', clothing: 'Ropa', clothingColor: 'Color de ropa',
};

function characterCard(preset, selected) {
  return html`<button type="button" class="avatar-person-card ${selected ? 'is-selected' : ''}" data-avatar-preset="${preset.id}" aria-pressed="${selected}" aria-label="Elegir a ${preset.name}">
    <span class="avatar-person-art">${avatarMarkup(preset.avatar, { size: 86, label: preset.name })}</span>
    <span class="avatar-person-name">${preset.name}</span>
    ${selected ? html`<span class="avatar-person-check" aria-hidden="true">✓</span>` : ''}
  </button>`;
}

function accessoryCard(item, draft) {
  const selected = draft.accessories.includes(item.id);
  const conflicts = accessoryConflicts(item.id, draft.accessories);
  return html`<button type="button" class="avatar-piece-card ${selected ? 'is-selected' : ''}" data-avatar-accessory="${item.id}" aria-pressed="${selected}" aria-label="${item.name}">
    <span class="avatar-piece-art" aria-hidden="true">${raw(avatarAccessoryMarkup(item.id))}</span>
    <span class="avatar-piece-name">${item.name}</span>
    <span class="avatar-piece-state">${selected ? 'Quitar' : conflicts.length ? 'Sustituir' : 'Añadir'}</span>
  </button>`;
}

function appearanceControls(draft) {
  const custom = draft.style === 'custom';
  return html`<div class="avatar-appearance">
    <div class="field"><label for="avatar-style">Estilo del retrato</label>
      <select class="input" id="avatar-style">
        <option value="illustrated" ${custom ? '' : 'selected'}>Ilustración original</option>
        <option value="custom" ${custom ? 'selected' : ''}>Ilustración editable</option>
      </select>
    </div>
    ${custom ? Object.entries(APPEARANCE_FIELDS).map(([key, name]) => html`<div class="field">
      <label for="avatar-field-${key}">${name}</label>
      <select class="input" id="avatar-field-${key}" data-avatar-field="${key}">
        ${AVATAR_OPTIONS[key].map(([value, option]) => html`<option value="${value}" ${draft[key] === value ? 'selected' : ''}>${option}</option>`)}
      </select>
    </div>`) : html`<p>Elige la ilustración editable para cambiar el rostro, el cabello y la ropa.</p>`}
  </div>`;
}

export function openAvatarEditor({ avatar, label, background, save }) {
  let draft = normalizeAvatar(avatar);
  let mode = 'characters';
  let saving = false;
  const currentPreset = AVATAR_PRESETS.find(({ id }) => id === draft.character);
  const presets = AVATAR_PICKER_PRESETS.some(({ id }) => id === draft.character)
    ? AVATAR_PICKER_PRESETS : [...AVATAR_PICKER_PRESETS, currentPreset];
  const preview = () => avatarMarkup(draft, { size: 264, label: `Vista previa de ${label}`, background });

  const modal = openModal(html`${modalHead('Personaliza tu avatar')}
    <div class="avatar-studio">
      <section class="avatar-studio-stage" aria-label="Vista previa del avatar">
        <div class="avatar-stage-orbit" aria-hidden="true"></div>
        <div id="avatar-preview">${preview()}</div>
        <div class="avatar-stage-caption"><span class="avatar-stage-eyebrow">TU PERSONAJE</span><strong id="avatar-current-name"></strong><span class="avatar-for">Para ${label}</span></div>
        <div id="avatar-selected-accessories" class="avatar-selected-accessories" aria-label="Accesorios seleccionados"></div>
      </section>
      <section class="avatar-studio-workspace" aria-label="Opciones de personalización">
        <header class="avatar-studio-heading"><h2 id="avatar-step-title">Elige tu personaje</h2></header>
        <div class="avatar-studio-tabs" role="group" aria-label="Opciones de personalización">
          <button type="button" class="avatar-studio-tab is-active" data-avatar-mode="characters" aria-pressed="true" aria-controls="avatar-catalog"><span>Personaje</span></button>
          <button type="button" class="avatar-studio-tab" data-avatar-mode="appearance" aria-pressed="false" aria-controls="avatar-catalog"><span>Apariencia</span></button>
          <button type="button" class="avatar-studio-tab" data-avatar-mode="accessories" aria-pressed="false" aria-controls="avatar-catalog"><span>Accesorios</span><small id="avatar-piece-count">0</small></button>
        </div>
        <div id="avatar-catalog" class="avatar-studio-catalog" role="region" aria-labelledby="avatar-step-title"></div>
      </section>
    </div>
    <div class="avatar-editor-footer"><button class="avatar-reset-link" type="button" id="avatar-reset">Restablecer avatar</button>
      <div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancelar</button><button class="btn btn-primary" id="avatar-save" type="button">Guardar avatar</button></div></div>`, { label: 'Personalizar avatar', canClose: () => !saving });
  modal.el.classList.add('avatar-modal');

  const renderPreview = () => {
    $('#avatar-preview', modal.el).innerHTML = preview().toString();
    $('#avatar-current-name', modal.el).textContent = AVATAR_PRESETS.find(({ id }) => id === draft.character)?.name || 'Avatar personalizado';
    $('#avatar-piece-count', modal.el).textContent = String(draft.accessories.length);
    $('#avatar-selected-accessories', modal.el).innerHTML = draft.accessories.map((id) => {
      const item = AVATAR_ACCESSORIES.find(({ id: itemId }) => itemId === id);
      return item ? html`<button type="button" class="avatar-piece-chip" data-remove-accessory="${id}" aria-label="Quitar ${item.name}">${item.name}<span aria-hidden="true">×</span></button>` : '';
    }).join('');
  };

  const renderCatalog = (focusSelector) => {
    const catalog = $('#avatar-catalog', modal.el);
    catalog.dataset.mode = mode;
    if (mode === 'characters') {
      catalog.innerHTML = presets.map((preset) => characterCard(preset, preset.id === draft.character)).join('');
    } else if (mode === 'appearance') {
      catalog.innerHTML = appearanceControls(draft).toString();
    } else {
      const available = AVATAR_ACCESSORY_CATALOG.filter((item) => canUseAccessory(item, draft) || draft.accessories.includes(item.id));
      catalog.innerHTML = available.map((item) => accessoryCard(item, draft)).join('')
        || '<p class="avatar-catalog-empty">Este retrato no tiene accesorios adicionales.</p>';
    }
    $('#avatar-step-title', modal.el).textContent = { characters: 'Elige tu personaje', appearance: 'Edita tu apariencia', accessories: 'Añade accesorios' }[mode];
    modal.el.querySelectorAll('[data-avatar-mode]').forEach((button) => {
      const active = button.dataset.avatarMode === mode;
      button.hidden = button.dataset.avatarMode === 'appearance' && !canEditAppearance(draft.character);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (focusSelector) $(focusSelector, modal.el)?.focus({ preventScroll: true });
  };

  renderPreview();
  renderCatalog();
  modal.el.addEventListener('change', ({ target }) => {
    if (saving || mode !== 'appearance') return;
    if (target.id === 'avatar-style') {
      const next = normalizeAvatar({ ...draft, style: target.value });
      const incompatible = AVATAR_ACCESSORY_CATALOG.filter((item) => draft.accessories.includes(item.id) && !canUseAccessory(item, next));
      draft = normalizeAvatar({ ...next, accessories: next.accessories.filter((id) => !incompatible.some((item) => item.id === id)) });
      if (incompatible.length) toast('Se quitaron los accesorios que no encajan con este estilo.');
      renderPreview();
      renderCatalog('#avatar-style');
    } else if (Object.hasOwn(APPEARANCE_FIELDS, target.dataset.avatarField)) {
      draft = normalizeAvatar({ ...draft, [target.dataset.avatarField]: target.value });
      renderPreview();
    }
  });
  modal.el.addEventListener('click', async (event) => {
    if (saving) return;
    const modeButton = event.target.closest('[data-avatar-mode]');
    if (modeButton && !modeButton.hidden) { mode = modeButton.dataset.avatarMode; renderCatalog(); return; }
    const presetButton = event.target.closest('[data-avatar-preset]');
    if (presetButton) {
      const preset = presets.find(({ id }) => id === presetButton.dataset.avatarPreset);
      if (preset && preset.id !== draft.character) {
        const next = normalizeAvatar(preset.avatar);
        const accessories = AVATAR_ACCESSORIES.filter((item) => draft.accessories.includes(item.id) && canUseAccessory(item, next)).map(({ id }) => id);
        draft = normalizeAvatar({ ...next, accessories });
        renderPreview();
        renderCatalog(`[data-avatar-preset="${preset.id}"]`);
      }
      return;
    }
    const accessoryButton = event.target.closest('[data-avatar-accessory]');
    if (accessoryButton) {
      const id = accessoryButton.dataset.avatarAccessory;
      const item = AVATAR_ACCESSORY_CATALOG.find((entry) => entry.id === id);
      if (draft.accessories.includes(id)) draft = normalizeAvatar({ ...draft, accessories: draft.accessories.filter((item) => item !== id), accessory: 'none' });
      else if (item && canUseAccessory(item, draft)) {
        const conflicts = accessoryConflicts(id, draft.accessories);
        const accessories = draft.accessories.filter((value) => !conflicts.some(({ id: conflictId }) => value === conflictId));
        if (accessories.length >= 12) {
          toast('Puedes usar hasta 12 accesorios. Quita uno para añadir otro.', 'error');
          return;
        }
        draft = normalizeAvatar({ ...draft, accessories: [...accessories, id] });
        if (conflicts.length) toast(`Se reemplazó: ${conflicts.map(({ name }) => name).join(', ')}.`);
      }
      renderPreview(); renderCatalog(`[data-avatar-accessory="${id}"]`); return;
    }
    const removeButton = event.target.closest('[data-remove-accessory]');
    if (removeButton) {
      draft = normalizeAvatar({ ...draft, accessories: draft.accessories.filter((id) => id !== removeButton.dataset.removeAccessory), accessory: 'none' });
      renderPreview(); renderCatalog();
      const next = $('[data-remove-accessory]', modal.el) || $('[data-avatar-mode][aria-pressed="true"]', modal.el);
      next.focus({ preventScroll: true });
      return;
    }
    if (event.target.closest('#avatar-reset')) {
      draft = normalizeAvatar(DEFAULT_AVATAR);
      mode = 'characters'; renderPreview(); renderCatalog(); return;
    }
    const button = event.target.closest('#avatar-save');
    if (!button) return;
    const studio = $('.avatar-studio', modal.el);
    saving = true;
    studio.inert = true;
    modal.el.querySelectorAll('[data-close], #avatar-reset').forEach((control) => { control.disabled = true; });
    setLoading(button, true, 'Guardando…');
    try {
      const result = await save(draft);
      if (result?.user) app.user = result.user;
      if (result?.member) app.members = app.members.map((member) => member.id === result.member.id ? result.member : member);
      saving = false;
      toast('Avatar guardado'); modal.close(); notifyChange(true);
    } catch (error) {
      toast(error.message || 'No se pudo guardar el avatar. Revisa tu conexión e inténtalo de nuevo.', 'error');
      saving = false;
      studio.inert = false;
      modal.el.querySelectorAll('[data-close], #avatar-reset').forEach((control) => { control.disabled = false; });
      setLoading(button, false);
      button.focus();
    }
  });
  return modal;
}

export const editMemberAvatar = (member) => openAvatarEditor({
  avatar: member.avatar, label: member.name, background: member.color, save: (avatar) => api.patch(`/api/members/${member.id}/avatar`, avatar),
});
export const editProfileAvatar = () => openAvatarEditor({
  avatar: app.user.avatar, label: app.user.name, save: (avatar) => api.patch('/api/auth/me/avatar', avatar),
});
