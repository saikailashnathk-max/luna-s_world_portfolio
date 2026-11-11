/**
 * Luna's World — Motion & Scroll Choreography (Lenis + GSAP ScrollTrigger)
 * Calm, floaty pacing with full prefers-reduced-motion support and graceful fallbacks.
 */

(() => {
  'use strict';

  const MOTION_CONFIG = {
    lenisDuration: 1.25,
    heroStagger: 0.12,
    heroDuration: 0.95,
    noteWordStagger: 0.032,
    cardDuration: 0.9,
    tiltMaxDeg: 9
  };

  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Splits "A note from Luna" into word spans while keeping .shimmer-phrase intact
   * so gradient text clipping renders cleanly across all browsers.
   */
  function splitNoteWords(quoteEl) {
    if (!quoteEl || quoteEl.dataset.splitDone === 'true') return [];
    const originalText = quoteEl.textContent.trim();
    quoteEl.setAttribute('aria-label', originalText);

    const nodes = Array.from(quoteEl.childNodes);
    const fragment = document.createDocumentFragment();
    const wordTargets = [];

    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const parts = node.textContent.split(/(\s+)/);
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            fragment.appendChild(document.createTextNode(part));
          } else {
            const span = document.createElement('span');
            span.className = 'word-span';
            span.setAttribute('aria-hidden', 'true');
            span.textContent = part;
            fragment.appendChild(span);
            wordTargets.push(span);
          }
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const clone = node.cloneNode(true);
        clone.classList.add('word-span');
        clone.setAttribute('aria-hidden', 'true');
        fragment.appendChild(clone);
        wordTargets.push(clone);
      }
    });

    quoteEl.textContent = '';
    quoteEl.appendChild(fragment);
    quoteEl.dataset.splitDone = 'true';
    return wordTargets;
  }

  /**
   * Interactive 3D tilt + glare highlight on "The Hidden Bloodline" cover.
   */
  function initWorkCoverTilt() {
    const cover = document.querySelector('#work-cover-tilt');
    if (!cover || prefersReducedMotion()) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    cover.addEventListener('pointermove', (e) => {
      const rect = cover.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      const rotateY = (px - 0.5) * (MOTION_CONFIG.tiltMaxDeg * 2);
      const rotateX = (0.5 - py) * (MOTION_CONFIG.tiltMaxDeg * 2);

      cover.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      cover.style.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`);
      cover.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`);
    });

    cover.addEventListener('pointerleave', () => {
      cover.style.transform = 'rotateX(0deg) rotateY(0deg)';
      cover.style.setProperty('--glare-x', '50%');
      cover.style.setProperty('--glare-y', '50%');
    });
  }

  /**
   * Initializes Lenis smooth scroll and syncs with GSAP ScrollTrigger.
   */
  function initSmoothScroll() {
    if (prefersReducedMotion() || typeof Lenis === 'undefined') return null;

    const lenis = new Lenis({
      duration: MOTION_CONFIG.lenisDuration,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4
    });

    window.LUNA_LENIS = lenis;

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    // Smooth anchor navigation
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (!targetId || targetId === '#') return;
        const targetEl = document.querySelector(targetId);
        if (!targetEl) return;
        e.preventDefault();
        lenis.scrollTo(targetEl, { offset: -78 });
      });
    });

    return lenis;
  }

  /**
   * Initializes GSAP ScrollTrigger animations across all sections.
   */
  function initGSAPAnimations() {
    if (prefersReducedMotion()) return;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // 1. Hero staggered entrance
    const heroTl = gsap.timeline({ delay: 0.28 });
    heroTl
      .from('.hero-stagger', {
        y: 26,
        opacity: 0,
        duration: MOTION_CONFIG.heroDuration,
        stagger: MOTION_CONFIG.heroStagger,
        ease: 'power3.out',
        clearProps: 'transform,opacity'
      })
      .from(
        '.hero-art',
        {
          y: 30,
          opacity: 0,
          duration: 1.05,
          ease: 'power3.out',
          clearProps: 'transform,opacity'
        },
        '-=0.7'
      );

    // Subtle hero photo & accent parallax on scroll
    gsap.to('[data-parallax="hero-photo"]', {
      yPercent: -8,
      ease: 'none',
      scrollTrigger: {
        trigger: '#home',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.8
      }
    });

    gsap.to('[data-parallax="orbit"]', {
      yPercent: -18,
      rotation: 26,
      ease: 'none',
      scrollTrigger: {
        trigger: '#home',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.9
      }
    });

    gsap.to('[data-parallax="art-note"]', {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: {
        trigger: '#home',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.9
      }
    });

    // 2. "A note from Luna" word-by-word reveal
    const introQuote = document.querySelector('#intro-quote');
    const words = splitNoteWords(introQuote);
    if (words.length > 0) {
      gsap.from(words, {
        opacity: 0,
        y: 12,
        duration: 0.65,
        stagger: MOTION_CONFIG.noteWordStagger,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: '.intro-band',
          start: 'top 78%',
          once: true
        }
      });
    }

    // 3. Ornamental dividers fade & expand
    gsap.utils.toArray('.section-divider').forEach((divider) => {
      const lines = divider.querySelectorAll('.divider-line');
      const glyph = divider.querySelector('.divider-glyph');
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: divider,
          start: 'top 88%',
          once: true
        }
      });
      tl.from(lines, {
        scaleX: 0,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        clearProps: 'transform,opacity'
      }).from(
        glyph,
        {
          scale: 0.6,
          opacity: 0,
          rotation: -18,
          duration: 0.65,
          ease: 'back.out(1.4)',
          clearProps: 'transform,opacity'
        },
        '-=0.5'
      );
    });

    // 4. Section headers gentle reveal
    gsap.utils.toArray('.section-head, .work-collection-head').forEach((head) => {
      gsap.from(head.children, {
        y: 22,
        opacity: 0,
        duration: 0.85,
        stagger: 0.12,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: head,
          start: 'top 84%',
          once: true
        }
      });
    });

    // 5. All 7 Poetry cards: staggered alternating left/right entrance
    const isNarrow = window.innerWidth < 760;
    const xOffset = isNarrow ? 18 : 40;
    gsap.utils.toArray('.poem-card').forEach((card, index) => {
      gsap.from(card, {
        x: index % 2 === 0 ? -xOffset : xOffset,
        y: 16,
        opacity: 0,
        duration: MOTION_CONFIG.cardDuration,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: card,
          start: 'top 86%',
          once: true
        }
      });
    });

    // 6. Works feature & BriBooks cards
    gsap.from('.work-feature', {
      y: 28,
      opacity: 0,
      duration: 0.95,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: {
        trigger: '.work-feature',
        start: 'top 82%',
        once: true
      }
    });

    gsap.from('.work-card', {
      y: 26,
      opacity: 0,
      duration: 0.85,
      stagger: 0.14,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: {
        trigger: '.work-grid',
        start: 'top 84%',
        once: true,
        onEnter: () => {
          document.querySelectorAll('.work-card').forEach((c) => c.classList.add('is-revealed'));
        }
      }
    });

    // 7. Contact section gentle reveal
    gsap.from('.contact-copy, .contact-form', {
      y: 24,
      opacity: 0,
      duration: 0.9,
      stagger: 0.16,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: {
        trigger: '#contact',
        start: 'top 82%',
        once: true
      }
    });
  }

  /**
   * Scroll-reactive flock of 3 identical 4-winged butterflies:
   * - Each butterfly follows its own randomized smooth downward path when scrolling down
   * - Smoothly transitions onto a different randomized upward return path when scrolling up
   * - Naturally tracks scroll motion & velocity, turning nose-first along its flight vector
   */
  function initScrollButterfly() {
    const layer = document.querySelector('#scroll-butterfly-layer');
    const template = document.querySelector('#scroll-butterfly');
    if (!layer || !template || prefersReducedMotion()) return;

    const totalButterflies = 3;
    const nodes = [template];
    template.dataset.butterflyIndex = '0';

    for (let i = 1; i < totalButterflies; i++) {
      const clone = template.cloneNode(true);
      clone.removeAttribute('id');
      clone.dataset.butterflyIndex = String(i);
      layer.appendChild(clone);
      nodes.push(clone);
    }

    const vwInit = window.innerWidth;
    const vhInit = window.innerHeight;
    const rand = (min, max) => min + Math.random() * (max - min);

    const flock = nodes.map((el, idx) => {
      const startX = vwInit * rand(0.18, 0.86);
      const startY = vhInit * rand(0.1, 0.32);
      return {
        el,
        foreLeft: el.querySelector('.butterfly-wing--fore-left'),
        foreRight: el.querySelector('.butterfly-wing--fore-right'),
        hindLeft: el.querySelector('.butterfly-wing--hind-left'),
        hindRight: el.querySelector('.butterfly-wing--hind-right'),
        scale: rand(0.86, 1.12),
        curX: startX,
        curY: startY,
        curAngle: rand(140, 210),
        targetAngle: 170,
        flapPhase: rand(0, Math.PI * 2),
        flapBias: rand(0.86, 1.16),
        lerpSpeed: rand(0.055, 0.088),
        hoverPhase: rand(0, Math.PI * 2),
        hoverAmpX: rand(5, 11),
        hoverAmpY: rand(6, 13),
        // Randomized downward path parameters (scroll down)
        downFreqX1: rand(1.6, 3.1),
        downPhaseX1: rand(0, Math.PI * 2),
        downFreqX2: rand(2.6, 4.2),
        downPhaseX2: rand(0, Math.PI * 2),
        downAmpX: rand(0.3, 0.44),
        downOffsetY: (idx - 2) * 0.052 + rand(-0.025, 0.025),
        downWaveY: rand(0.035, 0.075),
        downFreqY: rand(2.0, 3.8),
        downPhaseY: rand(0, Math.PI * 2),
        // Randomized upward return path parameters (scroll up)
        upFreqX1: rand(1.5, 3.0),
        upPhaseX1: rand(0, Math.PI * 2),
        upFreqX2: rand(2.4, 4.1),
        upPhaseX2: rand(0, Math.PI * 2),
        upAmpX: rand(0.3, 0.44),
        upOffsetY: (2 - idx) * 0.052 + rand(-0.025, 0.025),
        upWaveY: rand(0.035, 0.075),
        upFreqY: rand(2.0, 3.8),
        upPhaseY: rand(0, Math.PI * 2)
      };
    });

    let lastScrollY = window.scrollY || window.pageYOffset;
    let scrollVelocity = 0;
    let scrollDir = 1; // 1 = down, -1 = up
    let pathBlend = 0; // 0 = downward paths, 1 = upward paths
    let lastTime = performance.now();
    let lastDustTime = 0;
    let dustIndex = 0;
    let rafId = null;

    function shortestAngleLerp(current, target, factor) {
      const diff = ((target - current + 540) % 360) - 180;
      return current + diff * factor;
    }

    function spawnDust(x, y) {
      const dot = document.createElement('span');
      dot.className = 'butterfly-dust';
      dot.style.left = `${(x + (Math.random() - 0.5) * 18).toFixed(1)}px`;
      dot.style.top = `${(y + (Math.random() - 0.5) * 14).toFixed(1)}px`;
      document.body.appendChild(dot);
      setTimeout(() => dot.remove(), 950);
    }

    function step(now) {
      if (document.hidden || prefersReducedMotion()) {
        rafId = null;
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scrollY = window.scrollY || window.pageYOffset;
      const maxScroll = Math.max(document.documentElement.scrollHeight - vh, 1);
      const p = Math.min(Math.max(scrollY / maxScroll, 0), 1);

      const deltaY = scrollY - lastScrollY;
      lastScrollY = scrollY;
      if (deltaY > 0.6) scrollDir = 1;
      else if (deltaY < -0.6) scrollDir = -1;

      scrollVelocity = Math.min(scrollVelocity * 0.9 + Math.abs(deltaY) * 0.3, 30);

      const desiredBlend = scrollDir === 1 ? 0 : 1;
      pathBlend += (desiredBlend - pathBlend) * 0.045;

      const marginX = vw < 760 ? 44 : 88;
      const spanX = Math.max(vw - marginX * 2, 140);
      const halfW = vw < 760 ? 32 : 44;
      const halfH = vw < 760 ? 27.5 : 37.5;

      flock.forEach((b) => {
        const hoverX = Math.cos(now * 0.0014 + b.hoverPhase) * b.hoverAmpX;
        const hoverY = Math.sin(now * 0.0021 + b.hoverPhase) * b.hoverAmpY;

        // Randomized downward path
        const waveXDown =
          0.5 +
          b.downAmpX *
            (0.72 * Math.cos(p * Math.PI * b.downFreqX1 + b.downPhaseX1) +
              0.28 * Math.sin(p * Math.PI * b.downFreqX2 + b.downPhaseX2));
        const xDown = marginX + Math.min(Math.max(waveXDown, 0), 1) * spanX;
        const yDown =
          vh *
          Math.min(
            Math.max(
              0.13 +
                p * 0.72 +
                b.downOffsetY +
                b.downWaveY * Math.sin(p * Math.PI * b.downFreqY + b.downPhaseY),
              0.08
            ),
            0.9
          );

        // Distinct randomized upward return path
        const waveXUp =
          0.5 +
          b.upAmpX *
            (0.72 * Math.sin(p * Math.PI * b.upFreqX1 + b.upPhaseX1) +
              0.28 * Math.cos(p * Math.PI * b.upFreqX2 + b.upPhaseX2));
        const xUp = marginX + Math.min(Math.max(waveXUp, 0), 1) * spanX;
        const yUp =
          vh *
          Math.min(
            Math.max(
              0.13 +
                p * 0.72 +
                b.upOffsetY +
                b.upWaveY * Math.cos(p * Math.PI * b.upFreqY + b.upPhaseY),
              0.08
            ),
            0.9
          );

        const targetX = xDown + (xUp - xDown) * pathBlend + hoverX;
        const targetY = yDown + (yUp - yDown) * pathBlend + hoverY;

        const dx = targetX - b.curX;
        const dy = targetY - b.curY;
        b.curX += dx * b.lerpSpeed;
        b.curY += dy * b.lerpSpeed;

        const moveDist = Math.hypot(dx, dy);
        if (moveDist > 0.45) {
          b.targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        }
        b.curAngle = shortestAngleLerp(b.curAngle, b.targetAngle, 0.095);

        const flapSpeed = (4.2 + scrollVelocity * 0.48) * b.flapBias;
        b.flapPhase += dt * flapSpeed;
        const amp = scrollVelocity > 1.0 ? 64 : 44;
        const foreAngle = Math.sin(b.flapPhase) * amp;
        const hindAngle = Math.sin(b.flapPhase - 0.48) * (amp * 0.9);

        if (b.foreLeft) b.foreLeft.style.transform = `rotateY(${foreAngle.toFixed(1)}deg)`;
        if (b.foreRight) b.foreRight.style.transform = `rotateY(${(-foreAngle).toFixed(1)}deg)`;
        if (b.hindLeft) b.hindLeft.style.transform = `rotateY(${hindAngle.toFixed(1)}deg)`;
        if (b.hindRight) b.hindRight.style.transform = `rotateY(${(-hindAngle).toFixed(1)}deg)`;

        b.el.style.transform = `translate3d(${(b.curX - halfW).toFixed(1)}px, ${(
          b.curY - halfH
        ).toFixed(1)}px, 0) rotate(${b.curAngle.toFixed(1)}deg) scale(${b.scale.toFixed(2)})`;
      });

      if (scrollVelocity > 1.6 && now - lastDustTime > 65) {
        lastDustTime = now;
        const chosen = flock[dustIndex % flock.length];
        dustIndex += 1;
        spawnDust(chosen.curX, chosen.curY);
      }

      rafId = requestAnimationFrame(step);
    }

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !rafId) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(step);
      }
    });

    rafId = requestAnimationFrame(step);
  }

  /**
   * Hangly-style Fixed Vintage Analogue Clock (top-left, always visible):
   * - Real-time updating hour, minute, and second hands
   * - 7-node Verlet flexible metallic chain + heavy brass clock body
   * - Responds freely to page scroll inertia AND cursor hover/movement nudges
   */
  function initHangingClock() {
    const mount = document.querySelector('#vintage-clock-mount');
    const stage = document.querySelector('#clock-pendulum');
    const chainSvg = document.querySelector('#vintage-clock-chain');
    const body = document.querySelector('#clock-body');
    const hourHand = document.querySelector('#clock-hour-hand');
    const minuteHand = document.querySelector('#clock-minute-hand');
    const secondHand = document.querySelector('#clock-second-hand');
    if (!mount || !stage || !chainSvg || !body) return;

    const links = Array.from(chainSvg.querySelectorAll('.chain-link'));
    const nodeCount = 7;
    const segLen = 9.2;

    function updateClockHands() {
      const now = new Date();
      const ms = now.getMilliseconds();
      const sec = now.getSeconds() + ms / 1000;
      const min = now.getMinutes() + sec / 60;
      const hr = (now.getHours() % 12) + min / 60;

      if (secondHand) secondHand.setAttribute('transform', `rotate(${(sec * 6).toFixed(2)} 60 70)`);
      if (minuteHand) minuteHand.setAttribute('transform', `rotate(${(min * 6).toFixed(2)} 60 70)`);
      if (hourHand) hourHand.setAttribute('transform', `rotate(${(hr * 30).toFixed(2)} 60 70)`);
    }

    updateClockHands();

    // Initialize Verlet chain nodes hanging from (0, 2)
    const nodes = Array.from({ length: nodeCount }, (_, i) => ({
      x: 0,
      y: 2 + i * segLen,
      oldX: 0,
      oldY: 2 + i * segLen
    }));

    function renderChainAndClock(clockRotDeg) {
      for (let i = 0; i < links.length && i < nodeCount - 1; i++) {
        const a = nodes[i];
        const b = nodes[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const deg = (-Math.atan2(dx, dy) * 180) / Math.PI;
        links[i].setAttribute(
          'transform',
          `translate(${a.x.toFixed(2)} ${a.y.toFixed(2)}) rotate(${deg.toFixed(2)})`
        );
      }

      const end = nodes[nodeCount - 1];
      body.style.transform = `translate3d(${end.x.toFixed(2)}px, ${(end.y - 6).toFixed(
        2
      )}px, 0) rotate(${clockRotDeg.toFixed(2)}deg)`;
    }

    renderChainAndClock(0);

    if (prefersReducedMotion()) {
      setInterval(updateClockHands, 1000);
      return;
    }

    let clockAngle = 0;
    let clockAngVel = 0;
    let lastScrollY = window.scrollY || window.pageYOffset;
    let lastPointer = { x: 0, y: 0, active: false };
    let lastTime = performance.now();
    let rafId = null;

    // Scroll impulse: bends and swings the chain freely on scroll
    window.addEventListener(
      'scroll',
      () => {
        const scrollY = window.scrollY || window.pageYOffset;
        const delta = scrollY - lastScrollY;
        lastScrollY = scrollY;
        const kick = Math.max(-2.8, Math.min(2.8, -delta * 0.045));
        for (let i = 2; i < nodeCount; i++) {
          const weight = (i / (nodeCount - 1)) * 0.85;
          nodes[i].oldX -= kick * weight;
          nodes[i].oldY -= Math.abs(kick) * 0.12 * weight;
        }
        clockAngVel -= kick * 1.4;
      },
      { passive: true }
    );

    // Cursor hover & movement physics (Hangly-style nudge)
    window.addEventListener(
      'pointermove',
      (e) => {
        const pvx = lastPointer.active ? e.clientX - lastPointer.x : 0;
        const pvy = lastPointer.active ? e.clientY - lastPointer.y : 0;
        lastPointer = { x: e.clientX, y: e.clientY, active: true };

        const bodyRect = body.getBoundingClientRect();
        const cx = bodyRect.left + bodyRect.width * 0.5;
        const cy = bodyRect.top + bodyRect.height * 0.54;
        const dx = cx - e.clientX;
        const dy = cy - e.clientY;
        const dist = Math.hypot(dx, dy);
        const radius = Math.max(bodyRect.width * 0.85, 68);

        if (dist < radius) {
          const falloff = 1 - dist / radius;
          const nudgeX =
            Math.max(-4.2, Math.min(4.2, pvx * 0.24 + (dx / Math.max(dist, 1)) * 1.25 * falloff));
          const nudgeY = Math.max(-2.2, Math.min(2.2, pvy * 0.14));

          for (let i = 2; i < nodeCount; i++) {
            const weight = i / (nodeCount - 1);
            nodes[i].oldX -= nudgeX * weight * 0.85;
            nodes[i].oldY -= nudgeY * weight * 0.55;
          }
          clockAngVel += nudgeX * 2.2;
        }
      },
      { passive: true }
    );

    // Playful gentle swing if clicked
    body.addEventListener('pointerdown', (e) => {
      const rect = body.getBoundingClientRect();
      const side = e.clientX < rect.left + rect.width * 0.5 ? 1 : -1;
      for (let i = 2; i < nodeCount; i++) {
        nodes[i].oldX -= side * 3.2 * (i / (nodeCount - 1));
      }
      clockAngVel += side * 6;
    });

    function step(now) {
      if (document.hidden) {
        rafId = null;
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      updateClockHands();

      // Subtle ambient air current so the clock breathes lightly
      const breeze = (Math.sin(now * 0.0012) * 0.028 + Math.cos(now * 0.00075) * 0.018);
      const gravity = 0.56;
      const damping = 0.976;

      // Verlet integration
      for (let i = 1; i < nodeCount; i++) {
        const n = nodes[i];
        const vx = (n.x - n.oldX) * damping;
        const vy = (n.y - n.oldY) * damping;
        n.oldX = n.x;
        n.oldY = n.y;
        const massPull = i === nodeCount - 1 ? 1.55 : 1;
        n.x += vx + breeze * (i / nodeCount);
        n.y += vy + gravity * massPull;
      }

      // Distance constraints (keep chain links taut & flexible)
      for (let iter = 0; iter < 6; iter++) {
        nodes[0].x = 0;
        nodes[0].y = 2;
        for (let i = 0; i < nodeCount - 1; i++) {
          const a = nodes[i];
          const b = nodes[i + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 0.001;
          const diff = (d - segLen) / d;
          if (i === 0) {
            b.x -= dx * diff;
            b.y -= dy * diff;
          } else {
            const wA = i === nodeCount - 2 ? 0.65 : 0.5;
            const wB = 1 - wA;
            a.x += dx * diff * wA;
            a.y += dy * diff * wA;
            b.x -= dx * diff * wB;
            b.y -= dy * diff * wB;
          }
        }
      }

      // Clamp maximum sideways swing so it stays neatly framed
      const end = nodes[nodeCount - 1];
      const prev = nodes[nodeCount - 2];
      const tangentDeg = (-Math.atan2(end.x - prev.x, end.y - prev.y) * 180) / Math.PI;
      const springAccel = -28 * (clockAngle - tangentDeg * 1.25) - 3.6 * clockAngVel;
      clockAngVel += springAccel * dt;
      clockAngle = Math.max(-28, Math.min(28, clockAngle + clockAngVel * dt));

      renderChainAndClock(clockAngle);
      rafId = requestAnimationFrame(step);
    }

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !rafId) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(step);
      }
    });

    rafId = requestAnimationFrame(step);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    initWorkCoverTilt();
    initGSAPAnimations();
    initScrollButterfly();
    initHangingClock();
  });
})();

