// Sistema simples de pins: hover mostra modal, mouseleave esconde
document.addEventListener('DOMContentLoaded', () => {
  let currentPin = null;
  let currentPopover = null;

  const showModal = (pinContainer, event) => {
    const popover = pinContainer.querySelector('.product-popover');
    if (!popover) return;

    currentPin = pinContainer;
    currentPopover = popover;

    // Esconder todos os outros pins
    document.querySelectorAll('.pin-container').forEach((p) => {
      if (p !== pinContainer) {
        p.style.visibility = 'hidden';
        p.style.opacity = '0';
      }
    });

    // Calcular posição imediatamente
    const pinRect = pinContainer.getBoundingClientRect();
    const pinCenterX = pinRect.left + pinRect.width / 2;
    const pinTop = pinRect.top;

    // Posição do modal: 18px à direita, 8px acima do centro do pin
    let left = pinCenterX + 18;
    let top = pinTop - 8;

    // Ajustar se sair da tela
    const margin = 10;
    const popoverWidth = 280;
    const popoverHeight = 200;

    if (left + popoverWidth > window.innerWidth - margin) {
      left = window.innerWidth - popoverWidth - margin;
    }
    if (left < margin) {
      left = margin;
    }
    if (top - popoverHeight < margin) {
      top = pinTop + 8;
    }
    if (top + popoverHeight > window.innerHeight - margin) {
      top = window.innerHeight - popoverHeight - margin;
    }

    // Mover para o body para garantir que fique acima de tudo
    const originalParent = popover.parentElement;
    if (popover.parentElement !== document.body) {
      document.body.appendChild(popover);
    }

    // Aplicar estilos diretamente com !important via setProperty
    popover.style.setProperty('left', `${left}px`, 'important');
    popover.style.setProperty('top', `${top}px`, 'important');
    popover.style.setProperty('opacity', '1', 'important');
    popover.style.setProperty('visibility', 'visible', 'important');
    popover.style.setProperty('pointer-events', 'auto', 'important');
    popover.style.setProperty('position', 'fixed', 'important');
    popover.style.setProperty('z-index', '2147483647', 'important');
    popover.style.setProperty('display', 'block', 'important');
    
    // Guardar referência do parent original
    popover._originalParent = originalParent;
  };

  const hideModal = () => {
    if (currentPopover) {
      currentPopover.style.opacity = '0';
      currentPopover.style.visibility = 'hidden';
      
      // Voltar modal para o parent original
      if (currentPopover._originalParent && currentPopover.parentElement === document.body) {
        currentPopover._originalParent.appendChild(currentPopover);
        delete currentPopover._originalParent;
      }
    }

    // Mostrar todos os pins novamente
    document.querySelectorAll('.pin-container').forEach((p) => {
      p.style.visibility = '';
      p.style.opacity = '';
    });

    currentPin = null;
    currentPopover = null;
  };

  // Interceptar cliques nos links que contêm pins
  document.querySelectorAll('.article-card__link').forEach((link) => {
    link.addEventListener('click', (e) => {
      // Verificar se o clique foi em um pin ou no popover
      const clickedPin = e.target.closest('.pin-container') || e.target.closest('.product-pin') || e.target.closest('.product-popover');
      if (clickedPin) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true); // Usar capture phase para interceptar antes
  });

  // Hover nos pins
  document.querySelectorAll('.pin-container').forEach((pinContainer) => {
    const pin = pinContainer.querySelector('.product-pin');
    const popover = pinContainer.querySelector('.product-popover');

    if (!pin || !popover) return;

    // Prevenir clique no link quando interagir com o pin
    pinContainer.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);

    // Mouse enter - mostrar modal
    pinContainer.addEventListener('mouseenter', (e) => {
      showModal(pinContainer, e);
    });

    // Mouse leave - esconder modal
    pinContainer.addEventListener('mouseleave', (e) => {
      // Verificar se o mouse foi para o popover
      if (e.relatedTarget && (e.relatedTarget === popover || popover.contains(e.relatedTarget))) {
        return;
      }
      if (currentPin === pinContainer) {
        hideModal();
      }
    });

    // Hover no popover também mantém visível
    popover.addEventListener('mouseenter', () => {
      // Manter visível quando mouse está sobre o popover
    });

    popover.addEventListener('mouseleave', (e) => {
      // Só esconder se o mouse realmente saiu (não foi para o pin)
      setTimeout(() => {
        if (currentPin === pinContainer) {
          const relatedTarget = e.relatedTarget;
          if (!relatedTarget || (!pinContainer.contains(relatedTarget) && relatedTarget !== popover)) {
            hideModal();
          }
        }
      }, 100);
    });

    // Click para mobile e desktop
    pin.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      if (currentPin === pinContainer) {
        pinContainer.classList.toggle('active');
        if (!pinContainer.classList.contains('active')) {
          hideModal();
        } else {
          showModal(pinContainer, e);
        }
      } else {
        document.querySelectorAll('.pin-container').forEach((p) => {
          p.classList.remove('active');
        });
        pinContainer.classList.add('active');
        showModal(pinContainer, e);
      }
      
      return false;
    }, true);
  });

  // Fechar ao clicar fora
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.pin-container') && !e.target.closest('.product-popover')) {
      document.querySelectorAll('.pin-container').forEach((p) => {
        p.classList.remove('active');
      });
      hideModal();
    }
  });
});

