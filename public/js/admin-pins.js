const editor = document.querySelector('[data-pin-editor]');

if (editor) {
  const pinLayer = editor.querySelector('[data-pin-layer]');
  const pinImage = editor.querySelector('[data-pin-image]');
  const pinList = editor.querySelector('[data-pin-list]');
  const pinForm = editor.querySelector('[data-pin-form]');
  const addButton = editor.querySelector('[data-add-pin]');
  const deleteButton = editor.querySelector('[data-delete-pin]');
  const saveButton = editor.querySelector('[data-save-pin]');
  const feedbackEl = editor.querySelector('[data-feedback]');
  const displayX = editor.querySelector('[data-display="x"]');
  const displayY = editor.querySelector('[data-display="y"]');
  const saveEndpoint = editor.dataset.saveEndpoint;

  const fields = {
    name: pinForm.querySelector('[data-field="name"]'),
    description: pinForm.querySelector('[data-field="description"]'),
    price_label: pinForm.querySelector('[data-field="price_label"]'),
    cta_path: pinForm.querySelector('[data-field="cta_path"]')
  };

  const slugify = (value = '') =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `pin-${Date.now()}`;

  const createClientId = () =>
    (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pin-${Date.now()}-${Math.random()}`);

  const createDefaultPin = () => ({
    clientId: createClientId(),
    name: 'Novo produto',
    description: 'Descreva o destaque exibido ao passar o mouse.',
    price_label: 'R$ 0,00',
    cta_path: '',
    tracking_code: '',
    badge: 'Destaque',
    slug: '',
    x_percent: 50,
    y_percent: 50
  });

  let pins = (Array.isArray(window.__PIN_DATA__) ? window.__PIN_DATA__ : []).map((pin) => ({
    ...pin,
    clientId: createClientId()
  }));

  if (!pins.length) {
    pins = [createDefaultPin()];
  }

  let selectedId = pins[0].clientId;

  const feedback = (message, type = 'info') => {
    if (!feedbackEl) return;
    feedbackEl.textContent = message;
    feedbackEl.dataset.state = type;
  };

  const clampPercent = (value) => Math.min(Math.max(value, 0), 100);

  const selectPin = (clientId) => {
    selectedId = clientId;
    renderPins();
    renderList();
    populateForm();
  };

  const updateCoordinatesDisplay = (pin) => {
    if (!pin) return;
    if (displayX) displayX.textContent = `${pin.x_percent.toFixed(1)}%`;
    if (displayY) displayY.textContent = `${pin.y_percent.toFixed(1)}%`;
  };

  const populateForm = () => {
    const pin = pins.find((item) => item.clientId === selectedId);
    if (!pin) return;
    Object.entries(fields).forEach(([key, input]) => {
      if (input) {
        input.value = pin[key] ?? '';
      }
    });
    updateCoordinatesDisplay(pin);
  };

  const updatePinPosition = (clientId, xPercent, yPercent) => {
    const pin = pins.find((item) => item.clientId === clientId);
    if (!pin) return;
    pin.x_percent = clampPercent(xPercent);
    pin.y_percent = clampPercent(yPercent);
    if (clientId === selectedId) {
      updateCoordinatesDisplay(pin);
    }
    renderPins();
  };

  const pointerToPercent = (event) => {
    const rect = pinImage.getBoundingClientRect();
    const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100;
    return { xPercent, yPercent };
  };

  const renderPins = () => {
    if (!pinLayer) return;
    pinLayer.innerHTML = '';
    pins.forEach((pin) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `pin-dot${pin.clientId === selectedId ? ' is-active' : ''}`;
      button.style.left = `${pin.x_percent}%`;
      button.style.top = `${pin.y_percent}%`;
      button.innerHTML = '<span></span>';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        selectPin(pin.clientId);
      });
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();
        selectPin(pin.clientId);
        button.setPointerCapture(event.pointerId);

        const handleMove = (moveEvent) => {
          const { xPercent, yPercent } = pointerToPercent(moveEvent);
          updatePinPosition(pin.clientId, xPercent, yPercent);
        };

        const handleUp = () => {
          button.releasePointerCapture(event.pointerId);
          document.removeEventListener('pointermove', handleMove);
          document.removeEventListener('pointerup', handleUp);
        };

        document.addEventListener('pointermove', handleMove);
        document.addEventListener('pointerup', handleUp, { once: true });
      });

      pinLayer.appendChild(button);
    });
  };

  const renderList = () => {
    if (!pinList) return;
    pinList.innerHTML = '';
    pins.forEach((pin, index) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.textContent = `${index + 1}. ${pin.name || 'Sem nome'}`;
      item.className = pin.clientId === selectedId ? 'is-active' : '';
      item.addEventListener('click', () => selectPin(pin.clientId));
      pinList.appendChild(item);
    });
  };

  const addPin = () => {
    const newPin = createDefaultPin();
    pins.push(newPin);
    selectPin(newPin.clientId);
    feedback('Pin criado. Arraste para posicionar.', 'info');
  };

  const deletePin = () => {
    if (!pins.length) return;
    pins = pins.filter((pin) => pin.clientId !== selectedId);
    if (!pins.length) {
      pins = [createDefaultPin()];
    }
    selectedId = pins[0].clientId;
    renderPins();
    renderList();
    populateForm();
    feedback('Pin removido.', 'info');
  };

  const savePins = async () => {
    if (!saveEndpoint) return;
    saveButton.disabled = true;
    feedback('Salvando pins...', 'info');
    const payload = pins.map(({ clientId, id, article_id, ...rest }) => {
      const next = { ...rest };
      if (!next.slug && next.name) {
        next.slug = slugify(next.name);
      }
      return next;
    });

    try {
      const response = await fetch(saveEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ pins: payload })
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar pins.');
      }

      const result = await response.json();
      feedback(`Pins atualizados (${result.total || payload.length}).`, 'success');
    } catch (error) {
      console.error(error);
      feedback('Erro ao salvar pins. Tente novamente.', 'error');
    } finally {
      saveButton.disabled = false;
    }
  };

  Object.entries(fields).forEach(([key, input]) => {
    if (!input) return;
    input.addEventListener('input', (event) => {
      const pin = pins.find((item) => item.clientId === selectedId);
      if (!pin) return;
      pin[key] = event.target.value;
      if (key === 'name') {
        renderList();
      }
    });
  });

  if (pinImage) {
    pinImage.addEventListener('click', (event) => {
      const pin = pins.find((item) => item.clientId === selectedId);
      if (!pin) return;
      const { xPercent, yPercent } = pointerToPercent(event);
      updatePinPosition(pin.clientId, xPercent, yPercent);
    });
  }

  addButton?.addEventListener('click', addPin);
  deleteButton?.addEventListener('click', deletePin);
  saveButton?.addEventListener('click', savePins);

  renderPins();
  renderList();
  populateForm();

  delete window.__PIN_DATA__;
}
