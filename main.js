'use strict';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setupMobileNavigation() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const dropdownButton = document.querySelector('.has-dropdown > .main-nav__link');
  const dropdownItem = document.querySelector('.has-dropdown');
  if (!header || !toggle) return;

  const closeMenu = () => {
    header.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
    dropdownItem?.classList.remove('is-open');
    dropdownButton?.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const isOpen = header.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  });

  dropdownButton?.addEventListener('click', () => {
    if (window.innerWidth >= 900) return;
    const isOpen = dropdownItem.classList.toggle('is-open');
    dropdownButton.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('.main-nav a, .header__actions a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 900) closeMenu();
  });
}

function setupHeroAction() {
  const button = document.querySelector('#btn-video');
  const target = document.querySelector('#formacoes');
  if (!button || !target) return;
  button.addEventListener('click', () => {
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  });
}

function setupFormationTargets() {
  const links = document.querySelectorAll('[data-formacao-target]');
  links.forEach((link) => {
    link.addEventListener('click', () => {
      const targetName = link.dataset.formacaoTarget;
      window.setTimeout(() => {
        const card = document.querySelector(`[data-formacao="${targetName}"]`);
        if (!card) return;
        document.querySelectorAll('.formacao-card.is-target').forEach((item) => item.classList.remove('is-target'));
        card.classList.add('is-target');
        card.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
        window.setTimeout(() => card.classList.remove('is-target'), 2200);
      }, 250);
    });
  });
}

function setupMentorCarousel() {
  const track = document.querySelector('.tutores__track');
  const previous = document.querySelector('.tutores__arrow--prev');
  const next = document.querySelector('.tutores__arrow--next');
  if (!track || !previous || !next) return;

  const cards = [...track.querySelectorAll('.tutor-card')];
  let currentIndex = 0;

  const cardStep = () => {
    const first = cards[0];
    if (!first) return 300;
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || 0);
    return first.getBoundingClientRect().width + gap;
  };

  const updateActive = () => {
    const center = track.scrollLeft + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Infinity;
    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(center - cardCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    currentIndex = closestIndex;
    cards.forEach((card, index) => card.classList.toggle('tutor-card--active', index === currentIndex));
  };

  const move = (direction) => {
    currentIndex = (currentIndex + direction + cards.length) % cards.length;
    const card = cards[currentIndex];
    if (!card) return;
    card.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
    cards.forEach((item, index) => item.classList.toggle('tutor-card--active', index === currentIndex));
  };

  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('scroll', () => window.requestAnimationFrame(updateActive), { passive: true });
  track.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      move(1);
    }
  });

  // Mantém a medida disponível para futuras evoluções sem números mágicos.
  track.dataset.cardStep = String(Math.round(cardStep()));
}

function setupCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const animate = (element) => {
    const target = Number(element.dataset.counter || 0);
    const prefix = element.dataset.prefix || '';
    const suffix = element.dataset.suffix || '';
    if (prefersReducedMotion) {
      element.textContent = `${prefix}${target.toLocaleString('pt-BR')}${suffix}`;
      return;
    }

    const duration = 1200;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      element.textContent = `${prefix}${value.toLocaleString('pt-BR')}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (!('IntersectionObserver' in window)) {
    counters.forEach(animate);
    return;
  }

  const observer = new IntersectionObserver((entries, instance) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animate(entry.target);
      instance.unobserve(entry.target);
    });
  }, { threshold: 0.45 });

  counters.forEach((counter) => observer.observe(counter));
}

function setupRevealAnimations() {
  const elements = document.querySelectorAll('.section-title, .section-subtitle, .formacao-card, .beneficio-card, .tutor-card, .stat-card, .depoimento-card, .podcast-card, .cta-final__content');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) return;

  elements.forEach((element) => element.classList.add('reveal'));
  const observer = new IntersectionObserver((entries, instance) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      instance.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  elements.forEach((element) => observer.observe(element));
}

setupMobileNavigation();
setupHeroAction();
setupFormationTargets();
setupMentorCarousel();
setupCounters();
setupRevealAnimations();

/* Mantém a janela Formações operacional também por clique no desktop. */
function setupDesktopFormationDropdown() {
  const item = document.querySelector('.has-dropdown');
  const button = item?.querySelector(':scope > .main-nav__link');
  if (!item || !button) return;

  button.addEventListener('click', (event) => {
    if (window.innerWidth < 900) return;
    event.preventDefault();
    const open = item.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(open));
  });

  item.addEventListener('mouseenter', () => {
    if (window.innerWidth < 900) return;
    item.classList.add('is-open');
    button.setAttribute('aria-expanded', 'true');
  });
  item.addEventListener('mouseleave', () => {
    if (window.innerWidth < 900) return;
    item.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('click', (event) => {
    if (window.innerWidth < 900 || item.contains(event.target)) return;
    item.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
  });
}

document.addEventListener('DOMContentLoaded', setupDesktopFormationDropdown);