// Para página de artigo - manter lógica antiga
const initArticlePins = (surfaceElement) => {
  const container = surfaceElement.closest('figure') || surfaceElement.parentElement;
  const popover = container?.querySelector('[data-popover]');
  
  if (!popover) return;

  const popoverTitle = popover.querySelector('[data-title]');
  const popoverDescription = popover.querySelector('[data-description]');
  const popoverPrice = popover.querySelector('[data-price]');
  const popoverBadge = popover.querySelector('[data-badge]');
  const popoverCta = popover.querySelector('[data-cta]');

  const fillPopover = (pinElement) => {
    if (popoverTitle) popoverTitle.textContent = pinElement.dataset.name || '';
    if (popoverDescription) popoverDescription.textContent = pinElement.dataset.description || '';
    if (popoverPrice) popoverPrice.textContent = pinElement.dataset.price || '';
    if (popoverBadge) popoverBadge.textContent = pinElement.dataset.badge || '';
    if (popoverCta) popoverCta.href = pinElement.dataset.cta || '#';
  };

  let hideTimeout;

  const showPopover = (pinElement) => {
    clearTimeout(hideTimeout);
    fillPopover(pinElement);
    
    // Calcular posição do pin
    const pinRect = pinElement.getBoundingClientRect();
    const pinCenterX = pinRect.left + pinRect.width / 2;
    const pinTop = pinRect.top;
    
    // Posição do modal: 18px à direita, 8px acima do centro do pin
    let left = pinCenterX + 18;
    let top = pinTop - 8;
    
    // Ajustar se sair da tela
    const margin = 10;
    const popoverWidth = 280;
    const popoverHeight = 200;
    
    if (left + popoverWidth > window.innerWidth - margin) {
      left = window.innerWidth - popoverWidth - margin;
    }
    if (left < margin) {
      left = margin;
    }
    if (top - popoverHeight < margin) {
      top = pinTop + 8; // Mostrar abaixo se não couber acima
    }
    if (top + popoverHeight > window.innerHeight - margin) {
      top = window.innerHeight - popoverHeight - margin;
    }
    
    // Mover para o body para garantir que fique acima de tudo
    const originalParent = popover.parentElement;
    if (popover.parentElement !== document.body) {
      document.body.appendChild(popover);
      popover._originalParent = originalParent;
    }
    
    // Aplicar posicionamento
    popover.style.setProperty('left', `${left}px`, 'important');
    popover.style.setProperty('top', `${top}px`, 'important');
    popover.style.setProperty('position', 'fixed', 'important');
    popover.style.setProperty('z-index', '2147483647', 'important');
    
    popover.classList.add('is-visible');
    popover.setAttribute('aria-hidden', 'false');
  };

  const hidePopover = () => {
    popover.classList.remove('is-visible');
    popover.setAttribute('aria-hidden', 'true');
    
    // Voltar popover para o parent original se foi movido
    if (popover._originalParent && popover.parentElement === document.body) {
      popover._originalParent.appendChild(popover);
      delete popover._originalParent;
    }
  };

  const scheduleHide = () => {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => hidePopover(), 120);
  };

  const pins = surfaceElement?.querySelectorAll('[data-pin="true"]') || [];
  pins.forEach((pin) => {
    pin.addEventListener('mouseenter', () => showPopover(pin));
    pin.addEventListener('mouseleave', scheduleHide);
    pin.addEventListener('click', (event) => {
      event.preventDefault();
      showPopover(pin);
    });
  });

  if (popover) {
    popover.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
    popover.addEventListener('mouseleave', scheduleHide);
  }
};

// Inicializar pins na página de artigo
document.querySelectorAll('figure[data-pin-surface]').forEach((surface) => {
  initArticlePins(surface);
});

document.querySelectorAll('[data-scroll]').forEach((button) => {
  const target = button.dataset.scroll;
  button.addEventListener('click', () => {
    const element = document.querySelector(target);
    element?.scrollIntoView({ behavior: 'smooth' });
  });
});

const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = new FormData(newsletterForm).get('email');
    newsletterForm.reset();
    alert(`Obrigado! Em instantes você recebe a próxima edição em ${email}.`);
  });
}

// Carrossel de imagens
const carouselTrack = document.getElementById('carousel-track');
const carouselPrev = document.getElementById('carousel-prev');
const carouselNext = document.getElementById('carousel-next');
const carouselDots = document.getElementById('carousel-dots');

if (carouselTrack) {
  let currentIndex = 0;
  const slides = carouselTrack.querySelectorAll('.carousel-slide');
  const totalSlides = slides.length;

  const updateCarousel = () => {
    carouselTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    // Atualizar dots
    if (carouselDots) {
      const dots = carouselDots.querySelectorAll('.carousel-dot');
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
      });
    }
  };

  const goToSlide = (index) => {
    currentIndex = Math.max(0, Math.min(index, totalSlides - 1));
    updateCarousel();
  };

  const nextSlide = () => {
    currentIndex = (currentIndex + 1) % totalSlides;
    updateCarousel();
  };

  const prevSlide = () => {
    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    updateCarousel();
  };

  if (carouselNext) {
    carouselNext.addEventListener('click', nextSlide);
  }

  if (carouselPrev) {
    carouselPrev.addEventListener('click', prevSlide);
  }

  if (carouselDots) {
    carouselDots.querySelectorAll('.carousel-dot').forEach((dot, index) => {
      dot.addEventListener('click', () => goToSlide(index));
    });
  }

  // Navegação por teclado
  document.addEventListener('keydown', (e) => {
    if (document.querySelector('.article-carousel')) {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    }
  });

  // Auto-play opcional (descomente se quiser)
  // setInterval(nextSlide, 5000);
}

