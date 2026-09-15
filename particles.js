'use strict';

(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function createNetwork(canvas, options = {}) {
    if (!canvas || reducedMotion) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const settings = {
      count: options.count || 42,
      connectionDistance: options.connectionDistance || 125,
      pointerDistance: options.pointerDistance || 150,
      speed: options.speed || 0.23,
    };

    let width = 0;
    let height = 0;
    let dpr = 1;
    let points = [];
    const pointer = { x: -1000, y: -1000, active: false };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      points = Array.from({ length: Math.max(18, Math.round(settings.count * Math.min(width / 1100, 1))) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * settings.speed,
        vy: (Math.random() - 0.5) * settings.speed,
        r: Math.random() * 1.5 + 0.8,
      }));
    };

    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    const draw = () => {
      context.clearRect(0, 0, width, height);
      points.forEach((point) => {
        point.x += point.vx;
        point.y += point.vy;
        if (point.x < -10 || point.x > width + 10) point.vx *= -1;
        if (point.y < -10 || point.y > height + 10) point.vy *= -1;

        if (pointer.active) {
          const d = distance(point, pointer);
          if (d < settings.pointerDistance && d > 0) {
            const force = (settings.pointerDistance - d) / settings.pointerDistance;
            point.x += ((point.x - pointer.x) / d) * force * 0.45;
            point.y += ((point.y - pointer.y) / d) * force * 0.45;
          }
        }
      });

      if (pointer.active) {
        // Halo discreto acompanhando o mouse sobre a frase principal.
        const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, settings.pointerDistance * 0.95);
        glow.addColorStop(0, 'rgba(198,255,61,.13)');
        glow.addColorStop(0.42, 'rgba(176,38,199,.08)');
        glow.addColorStop(1, 'rgba(13,13,18,0)');
        context.fillStyle = glow;
        context.beginPath();
        context.arc(pointer.x, pointer.y, settings.pointerDistance, 0, Math.PI * 2);
        context.fill();
      }

      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const d = distance(points[i], points[j]);
          if (d > settings.connectionDistance) continue;
          const alpha = (1 - d / settings.connectionDistance) * 0.22;
          context.strokeStyle = `rgba(176, 38, 199, ${alpha})`;
          context.lineWidth = 0.8;
          context.beginPath();
          context.moveTo(points[i].x, points[i].y);
          context.lineTo(points[j].x, points[j].y);
          context.stroke();
        }
      }

      points.forEach((point, index) => {
        context.fillStyle = index % 7 === 0 ? 'rgba(198,255,61,.66)' : 'rgba(176,38,199,.62)';
        context.beginPath();
        context.arc(point.x, point.y, point.r, 0, Math.PI * 2);
        context.fill();
      });

      requestAnimationFrame(draw);
    };

    // O canvas fica atrás do conteúdo do Hero. Por isso a interação precisa
    // ouvir o título (que está na frente), e não o próprio canvas.
    const interactionTarget = document.querySelector('#hero-title') || canvas.parentElement || canvas;

    const updatePointer = (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };

    interactionTarget.addEventListener('pointerenter', updatePointer, { passive: true });
    interactionTarget.addEventListener('pointermove', updatePointer, { passive: true });
    interactionTarget.addEventListener('pointerleave', () => { pointer.active = false; }, { passive: true });
    interactionTarget.addEventListener('pointercancel', () => { pointer.active = false; }, { passive: true });

    window.addEventListener('resize', resize, { passive: true });

    resize();
    draw();
  }

  function createHalo(canvas) {
    if (!canvas || reducedMotion) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let time = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      time += 0.008;
      const radius = Math.min(width, height) * (0.28 + Math.sin(time) * 0.015);
      const gradient = context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, radius * 1.8);
      gradient.addColorStop(0, 'rgba(176,38,199,.16)');
      gradient.addColorStop(0.55, 'rgba(198,255,61,.045)');
      gradient.addColorStop(1, 'rgba(13,13,18,0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
      requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize, { passive: true });
    resize();
    draw();
  }

  createNetwork(document.querySelector('#particle-canvas'));
  createHalo(document.querySelector('#halo-canvas'));
})();

