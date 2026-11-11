/**
 * Luna's World — Main UI Interactions
 * Preloader, Navbar & Active Section Highlight, Scroll Progress, Mobile Menu,
 * Mailto Contact Form, Astra Chat Widget (with typing indicator), and Desktop Sparkle Trail.
 */

(() => {
  'use strict';

  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * 1. Preloader: gentle fade-out once page is ready.
   */
  function initPreloader() {
    const intro = document.querySelector('#moon-intro');
    if (!intro) return;

    if (prefersReducedMotion()) {
      intro.classList.add('is-done');
      return;
    }

    const dismiss = () => {
      intro.classList.add('is-done');
    };

    if (document.readyState === 'complete') {
      setTimeout(dismiss, 380);
    } else {
      window.addEventListener('load', () => setTimeout(dismiss, 380), { once: true });
      // Fallback safeguard in case an external image takes too long
      setTimeout(dismiss, 1400);
    }
  }

  /**
   * 2. Navbar frosted state, scroll progress bar, and active-section highlight.
   */
  function initNavigationAndProgress() {
    const topbar = document.querySelector('#topbar');
    const progressEl = document.querySelector('#scroll-progress');
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const links = Array.from(document.querySelectorAll('[data-nav-link]'));
    const sections = ['home', 'poetry', 'works', 'contact']
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    function setMenuOpen(open) {
      if (!navLinks || !menuToggle) return;
      navLinks.classList.toggle('is-open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      const icon = menuToggle.querySelector('.menu-toggle-icon');
      if (icon) icon.textContent = open ? '✕' : '☰';
    }

    if (menuToggle && navLinks) {
      menuToggle.addEventListener('click', () => {
        setMenuOpen(!navLinks.classList.contains('is-open'));
      });

      navLinks.addEventListener('click', (event) => {
        if (event.target.closest('a')) {
          setMenuOpen(false);
        }
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && navLinks.classList.contains('is-open')) {
          setMenuOpen(false);
          menuToggle.focus();
        }
      });
    }

    function setActiveLink(id) {
      links.forEach((link) => {
        const isMatch = link.dataset.navLink === id;
        link.classList.toggle('is-active', isMatch);
        if (isMatch) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    }

    function updateOnScroll() {
      const scrollY = window.scrollY || window.pageYOffset;

      if (topbar) {
        topbar.classList.toggle('is-scrolled', scrollY > 24);
      }

      if (progressEl) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;
        progressEl.style.transform = `scaleX(${ratio.toFixed(4)})`;
      }

      // Determine active section by viewport focus line
      const probeY = scrollY + window.innerHeight * 0.32;
      let currentId = 'home';
      for (const sec of sections) {
        if (probeY >= sec.offsetTop) {
          currentId = sec.id;
        }
      }
      if (window.innerHeight + scrollY >= document.documentElement.scrollHeight - 24) {
        currentId = 'contact';
      }
      setActiveLink(currentId);
    }

    window.addEventListener('scroll', updateOnScroll, { passive: true });
    window.addEventListener('resize', updateOnScroll, { passive: true });
    updateOnScroll();
  }

  /**
   * 3. Contact Form (preserves mailto behavior + adds gentle success animation).
   */
  function initContactForm() {
    const contactForm = document.querySelector('#contact-form');
    const formNote = document.querySelector('#form-note');
    const successBadge = document.querySelector('#form-success-badge');
    if (!contactForm) return;

    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const sender = document.querySelector('#email').value.trim();
      const message = document.querySelector('#message').value.trim();
      const subject = encodeURIComponent('A note for Luna');
      const body = encodeURIComponent(`${message}\n\nFrom: ${sender}`);

      if (formNote) formNote.textContent = 'Opening your email app...';
      if (successBadge) {
        successBadge.classList.add('is-visible');
        setTimeout(() => successBadge.classList.remove('is-visible'), 3600);
      }

      window.location.href = `mailto:daffini1908@gmail.com?subject=${subject}&body=${body}`;
    });
  }

  /**
   * 4. Astra Chat Widget (preserves keyword logic, adds typing indicator & smooth corner scale).
   */
  function initAstraChat() {
    const chatLauncher = document.querySelector('#chat-launcher');
    const chatPanel = document.querySelector('#chat-panel');
    const chatClose = document.querySelector('#chat-close');
    const chatInput = document.querySelector('#chat-input');
    const chatForm = document.querySelector('#chat-form');
    const chatMessages = document.querySelector('#chat-messages');

    if (!chatLauncher || !chatPanel || !chatForm || !chatMessages || !chatInput) return;

    function setChatOpen(isOpen) {
      chatPanel.classList.toggle('is-open', isOpen);
      chatPanel.setAttribute('aria-hidden', String(!isOpen));
      chatLauncher.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) {
        setTimeout(() => chatInput.focus(), 140);
      } else {
        chatLauncher.focus();
      }
    }

    chatLauncher.addEventListener('click', () => {
      setChatOpen(!chatPanel.classList.contains('is-open'));
    });

    if (chatClose) {
      chatClose.addEventListener('click', () => setChatOpen(false));
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && chatPanel.classList.contains('is-open')) {
        setChatOpen(false);
      }
    });

    function getAstraReply(question) {
      const normalized = question.toLowerCase();
      if (normalized.includes('poem') || normalized.includes('poetry')) {
        return 'Luna’s poetry shelf is getting ready for new work. Check back soon, or send Luna a note through the Contact section.';
      }
      if (
        normalized.includes('bloodline') ||
        normalized.includes('story') ||
        normalized.includes('work') ||
        normalized.includes('wattpad')
      ) {
        return 'You can find The Hidden Bloodline in the Works section, with a link to read it on Wattpad.';
      }
      if (
        normalized.includes('contact') ||
        normalized.includes('email') ||
        normalized.includes('collaborat')
      ) {
        return 'Luna would love to hear from you. Visit Contact to write to daffini1908@gmail.com or find her on Wattpad.';
      }
      return 'I can point you to Luna’s poetry, The Hidden Bloodline, or her contact details. What would you like to find?';
    }

    chatForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const question = chatInput.value.trim();
      if (!question) return;

      const userMessage = document.createElement('div');
      userMessage.className = 'chat-message user';
      userMessage.textContent = question;
      chatMessages.append(userMessage);
      chatInput.value = '';
      chatMessages.scrollTop = chatMessages.scrollHeight;

      const replyText = getAstraReply(question);

      if (prefersReducedMotion()) {
        const reply = document.createElement('div');
        reply.className = 'chat-message';
        reply.textContent = replyText;
        chatMessages.append(reply);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return;
      }

      // Show typing dots indicator briefly before Astra replies
      const typing = document.createElement('div');
      typing.className = 'chat-message is-typing';
      typing.setAttribute('aria-label', 'Astra is typing');
      typing.innerHTML =
        '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
      chatMessages.append(typing);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      setTimeout(() => {
        typing.remove();
        const reply = document.createElement('div');
        reply.className = 'chat-message';
        reply.textContent = replyText;
        chatMessages.append(reply);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 480);
    });
  }

  /**
   * 5. Optional subtle sparkle cursor trail (Desktop fine pointer only).
   */
  function initSparkleTrail() {
    const canvas = document.querySelector('#sparkle-layer');
    if (!canvas || prefersReducedMotion()) return;
    if (!window.matchMedia('(pointer: fine)').matches || window.innerWidth < 768) {
      canvas.style.display = 'none';
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const particles = [];
    let rafId = null;
    let lastSpawn = 0;

    function spawnSparkle(x, y) {
      if (particles.length > 40) particles.shift();
      particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 0.45,
        vy: -Math.random() * 0.65 - 0.15,
        size: Math.random() * 2.4 + 1.4,
        alpha: 0.78,
        decay: Math.random() * 0.018 + 0.018
      });
      if (!rafId) {
        rafId = requestAnimationFrame(render);
      }
    }

    function render() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const isDark = document.documentElement.dataset.theme === 'dark';
      const color = isDark ? '228, 189, 145' : '155, 114, 72';

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = `rgba(${color}, ${p.alpha.toFixed(3)})`;
        ctx.beginPath();
        // 4-point subtle star glint
        const r = p.size;
        ctx.moveTo(0, -r * 1.4);
        ctx.quadraticCurveTo(0, 0, r * 1.4, 0);
        ctx.quadraticCurveTo(0, 0, 0, r * 1.4);
        ctx.quadraticCurveTo(0, 0, -r * 1.4, 0);
        ctx.quadraticCurveTo(0, 0, 0, -r * 1.4);
        ctx.fill();
        ctx.restore();
      }

      if (particles.length > 0) {
        rafId = requestAnimationFrame(render);
      } else {
        rafId = null;
      }
    }

    window.addEventListener(
      'pointermove',
      (e) => {
        const now = performance.now();
        if (now - lastSpawn < 28) return;
        lastSpawn = now;
        spawnSparkle(e.clientX, e.clientY);
      },
      { passive: true }
    );
  }

  document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initNavigationAndProgress();
    initContactForm();
    initAstraChat();
    initSparkleTrail();
  });
})();

