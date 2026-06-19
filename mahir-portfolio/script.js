/* ==========================================================================
   Mahir Sabotic — portfolio motion system
   GSAP + ScrollTrigger + SplitText + Lenis + Three.js
   Every feature degrades gracefully if a library fails to load.
   ========================================================================== */

(() => {
  'use strict';

  const body = document.body;
  const docEl = document.documentElement;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  const hasGsap = typeof window.gsap !== 'undefined';
  const hasST = typeof window.ScrollTrigger !== 'undefined';
  const hasSplit = typeof window.SplitText !== 'undefined';
  const hasLenis = typeof window.Lenis !== 'undefined';
  const hasThree = typeof window.THREE !== 'undefined';
  const motionOK = hasGsap && hasST && !prefersReduced;

  if (hasGsap && hasST) gsap.registerPlugin(ScrollTrigger);
  if (hasGsap && hasSplit) gsap.registerPlugin(SplitText);

  function readStoredScrollY() {
    try {
      return Number.parseFloat(sessionStorage.getItem('portfolioScrollY') || '0') || 0;
    } catch (err) {
      return 0;
    }
  }

  function storeCurrentScrollY() {
    try {
      sessionStorage.setItem('portfolioScrollY', String(Math.round(window.scrollY)));
    } catch (err) {
      // Storage can be unavailable in private or restricted browser contexts.
    }
  }

  const restoredScrollY = motionOK && !window.location.hash
    ? Math.max(window.scrollY, readStoredScrollY())
    : 0;
  let pendingScrollRestore = restoredScrollY > 1;

  if (motionOK && 'scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  if (pendingScrollRestore) {
    window.scrollTo(0, 0);
  }

  window.addEventListener('pagehide', storeCurrentScrollY);
  window.addEventListener('beforeunload', storeCurrentScrollY);

  const windowLoaded = new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve, { once: true });
  });
  const fontsReady = (document.fonts && document.fonts.ready)
    ? document.fonts.ready.catch(() => {})
    : Promise.resolve();
  const imagesReady = Promise.all(
    [...document.images]
      .filter((img) => !img.complete)
      .map((img) => new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      })),
  );

  /* ------------------------------------------------------ smooth scroll */
  let lenis = null;
  if (motionOK && hasLenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(selector) {
    const target = document.querySelector(selector);
    if (!target) return;
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    } else {
      target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
    }
  }

  function jumpToScroll(y) {
    const max = hasST ? ScrollTrigger.maxScroll(window) : docEl.scrollHeight - window.innerHeight;
    const nextY = Math.max(0, Math.min(y, max));
    if (lenis) {
      lenis.scrollTo(nextY, { immediate: true, force: true });
    } else {
      window.scrollTo(0, nextY);
    }
    onNativeScroll();
  }

  function refreshScrollLayout({ restore = false } = {}) {
    if (!motionOK) return;
    ScrollTrigger.refresh(true);

    if (!restore || !pendingScrollRestore) return;

    requestAnimationFrame(() => {
      jumpToScroll(restoredScrollY);
      ScrollTrigger.update();
      pendingScrollRestore = false;
    });
  }

  /* -------------------------------------------------------- navigation */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = [...document.querySelectorAll('.nav-link')];

  navToggle?.addEventListener('click', () => {
    const isOpen = body.classList.toggle('menu-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      event.preventDefault();
      body.classList.remove('menu-open');
      navToggle?.setAttribute('aria-expanded', 'false');
      scrollToTarget(hash);
    });
  });

  const sections = [...document.querySelectorAll('main section[id]')];
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  }, { threshold: 0.18, rootMargin: '-10% 0px -35% 0px' });
  sections.forEach((section) => navObserver.observe(section));

  /* ----------------------------------------- scroll progress + header */
  function onNativeScroll() {
    const max = Math.max(1, docEl.scrollHeight - window.innerHeight);
    const progress = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
    docEl.style.setProperty('--scroll', `${progress}%`);
    body.classList.toggle('is-scrolled', window.scrollY > 42);
  }
  window.addEventListener('scroll', onNativeScroll, { passive: true });
  onNativeScroll();

  /* ------------------------------------------------------------ loader */
  const loader = document.querySelector('.page-loader');
  const loaderCount = document.querySelector('[data-loader-count]');

  function heroIntro() {
    if (!hasGsap) return null;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.1 } });
    const lines = document.querySelectorAll('.h-line');

    if (hasSplit && lines.length) {
      const split = new SplitText(lines, { type: 'chars' });
      tl.from(split.chars, {
        yPercent: 115,
        rotate: 9,
        opacity: 0,
        filter: 'blur(8px)',
        stagger: 0.038,
        duration: 1.25,
      }, 0.05);
    } else {
      tl.from('.hero-title-block h1', { y: 60, opacity: 0 }, 0.05);
    }

    tl.from('.hero-title-block .eyebrow', { y: 24, opacity: 0, duration: 0.8 }, 0.2)
      .fromTo('.hero-portrait',
        { clipPath: 'inset(44% 44% 44% 44% round 60px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1.25, ease: 'expo.inOut', clearProps: 'clipPath' }, 0)
      .from('.hero-portrait img', { scale: 1.45, duration: 1.4 }, 0.1)
      .from('.hero-meta', { y: 26, opacity: 0, stagger: 0.08, duration: 0.9, clearProps: 'transform,opacity' }, 0.5)
      .from('.hero-badge', { scale: 0.4, opacity: 0, duration: 0.9, ease: 'back.out(1.6)', clearProps: 'transform,opacity' }, 0.85)
      .from('.hero-scroll', { y: 18, opacity: 0, duration: 0.8, clearProps: 'transform,opacity' }, 0.9)
      .from('.nav-pill', { y: -26, opacity: 0, duration: 0.9, clearProps: 'transform,opacity' }, 0.7);
    return tl;
  }

  if (!motionOK || !loader || !loaderCount) {
    windowLoaded.then(() => body.classList.add('is-loaded'));
  } else {
    body.classList.add('is-locked');
    if (lenis) lenis.stop();

    const num = { v: 0 };
    const counting = gsap.to(num, {
      v: 100,
      duration: 1.7,
      ease: 'power2.inOut',
      onUpdate() { loaderCount.textContent = String(Math.round(num.v)).padStart(3, '0'); },
    });

    Promise.all([windowLoaded, fontsReady, counting.then()]).then(() => {
      const tl = gsap.timeline({
        onComplete() {
          loader.style.visibility = 'hidden';
          body.classList.add('is-loaded');
          body.classList.remove('is-locked');
          if (lenis) lenis.start();
          refreshScrollLayout({ restore: true });
        },
      });
      tl.to('.loader-inner', { yPercent: -130, opacity: 0, duration: 0.55, ease: 'power2.in' })
        .to(loaderCount, { opacity: 0, duration: 0.35, ease: 'power1.out' }, '<')
        .to(loader, { yPercent: -100, duration: 0.95, ease: 'power4.inOut' }, '-=0.18')
        .add(heroIntro(), '-=0.6');
    });
  }

  /* -------------------------------------------------- hero scroll scrub */
  if (motionOK) {
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: () => `+=${window.innerHeight * 0.85}`,
      scrub: 0.4,
      onUpdate(self) { docEl.style.setProperty('--hero-progress', self.progress.toFixed(4)); },
    });
  }

  /* ------------------------------------------------- hero mouse parallax */
  if (motionOK && finePointer) {
    const hero = document.querySelector('.hero');
    const heroTitle = document.querySelector('.hero-title-block h1');
    const portraitImg = document.querySelector('.hero-portrait img');
    if (hero && heroTitle && portraitImg) {
      gsap.set(portraitImg, { scale: 1.08 });
      const titleX = gsap.quickTo(heroTitle, 'x', { duration: 0.9, ease: 'power3' });
      const titleY = gsap.quickTo(heroTitle, 'y', { duration: 0.9, ease: 'power3' });
      const imgX = gsap.quickTo(portraitImg, 'x', { duration: 1.1, ease: 'power3' });
      const imgY = gsap.quickTo(portraitImg, 'y', { duration: 1.1, ease: 'power3' });
      hero.addEventListener('pointermove', (event) => {
        const nx = (event.clientX / window.innerWidth - 0.5) * 2;
        const ny = (event.clientY / window.innerHeight - 0.5) * 2;
        titleX(nx * -16);
        titleY(ny * -10);
        imgX(nx * 7);
        imgY(ny * 5);
      });
    }
  }

  // Add continuous floating motion to the portrait for extra energy
      gsap.to('.hero-portrait', {
        y: -18,
        rotationZ: 1.5,
        duration: 4.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });

  /* --------------------------------------------- background depth layers */
  const depthEls = [...document.querySelectorAll('[data-depth]')];
  if (motionOK && depthEls.length) {
    depthEls.forEach((el) => { el._depth = Number(el.dataset.depth) || 0; });
    const proxy = { y: 0 };
    gsap.to(proxy, {
      y: () => ScrollTrigger.maxScroll(window),
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 1.2, invalidateOnRefresh: true },
      onUpdate() {
        depthEls.forEach((el) => el.style.setProperty('--move-y', (proxy.y * el._depth).toFixed(1)));
      },
    });
  }

  /* --------------------------------------------------- generic reveals */
  if (motionOK) {
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      gsap.from(el, {
        y: 54,
        opacity: 0,
        duration: 1.15,
        ease: 'expo.out',
        delay: parseFloat(el.dataset.delay || 0),
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });
  }

  /* --------------------------------------------- split heading reveals */
  function initHeadingReveals() {
    document.querySelectorAll('[data-split]').forEach((el) => {
      let targets = null;
      if (hasSplit) {
        try {
          const split = new SplitText(el, { type: 'lines,words', wordsClass: 'split-word' });
          targets = split.words;
        } catch (err) { targets = null; }
      }
      if (targets && targets.length) {
        gsap.from(targets, {
          yPercent: 110,
          opacity: 0,
          rotate: 2.5,
          stagger: 0.024,
          duration: 1.05,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        });
      } else {
        gsap.from(el, {
          y: 44,
          opacity: 0,
          duration: 1.1,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        });
      }
    });
  }
  if (motionOK) {
    Promise.all([windowLoaded, fontsReady]).then(() => {
      initHeadingReveals();
      refreshScrollLayout();
    });
  }

  /* --------------------------------------------- work: horizontal rail */
  const railTrack = document.querySelector('[data-rail-track]');
  const railBar = document.querySelector('[data-rail-progress]');

  if (motionOK && railTrack) {
    const mm = gsap.matchMedia();

    mm.add('(min-width: 900px)', () => {
      body.classList.add('has-rail');
      const distance = () => Math.max(0, railTrack.scrollWidth - docEl.clientWidth);

      const rail = gsap.to(railTrack, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: '.work-pin',
          start: 'top top',
          end: () => `+=${distance()}`,
          scrub: 1,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 1,
          onUpdate(self) {
            if (railBar) railBar.style.transform = `scaleX(${self.progress.toFixed(4)})`;
          },
        },
      });

      // Panels scale in as they arrive from the right
      gsap.utils.toArray('.work-panel').forEach((panel) => {
        gsap.fromTo(panel,
          { scale: 0.92, opacity: 0.45 },
          {
            scale: 1,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: panel,
              containerAnimation: rail,
              start: 'left 95%',
              end: 'left 55%',
              scrub: true,
            },
          });
      });

      // Parallax inside each media frame
      gsap.utils.toArray('.panel-media img').forEach((img) => {
        gsap.fromTo(img,
          { xPercent: -5 },
          {
            xPercent: 5,
            ease: 'none',
            scrollTrigger: {
              trigger: img.closest('.work-panel'),
              containerAnimation: rail,
              start: 'left right',
              end: 'right left',
              scrub: true,
            },
          });
      });

      // Index numbers drift at their own speed
      gsap.utils.toArray('.panel-index').forEach((num) => {
        gsap.fromTo(num,
          { x: 70 },
          {
            x: -70,
            ease: 'none',
            scrollTrigger: {
              trigger: num.closest('.work-panel'),
              containerAnimation: rail,
              start: 'left right',
              end: 'right left',
              scrub: true,
            },
          });
      });

      return () => body.classList.remove('has-rail');
    });

    mm.add('(max-width: 899px)', () => {
      gsap.utils.toArray('.work-panel').forEach((panel) => {
        gsap.from(panel, {
          y: 64,
          opacity: 0,
          duration: 1.1,
          ease: 'expo.out',
          clearProps: 'transform,opacity',
          scrollTrigger: { trigger: panel, start: 'top 90%', once: true },
        });
      });
    });
  }

  /* ------------------------------------------------------------ marquee */
  const marqueeTrack = document.querySelector('[data-marquee]');
  if (hasGsap && !prefersReduced && marqueeTrack) {
    body.classList.add('gsap-marquee');
    const marqueeTween = gsap.to(marqueeTrack, { xPercent: -50, ease: 'none', duration: 26, repeat: -1 });
    if (lenis) {
      let boost = 1;
      lenis.on('scroll', (e) => {
        boost = 1 + Math.min(3.5, Math.abs(e.velocity || 0) * 0.06);
      });
      gsap.ticker.add(() => {
        marqueeTween.timeScale(gsap.utils.interpolate(marqueeTween.timeScale(), boost, 0.08));
        boost = gsap.utils.interpolate(boost, 1, 0.04);
      });
    }
  }

  /* ------------------------------------------------------ stat counters */
  document.querySelectorAll('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count);
    if (Number.isNaN(end)) return;
    if (!motionOK) { el.textContent = String(end); return; }
    el.textContent = '0';
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end,
      duration: 1.9,
      ease: 'power3.out',
      onUpdate() { el.textContent = String(Math.round(obj.v)); },
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  /* ------------------------------------------------------ rotating badge */
  if (hasGsap && !prefersReduced) {
    const rotor = document.querySelector('.badge-rotor');
    if (rotor) gsap.to(rotor, { rotation: 360, duration: 16, repeat: -1, ease: 'none' });
  }

  /* ------------------------------------------------------ custom cursor */
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');
  const cursorLabel = document.querySelector('[data-cursor-label]');

  if (finePointer && hasGsap && !prefersReduced && cursorDot && cursorRing) {
    const dotX = gsap.quickSetter(cursorDot, 'x', 'px');
    const dotY = gsap.quickSetter(cursorDot, 'y', 'px');
    const ringX = gsap.quickTo(cursorRing, 'x', { duration: 0.35, ease: 'power3' });
    const ringY = gsap.quickTo(cursorRing, 'y', { duration: 0.35, ease: 'power3' });

    window.addEventListener('pointermove', (event) => {
      body.classList.add('has-cursor');
      dotX(event.clientX);
      dotY(event.clientY);
      ringX(event.clientX);
      ringY(event.clientY);
    }, { passive: true });

    document.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('pointerenter', () => body.classList.add('cursor-active'));
      el.addEventListener('pointerleave', () => body.classList.remove('cursor-active'));
    });

    document.querySelectorAll('[data-cursor]').forEach((el) => {
      el.addEventListener('pointerenter', () => {
        if (cursorLabel) cursorLabel.textContent = el.dataset.cursor || '';
        body.classList.add('cursor-view');
      });
      el.addEventListener('pointerleave', () => body.classList.remove('cursor-view'));
    });
  }

  /* --------------------------------------------------- magnetic elements */
  if (finePointer && hasGsap && !prefersReduced) {
    document.querySelectorAll('.magnetic, .send-button').forEach((item) => {
      item.addEventListener('pointermove', (event) => {
        const rect = item.getBoundingClientRect();
        const dx = event.clientX - rect.left - rect.width / 2;
        const dy = event.clientY - rect.top - rect.height / 2;
        gsap.to(item, { x: dx * 0.22, y: dy * 0.22, duration: 0.5, ease: 'power3.out' });
      });
      item.addEventListener('pointerleave', () => {
        gsap.to(item, {
          x: 0,
          y: 0,
          duration: 0.7,
          ease: 'elastic.out(1, 0.45)',
          onComplete() { gsap.set(item, { clearProps: 'transform' }); },
        });
      });
    });
  }

  /* ----------------------------------------------------------- 3D tilt */
  document.querySelectorAll('.tilt-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      if (window.innerWidth < 900 || prefersReduced) return;
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateX = ((y / rect.height) - 0.5) * -8;
      const rotateY = ((x / rect.width) - 0.5) * 10;
      card.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });

  /* ------------------------------------------------------- contact form */
  const contactForm = document.querySelector('.contact-form');
  contactForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = contactForm.querySelector('.form-status');
    if (status) status.textContent = 'Message preview saved. Connect the form to a backend before publishing.';
    contactForm.reset();
  });

  /* ----------------------------------------------------------- AI chat */
  const chat = document.querySelector('.ai-chat');
  const chatToggle = document.querySelector('.ai-chat-toggle');
  const chatClose = document.querySelector('.ai-chat-close');
  const chatForm = document.querySelector('[data-chat-form]');
  const chatInput = document.getElementById('ai-chat-input');
  const chatMessages = document.querySelector('[data-chat-messages]');
  const chatStatus = document.querySelector('[data-chat-status]');
  const chatHistory = [];

  function setChatOpen(isOpen) {
    if (!chat || !chatToggle) return;
    chat.classList.toggle('is-open', isOpen);
    chatToggle.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) window.setTimeout(() => chatInput?.focus(), 120);
  }

  function addChatMessage(content, role) {
    if (!chatMessages) return null;
    const message = document.createElement('p');
    message.className = `ai-message ai-message-${role}`;
    message.textContent = content;
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return message;
  }

  function setChatStatus(text) {
    if (chatStatus) chatStatus.textContent = text;
  }

  chatToggle?.addEventListener('click', () => {
    setChatOpen(!chat?.classList.contains('is-open'));
  });

  chatClose?.addEventListener('click', () => setChatOpen(false));

  chatInput?.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = `${Math.min(chatInput.scrollHeight, 120)}px`;
  });

  chatForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!chatInput) return;

    const text = chatInput.value.trim();
    if (!text) return;

    const previousMessages = chatHistory.slice(-8);
    addChatMessage(text, 'user');
    chatHistory.push({ role: 'user', content: text });
    chatInput.value = '';
    chatInput.style.height = 'auto';
    chatInput.disabled = true;
    chatForm.querySelector('button')?.setAttribute('disabled', 'true');
    setChatStatus('Thinking...');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          messages: previousMessages,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'The AI assistant is not available right now.');
      }

      const reply = data.reply || 'I could not generate a reply right now.';
      addChatMessage(reply, 'bot');
      chatHistory.push({ role: 'assistant', content: reply });
      setChatStatus('');
    } catch (error) {
      addChatMessage(error.message || 'The AI assistant is not available right now.', 'bot');
      setChatStatus('Check the API key setup on Vercel.');
    } finally {
      chatInput.disabled = false;
      chatForm.querySelector('button')?.removeAttribute('disabled');
      chatInput.focus();
    }
  });

  /* -------------------------------------------------------- local time */
  const timeEl = document.querySelector('[data-time]');
  if (timeEl) {
    let formatter = null;
    try {
      formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Skopje',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch (err) { formatter = null; }
    const tick = () => {
      timeEl.textContent = formatter ? formatter.format(new Date()) : new Date().toLocaleTimeString();
    };
    tick();
    setInterval(tick, 1000);
  }

  /* --------------------------------------------------- WebGL particles */
  function initThree() {
    if (!hasThree) return;
    const canvas = document.getElementById('webgl');
    if (!canvas) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    } catch (err) {
      return; // WebGL unavailable
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setSize(width, height, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 60);
    camera.position.z = 9;

    const sprite = (() => {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.35, 'rgba(255,255,255,.8)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();

    function makeCloud(count, size, color, opacity, spread) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * spread[0];
        positions[i * 3 + 1] = (Math.random() - 0.5) * spread[1];
        positions[i * 3 + 2] = (Math.random() - 0.5) * spread[2];
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        size,
        map: sprite,
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      return new THREE.Points(geometry, material);
    }

    const isSmall = width < 760;
    const group = new THREE.Group();
    group.add(makeCloud(isSmall ? 450 : 1100, 0.075, 0xffffff, 0.5, [22, 14, 12]));
    group.add(makeCloud(isSmall ? 120 : 260, 0.14, 0xd7c36f, 0.55, [20, 12, 10]));
    scene.add(group);

    if (prefersReduced) {
      renderer.render(scene, camera);
      return;
    }

    let mouseX = 0;
    let mouseY = 0;
    let easedX = 0;
    let easedY = 0;
    let scrollFactor = 0;
    let running = !document.hidden;

    window.addEventListener('pointermove', (event) => {
      mouseX = (event.clientX / width - 0.5) * 2;
      mouseY = (event.clientY / height - 0.5) * 2;
    }, { passive: true });

    window.addEventListener('resize', () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    });

    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
    });

    const clock = new THREE.Clock();
    (function tick() {
      requestAnimationFrame(tick);
      if (!running) return;
      const t = clock.getElapsedTime();
      easedX += (mouseX - easedX) * 0.03;
      easedY += (mouseY - easedY) * 0.03;
      const maxScroll = Math.max(1, docEl.scrollHeight - height);
      scrollFactor += ((window.scrollY / maxScroll) - scrollFactor) * 0.06;
      group.rotation.y = t * 0.02 + easedX * 0.22;
      group.rotation.x = easedY * 0.14 + scrollFactor * 0.5;
      group.position.y = scrollFactor * 2.2;
      renderer.render(scene, camera);
    })();
  }
  initThree();

  /* ------------------------------------------------------ final refresh */
  if (motionOK) {
    Promise.all([windowLoaded, fontsReady, imagesReady]).then(() => refreshScrollLayout({ restore: true }));
    window.addEventListener('pageshow', () => {
      requestAnimationFrame(() => refreshScrollLayout({ restore: true }));
    });
  }
})();
