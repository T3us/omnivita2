(function () {
  const forms = [
    {
      id: 'armoguana',
      name: 'Armoguana',
      image: 'assets/armoguana%20silhueta.png',
      bg: 'radial-gradient(circle at 42% 30%, #f5e9ff, transparent 12%), linear-gradient(135deg, #4fbfff, #8a31ff 58%, #08020d)'
    },
    {
      id: 'pelagornis',
      name: 'Pelagornis',
      image: 'assets/pelagornis%20silhueta.png',
      bg: 'radial-gradient(circle at 58% 36%, #fff5ff, transparent 12%), linear-gradient(135deg, #4768ff, #bc46ff 56%, #050108)'
    },
    {
      id: 'geck',
      name: 'Geck',
      image: 'assets/geck%20silhueta.png',
      bg: 'radial-gradient(circle at 48% 42%, #fff, transparent 11%), linear-gradient(135deg, #b85dff, #38105a 58%, #050108)'
    },
    {
      id: 'eciton',
      name: 'Eciton',
      image: 'assets/eciton%20silhueta.png',
      bg: 'radial-gradient(circle at 48% 32%, #ffdfff, transparent 11%), linear-gradient(135deg, #e64cff, #5b173a 56%, #080105)'
    },
    {
      id: 'sidarta',
      name: 'Sidarta',
      image: 'assets/sidarta%20silhueta.png',
      bg: 'radial-gradient(circle at 52% 40%, #ffffff, transparent 10%), linear-gradient(135deg, #f4d7ff, #8f37ff 52%, #0b0310)'
    },
    {
      id: 'cinetico',
      name: 'Cinetico',
      image: 'assets/cinetico%20silhueta.png',
      bg: 'radial-gradient(circle at 50% 36%, #ffffff, transparent 10%), linear-gradient(135deg, #754bff, #d348ff 52%, #090111)'
    },
    {
      id: 'desmodus',
      name: 'Desmodus',
      image: 'assets/desmodus%20silhueta.png',
      bg: 'radial-gradient(circle at 45% 42%, #ffdfff, transparent 11%), linear-gradient(135deg, #b13cff, #220936 58%, #040105)'
    },
    {
      id: 'landslide',
      name: 'Landslide',
      image: 'assets/landslide%20silhueta.png',
      bg: 'radial-gradient(circle at 52% 35%, #fff2ff, transparent 12%), linear-gradient(135deg, #6e33ff, #5f1c91 58%, #050108)'
    }
  ];

  const root = document.querySelector('[data-omnivita-app]');
  if (!root) return;

  const refs = {
    list: root.querySelector('[data-form-list]'),
    status: root.querySelector('[data-status-label]'),
    toggleButtons: root.querySelectorAll('[data-action="toggle"]')
  };

  let selectedIndex = 0;
  let activeFormId = '';
  let isOpen = false;
  let isDischarging = false;
  let isCooldown = false;

  function selectedForm() {
    return forms[selectedIndex] || forms[0];
  }

  function activeForm() {
    return forms.find((form) => form.id === activeFormId) || null;
  }

  function setBodyClass() {
    document.body.classList.toggle('state-closed', !isOpen && !activeFormId && !isDischarging && !isCooldown);
    document.body.classList.toggle('state-open', isOpen && !activeFormId && !isDischarging && !isCooldown);
    document.body.classList.toggle('state-transformed', Boolean(activeFormId) && !isDischarging && !isCooldown);
    document.body.classList.toggle('state-discharging', isDischarging);
    document.body.classList.toggle('state-cooldown', isCooldown);
  }

  function statusText() {
    if (isDischarging) return 'descarregando';
    if (isCooldown) return 'descarregado - clique para recarregar';
    if (activeFormId) return 'transformado - clique para descarregar';
    if (isOpen) return 'selecione uma silhueta';
    return 'OmniVita em espera';
  }

  function getOffset(index) {
    let offset = index - selectedIndex;
    const half = Math.floor(forms.length / 2);
    if (offset > half) offset -= forms.length;
    if (offset < -half) offset += forms.length;
    return offset;
  }

  function renderForms() {
    refs.list.innerHTML = forms.map((form, index) => {
      const offset = getOffset(index);
      const distance = Math.abs(offset);
      const hidden = distance > 2;

      return `
        <button
          type="button"
          class="alien-token${index === selectedIndex ? ' is-selected' : ''}${form.id === activeFormId ? ' is-active' : ''}${hidden ? ' is-hidden' : ''}"
          style="--offset: ${offset}; --distance: ${distance}; --alien-bg: ${form.bg};"
          data-form-index="${index}"
          aria-label="${form.name}"
          title="${form.name}"
          ${isCooldown || isDischarging ? 'disabled' : ''}
        >
          <span class="alien-photo" aria-hidden="true">
            <img src="${form.image}" alt="" draggable="false" />
          </span>
        </button>
      `;
    }).join('');
  }

  function render() {
    refs.status.textContent = statusText();
    refs.toggleButtons.forEach((button) => {
      button.setAttribute('aria-label', isOpen ? 'Fechar OmniVita' : 'Abrir OmniVita');
    });
    setBodyClass();
    renderForms();
  }

  function openDevice() {
    if (isCooldown || isDischarging) return;
    isOpen = true;
    render();
  }

  function closeDevice() {
    if (isDischarging) return;
    if (activeFormId || isCooldown) return;
    isOpen = false;
    render();
  }

  function toggleDevice() {
    if (isCooldown) {
      recharge();
      return;
    }
    if (activeFormId) {
      discharge();
      return;
    }
    if (isOpen) closeDevice();
    else openDevice();
  }

  function mainAction() {
    if (isDischarging) return;
    if (isCooldown) {
      recharge();
      return;
    }
    if (activeFormId) {
      discharge();
      return;
    }
    if (isOpen) {
      transform();
      return;
    }
    openDevice();
  }

  function moveSelection(delta) {
    if (isCooldown || isDischarging) return;
    if (!isOpen && !activeFormId) isOpen = true;
    selectedIndex = (selectedIndex + delta + forms.length) % forms.length;
    render();
  }

  function transform(index = selectedIndex) {
    if (isCooldown || isDischarging) return;
    selectedIndex = Number(index || 0);
    activeFormId = selectedForm().id;
    isOpen = true;
    render();
  }

  function discharge() {
    if (!activeFormId || isCooldown || isDischarging) return;
    isDischarging = true;
    isOpen = true;
    render();

    window.setTimeout(() => {
      activeFormId = '';
      isDischarging = false;
      isCooldown = true;
      isOpen = false;
      render();
    }, 3600);
  }

  function recharge() {
    if (!isCooldown || isDischarging) return;
    isCooldown = false;
    isOpen = false;
    activeFormId = '';
    render();
  }

  root.addEventListener('click', (event) => {
    const formButton = event.target.closest('[data-form-index]');
    if (formButton) {
      if (isDischarging) return;
      if (isCooldown) {
        recharge();
        return;
      }
      if (activeFormId) {
        discharge();
        return;
      }
      transform(Number(formButton.dataset.formIndex || 0));
      return;
    }

    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;
    const action = actionButton.dataset.action;
    if (action === 'toggle') toggleDevice();
    if (action === 'main') mainAction();
    if (action === 'previous') moveSelection(-1);
    if (action === 'next') moveSelection(1);
    if (action === 'discharge') discharge();
  });

  root.addEventListener('dblclick', (event) => {
    event.preventDefault();
  });

  root.addEventListener('wheel', (event) => {
    event.preventDefault();
    moveSelection(event.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') moveSelection(-1);
    if (event.key === 'ArrowDown') moveSelection(1);
    if (event.key === 'Enter') mainAction();
    if (event.key === 'Escape') {
      closeDevice();
    }
  });

  render();
})();