/* Partículas tipográficas: a frase se abre ao redor do cursor e se recompõe. */
(() => {
  const title = document.querySelector('#hero-title');
  if (!title || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'hero__text-particles';
  canvas.setAttribute('aria-hidden', 'true');
  title.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let particles = [];
  let width = 1;
  let height = 1;
  let dpr = 1;
  const pointer = { x: -999, y: -999, active: false };

  function collectWordRects() {
    const titleRect = title.getBoundingClientRect();
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.parentElement === title && node.textContent.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    });
    const words = [];
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent;
      const re = /\S+/g;
      let match;
      while ((match = re.exec(text))) {
        const range = document.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        const rect = range.getBoundingClientRect();
        if (rect.width && rect.height) {
          words.push({ text: match[0], x: rect.left - titleRect.left, y: rect.top - titleRect.top, w: rect.width, h: rect.height });
        }
      }
    }
    return words;
  }

  function buildParticles() {
    const rect = title.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const style = getComputedStyle(title);
    const fontSize = parseFloat(style.fontSize);
    const fontWeight = style.fontWeight;
    const fontFamily = style.fontFamily;
    const step = Math.max(5, Math.round(fontSize / 12));
    const next = [];

    collectWordRects().forEach((word) => {
      const ow = Math.max(1, Math.ceil(word.w));
      const oh = Math.max(1, Math.ceil(word.h));
      const off = document.createElement('canvas');
      off.width = ow;
      off.height = oh;
      const oc = off.getContext('2d', { willReadFrequently: true });
      oc.clearRect(0, 0, ow, oh);
      oc.fillStyle = '#fff';
      oc.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      oc.textBaseline = 'top';
      oc.fillText(word.text, 0, Math.min(0, (word.h - fontSize) / 2));
      const data = oc.getImageData(0, 0, ow, oh).data;
      for (let y = 0; y < oh; y += step) {
        for (let x = 0; x < ow; x += step) {
          const alpha = data[(y * ow + x) * 4 + 3];
          if (alpha < 80) continue;
          const ox = word.x + x;
          const oy = word.y + y;
          next.push({ x: ox, y: oy, ox, oy, vx: 0, vy: 0, r: Math.max(1.15, step * .28) });
        }
      }
    });
    particles = next;
  }

  function movePointer(event) {
    const rect = title.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
    title.classList.add('is-particle-active');
    title.style.setProperty('--particle-x', `${pointer.x}px`);
    title.style.setProperty('--particle-y', `${pointer.y}px`);
  }

  title.addEventListener('pointerenter', movePointer, { passive: true });
  title.addEventListener('pointermove', movePointer, { passive: true });
  title.addEventListener('pointerleave', () => {
    pointer.active = false;
    title.classList.remove('is-particle-active');
  }, { passive: true });

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (pointer.active && dist < 105) {
        const force = (105 - dist) / 105;
        p.vx += (dx / dist) * force * 2.5;
        p.vy += (dy / dist) * force * 2.5;
      }
      p.vx += (p.ox - p.x) * .045;
      p.vy += (p.oy - p.y) * .045;
      p.vx *= .86;
      p.vy *= .86;
      p.x += p.vx;
      p.y += p.vy;

      const displaced = Math.hypot(p.x - p.ox, p.y - p.oy);
      if (!pointer.active && displaced < .35) continue;
      ctx.fillStyle = displaced > 7 ? 'rgba(198,255,61,.88)' : 'rgba(176,38,199,.78)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildParticles, 160);
  }, { passive: true });

  if (document.fonts?.ready) document.fonts.ready.then(buildParticles);
  else buildParticles();
  draw();
})();
