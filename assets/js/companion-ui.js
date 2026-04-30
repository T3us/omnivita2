(function () {
  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getInitials(name) {
    return String(name || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '?';
  }

  function avatarMarkup(image, name, options = {}) {
    const wrapperClass = options.wrapperClass || 'avatar-shell small-avatar';
    const squareClass = options.square ? ' avatar-square' : '';

    if (image) {
      return `<div class="${wrapperClass}"><img src="${image}" alt="${escapeHtml(name || 'avatar')}" class="avatar-image${squareClass}"></div>`;
    }

    return `<div class="${wrapperClass}"><span class="avatar-fallback${squareClass}">${escapeHtml(getInitials(name))}</span></div>`;
  }

  function setAvatar(element, image, name, options = {}) {
    if (!element) return;

    const squareClass = options.square ? ' avatar-square' : '';
    if (image) {
      element.innerHTML = `<img src="${image}" alt="${escapeHtml(name || 'avatar')}" class="avatar-image${squareClass}">`;
      return;
    }

    element.innerHTML = `<span class="avatar-fallback${squareClass}">${escapeHtml(getInitials(name))}</span>`;
  }

  function openDialog(dialog) {
    if (!dialog) return;

    if (typeof dialog.showModal === 'function' && !dialog.open) {
      dialog.showModal();
      return;
    }

    dialog.setAttribute('open', 'open');
  }

  function closeDialog(dialog) {
    if (!dialog) return;

    if (dialog.open && typeof dialog.close === 'function') {
      dialog.close();
      return;
    }

    dialog.removeAttribute('open');
  }

  function ensureCompanionAttributes(entry) {
    entry.attributes = entry.attributes || {};
    entry.attributes.forca = Number(entry.attributes.forca || 0);
    entry.attributes.destreza = Number(entry.attributes.destreza || 0);
    entry.attributes.sentidos = Number(entry.attributes.sentidos || 0);
    entry.attributes.vigor = Number(entry.attributes.vigor || 0);
    entry.attributes.inteligencia = Number(entry.attributes.inteligencia || 0);
    entry.attributes.nexo = Number(entry.attributes.nexo || 0);
    return entry;
  }

  function populateCompanionFields(fieldRefs, entry) {
    if (!entry || !fieldRefs) return;
    ensureCompanionAttributes(entry);

    if (fieldRefs.nameInput) fieldRefs.nameInput.value = entry.name || '';
    if (fieldRefs.typeInput) fieldRefs.typeInput.value = entry.type || '';
    if (fieldRefs.statusInput) fieldRefs.statusInput.value = entry.status || '';
    if (fieldRefs.pvCurrentInput) fieldRefs.pvCurrentInput.value = Number(entry.pvCurrent || 0);
    if (fieldRefs.pvMaxInput) fieldRefs.pvMaxInput.value = Number(entry.pvMax || 0);
    if (fieldRefs.armorInput) fieldRefs.armorInput.value = Number(entry.armor || 0);
    if (fieldRefs.attrForcaInput) fieldRefs.attrForcaInput.value = Number(entry.attributes.forca || 0);
    if (fieldRefs.attrDestrezaInput) fieldRefs.attrDestrezaInput.value = Number(entry.attributes.destreza || 0);
    if (fieldRefs.attrSentidosInput) fieldRefs.attrSentidosInput.value = Number(entry.attributes.sentidos || 0);
    if (fieldRefs.attrVigorInput) fieldRefs.attrVigorInput.value = Number(entry.attributes.vigor || 0);
    if (fieldRefs.attrInteligenciaInput) fieldRefs.attrInteligenciaInput.value = Number(entry.attributes.inteligencia || 0);
    if (fieldRefs.attrNexoInput) fieldRefs.attrNexoInput.value = Number(entry.attributes.nexo || 0);
    if (fieldRefs.notesInput) fieldRefs.notesInput.value = entry.notes || '';
  }

  function applyCompanionFields(fieldRefs, entry) {
    if (!entry || !fieldRefs) return entry;
    ensureCompanionAttributes(entry);

    if (fieldRefs.nameInput) entry.name = fieldRefs.nameInput.value.trim();
    if (fieldRefs.typeInput) entry.type = fieldRefs.typeInput.value.trim();
    if (fieldRefs.statusInput) entry.status = fieldRefs.statusInput.value.trim();

    const pvMax = Math.max(0, Number(fieldRefs.pvMaxInput ? fieldRefs.pvMaxInput.value : entry.pvMax || 0));
    const pvCurrent = Math.max(0, Number(fieldRefs.pvCurrentInput ? fieldRefs.pvCurrentInput.value : entry.pvCurrent || 0));

    entry.pvMax = pvMax;
    entry.pvCurrent = Math.min(pvMax, pvCurrent);
    entry.armor = Math.max(0, Number(fieldRefs.armorInput ? fieldRefs.armorInput.value : entry.armor || 0));
    entry.attributes.forca = Math.max(0, Number(fieldRefs.attrForcaInput ? fieldRefs.attrForcaInput.value : entry.attributes.forca || 0));
    entry.attributes.destreza = Math.max(0, Number(fieldRefs.attrDestrezaInput ? fieldRefs.attrDestrezaInput.value : entry.attributes.destreza || 0));
    entry.attributes.sentidos = Math.max(0, Number(fieldRefs.attrSentidosInput ? fieldRefs.attrSentidosInput.value : entry.attributes.sentidos || 0));
    entry.attributes.vigor = Math.max(0, Number(fieldRefs.attrVigorInput ? fieldRefs.attrVigorInput.value : entry.attributes.vigor || 0));
    entry.attributes.inteligencia = Math.max(0, Number(fieldRefs.attrInteligenciaInput ? fieldRefs.attrInteligenciaInput.value : entry.attributes.inteligencia || 0));
    entry.attributes.nexo = Math.max(0, Number(fieldRefs.attrNexoInput ? fieldRefs.attrNexoInput.value : entry.attributes.nexo || 0));
    if (fieldRefs.notesInput) entry.notes = fieldRefs.notesInput.value;

    return entry;
  }

  function syncCompanionSticky(displayRefs, entry, options = {}) {
    if (!displayRefs) return;

    const titleText = options.titleText || options.titlePrefix || 'Mini-ficha';
    const squareAvatar = options.squareAvatar !== false;
    const name = entry && entry.name ? entry.name : (options.emptyName || 'Sem nome');
    const type = entry && entry.type ? entry.type : (options.emptyType || 'Sem tipo');
    const status = entry && entry.status ? entry.status : (options.emptyStatus || 'Sem status');

    if (displayRefs.titleElement) {
      displayRefs.titleElement.textContent = entry && entry.name
        ? `${titleText} - ${entry.name}`
        : titleText;
    }
    if (displayRefs.stickyNameElement) displayRefs.stickyNameElement.textContent = name;
    if (displayRefs.stickyTypeElement) displayRefs.stickyTypeElement.textContent = type;
    if (displayRefs.stickyStatusElement) displayRefs.stickyStatusElement.textContent = status;
    if (displayRefs.avatarElement) setAvatar(displayRefs.avatarElement, entry && entry.image, entry && entry.name, { square: squareAvatar });
  }

  function formatSigned(value) {
    return Number(value || 0) >= 0 ? `+${Number(value || 0)}` : String(Number(value || 0));
  }

  function getAttributeSelectOptions(selectedKey) {
    return window.AppSystem.ATTRIBUTES
      .map((attribute) => `<option value="${attribute.key}" ${attribute.key === selectedKey ? 'selected' : ''}>${attribute.label}</option>`)
      .join('');
  }

  function refreshCompanionSkillRow(row, entry, skill) {
    if (!row || !entry || !skill) return;
    const signed = formatSigned(window.AppSystem.getCompanionSkillTotal(entry, skill));
    const small = row.querySelector('[data-role="skill-total"]');
    const large = row.querySelector('[data-role="skill-total-large"]');
    if (small) small.textContent = signed;
    if (large) large.textContent = signed;
  }

  function renderCompanionSkills(container, entry, options = {}) {
    if (!container) return;

    const skills = Array.isArray(entry && entry.skills) ? entry.skills : [];
    const emptyText = options.emptyText || 'Nenhuma pericia cadastrada.';

    if (!skills.length) {
      container.innerHTML = `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
      return;
    }

    if (options.mode === 'readonly') {
      const itemClass = options.itemClass || 'info-card skill-inline-card master-readonly-row';
      container.innerHTML = skills.map((skill, index) => `
        <article class="${itemClass}">
          <div class="minor-title-row">
            <strong>${escapeHtml(skill.name || `Pericia ${index + 1}`)}</strong>
            <span class="skill-total-badge">${formatSigned(window.AppSystem.getCompanionSkillTotal(entry, skill))}</span>
          </div>
          <p class="subtle">Valor ${Number(skill.value || 0)} • ${escapeHtml(skill.attribute || 'destreza')}</p>
        </article>
      `).join('');
      return;
    }

    container.innerHTML = skills.map((skill, index) => `
      <div class="info-card skill-inline-card companion-row-grid" data-companion-skill-index="${index}">
        <div class="skill-inline-head">
          <strong>Pericia ${index + 1}</strong>
          <div class="inline-actions">
            <span class="skill-total-badge" data-role="skill-total">${formatSigned(window.AppSystem.getCompanionSkillTotal(entry, skill))}</span>
            <button type="button" class="danger-button small-button" data-action="${options.removeAction || 'remove-companion-skill'}" aria-label="Remover pericia ${index + 1}">Remover</button>
          </div>
        </div>
        <label>
          Nome
          <input type="text" data-field="name" value="${escapeHtml(skill.name || '')}" />
        </label>
        <label>
          Valor
          <input type="number" min="0" max="99" data-field="value" value="${Number(skill.value || 0)}" />
        </label>
        <label>
          Atributo
          <select data-field="attribute">${getAttributeSelectOptions(skill.attribute || 'destreza')}</select>
        </label>
        <div class="skill-result-card">
          <span>Total</span>
          <strong data-role="skill-total-large">${formatSigned(window.AppSystem.getCompanionSkillTotal(entry, skill))}</strong>
        </div>
      </div>
    `).join('');
  }

  function renderCompanionFacets(container, entry, options = {}) {
    if (!container) return;

    const facets = Array.isArray(entry && entry.facets) ? entry.facets : [];
    const emptyText = options.emptyText || 'Nenhuma faceta cadastrada.';

    if (!facets.length) {
      container.innerHTML = `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
      return;
    }

    if (options.mode === 'readonly') {
      const itemClass = options.itemClass || 'info-card master-readonly-row';
      container.innerHTML = facets.map((facet, index) => `
        <article class="${itemClass}">
          <div class="minor-title-row">
            <strong>${escapeHtml(facet.name || `Faceta ${index + 1}`)}</strong>
            <span class="stat-tag">Rank ${Number(facet.rank || 1)}</span>
          </div>
          <p class="subtle">XP ${Number(facet.xp || 0)}</p>
        </article>
      `).join('');
      return;
    }

    container.innerHTML = facets.map((facet, index) => `
      <div class="list-card-grid companion-facet-grid" data-companion-facet-index="${index}">
        <label>
          Faceta ${index + 1}
          <input type="text" data-field="name" value="${escapeHtml(facet.name || '')}" />
        </label>
        <label>
          Rank
          <input type="number" min="1" max="10" data-field="rank" value="${Number(facet.rank || 1)}" />
        </label>
        <label>
          XP
          <input type="number" min="0" max="999" data-field="xp" value="${Number(facet.xp || 0)}" />
        </label>
        <div class="card-actions-row compact-actions">
          <button type="button" class="danger-button small-button" data-action="${options.removeAction || 'remove-companion-facet'}" aria-label="Remover faceta ${index + 1}">Remover</button>
        </div>
      </div>
    `).join('');
  }

  window.AppCompanionUi = {
    avatarMarkup,
    setAvatar,
    openDialog,
    closeDialog,
    populateCompanionFields,
    applyCompanionFields,
    syncCompanionSticky,
    formatSigned,
    getAttributeSelectOptions,
    refreshCompanionSkillRow,
    renderCompanionSkills,
    renderCompanionFacets
  };
})();
