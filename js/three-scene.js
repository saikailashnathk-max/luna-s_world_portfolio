/**
 * Luna's World — 3D Scenes (Three.js)
 * 1. Hero: Procedurally built glowing 3D crescent moon + twinkling starfield (800-1500 particles)
 *    with mouse parallax, scroll drift/shrink, theme adaptation, offscreen pause, and CSS fallback.
 * 2. Poetry: Subtle, low-opacity floating 3D book, pages, and quill in the background.
 */

(() => {
  'use strict';

  const SCENE_CONFIG = {
    desktopStarCount: 1200,
    mobileStarCount: 450,
    maxPixelRatio: 2,
    moonFloatAmp: 0.16,
    moonFloatSpeed: 0.75,
    moonSpinSpeed: 0.22,
    mouseParallaxStrength: 0.35,
    poetryElementOpacity: 0.42
  };

  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isLowPowerOrMobile = () =>
    window.innerWidth < 768 ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4);

  const isDarkTheme = () => document.documentElement.dataset.theme === 'dark';

  /**
   * Builds a clean CSS starfield fallback if WebGL is unavailable.
   */
  function activateWebGLFallback(stageEl, fallbackContainer) {
    if (stageEl) stageEl.classList.add('is-webgl-fallback');
    if (!fallbackContainer || fallbackContainer.childElementCount > 0) return;

    const moon = document.createElement('div');
    moon.className = 'css-moon-fallback';
    fallbackContainer.appendChild(moon);

    const count = isLowPowerOrMobile() ? 36 : 75;
    for (let i = 0; i < count; i++) {
      const star = document.createElement('span');
      star.className = 'css-star';
      const size = (Math.random() * 2.5 + 1.2).toFixed(1);
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${(Math.random() * 100).toFixed(2)}%`;
      star.style.top = `${(Math.random() * 100).toFixed(2)}%`;
      star.style.setProperty('--twinkle-dur', `${(Math.random() * 3.5 + 2.5).toFixed(2)}s`);
      star.style.setProperty('--twinkle-delay', `${(Math.random() * 3).toFixed(2)}s`);
      fallbackContainer.appendChild(star);
    }
  }

  /**
   * Creates a soft radial glow texture on an offscreen 2D canvas for the moon halo.
   */
  function createGlowTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(size / 2, size / 2, 6, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(228, 189, 145, 0.55)');
    grad.addColorStop(0.35, 'rgba(228, 189, 145, 0.22)');
    grad.addColorStop(0.7, 'rgba(228, 189, 145, 0.05)');
    grad.addColorStop(1, 'rgba(228, 189, 145, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Procedurally builds a smooth, beveled 3D crescent moon geometry.
   */
  function createCrescentGeometry() {
    const R = 1.26;
    const r = 1.02;
    const d = 0.62;

    // Exact circle-circle intersection so the outline is watertight
    const ix = (R * R - r * r + d * d) / (2 * d);
    const iy = Math.sqrt(Math.max(0, R * R - ix * ix));
    const a1 = Math.atan2(iy, ix);
    const a2 = Math.atan2(iy, ix - d);

    const shape = new THREE.Shape();
    shape.absarc(0, 0, R, a1, -a1, false);
    shape.absarc(d, 0, r, -a2, a2, true);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.24,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.065,
      bevelSegments: 5,
      curveSegments: 48
    });
    geometry.center();
    return geometry;
  }

  /**
   * Initializes the Hero 3D Crescent Moon & Twinkling Starfield.
   */
  function initHeroScene() {
    const heroStage = document.querySelector('#home');
    const canvas = document.querySelector('#hero-canvas');
    const fallbackContainer = document.querySelector('#hero-starfield-fallback');

    if (!heroStage || !canvas) return;
    if (typeof THREE === 'undefined') {
      activateWebGLFallback(heroStage, fallbackContainer);
      return;
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch {
      activateWebGLFallback(heroStage, fallbackContainer);
      return;
    }

    if (!renderer || !renderer.getContext()) {
      activateWebGLFallback(heroStage, fallbackContainer);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 8.2);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, SCENE_CONFIG.maxPixelRatio));

    // Lighting for sculpted moon bevels
    const ambientLight = new THREE.AmbientLight(0xfff5e4, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffe0b5, 1.15);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xdfd6b9, 0.55);
    rimLight.position.set(-5, -3, 3);
    scene.add(rimLight);

    // Celestial Backdrop Group (smoothly transitions between Sun in light mode & Crescent Moon in dark mode)
    const moonGroup = new THREE.Group();

    // 1. 3D Crescent Moon (Dark Theme)
    const moonGeometry = createCrescentGeometry();
    const moonMaterial = new THREE.MeshStandardMaterial({
      color: 0xe4bd91,
      emissive: 0xc2935c,
      emissiveIntensity: 0.22,
      roughness: 0.48,
      metalness: 0.12,
      transparent: true,
      opacity: isDarkTheme() ? 0.24 : 0
    });
    const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    moonMesh.rotation.z = 0.36;
    moonGroup.add(moonMesh);

    const glowTexture = createGlowTexture();
    const haloMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      opacity: isDarkTheme() ? 0.36 : 0,
      depthWrite: false
    });
    const haloSprite = new THREE.Sprite(haloMaterial);
    haloSprite.scale.set(5.4, 5.4, 1);
    haloSprite.position.set(-0.15, 0, -0.5);
    moonGroup.add(haloSprite);

    // 2. 3D Sun with Corona Rays & Aura Ring (Light Theme)
    const sunGroup = new THREE.Group();
    const sunCoreGeo = new THREE.SphereGeometry(1.04, 42, 32);
    const sunMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8b263,
      emissive: 0xd98f36,
      emissiveIntensity: 0.3,
      roughness: 0.42,
      metalness: 0.08,
      transparent: true,
      opacity: isDarkTheme() ? 0 : 0.24
    });
    const sunCore = new THREE.Mesh(sunCoreGeo, sunMaterial);
    sunCore.scale.set(1, 1, 0.46);
    sunGroup.add(sunCore);

    const sunRingGeo = new THREE.TorusGeometry(1.36, 0.016, 12, 64);
    const sunRingMaterial = new THREE.MeshBasicMaterial({
      color: 0xd49448,
      transparent: true,
      opacity: isDarkTheme() ? 0 : 0.18
    });
    const sunRing = new THREE.Mesh(sunRingGeo, sunRingMaterial);
    sunGroup.add(sunRing);

    const sunCoronaGroup = new THREE.Group();
    const sunRayMaterial = new THREE.MeshBasicMaterial({
      color: 0xdca154,
      transparent: true,
      opacity: isDarkTheme() ? 0 : 0.22,
      side: THREE.DoubleSide
    });
    const rayShape = new THREE.Shape();
    rayShape.moveTo(-0.075, 0);
    rayShape.lineTo(0, 0.46);
    rayShape.lineTo(0.075, 0);
    rayShape.closePath();
    const rayGeo = new THREE.ShapeGeometry(rayShape);

    const rayCount = 12;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const ray = new THREE.Mesh(rayGeo, sunRayMaterial);
      const radius = i % 2 === 0 ? 1.24 : 1.18;
      ray.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, -0.05);
      ray.rotation.z = angle - Math.PI / 2;
      ray.scale.setScalar(i % 2 === 0 ? 1.05 : 0.72);
      sunCoronaGroup.add(ray);
    }
    sunGroup.add(sunCoronaGroup);

    const sunHaloMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xf7cf86,
      transparent: true,
      opacity: isDarkTheme() ? 0 : 0.42,
      depthWrite: false
    });
    const sunHalo = new THREE.Sprite(sunHaloMaterial);
    sunHalo.scale.set(5.8, 5.8, 1);
    sunHalo.position.set(0, 0, -0.5);
    sunGroup.add(sunHalo);

    moonGroup.add(sunGroup);
    scene.add(moonGroup);

    // Starfield (800-1500 particles on desktop, scaled down on mobile/low-power)
    const starCount = isLowPowerOrMobile()
      ? SCENE_CONFIG.mobileStarCount
      : SCENE_CONFIG.desktopStarCount;

    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const phases = new Float32Array(starCount);
    const speeds = new Float32Array(starCount);
    const colorMix = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 18;
      positions[i3 + 1] = (Math.random() - 0.5) * 11;
      positions[i3 + 2] = (Math.random() - 0.5) * 8 - 2;
      sizes[i] = Math.random() * 16 + 6;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = Math.random() * 1.4 + 0.6;
      colorMix[i] = Math.random();
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    starGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    starGeometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    starGeometry.setAttribute('aColorMix', new THREE.BufferAttribute(colorMix, 1));

    const getPaletteColors = (dark) => ({
      colorA: new THREE.Color(dark ? 0xf7ebd9 : 0x6b574a),
      colorB: new THREE.Color(dark ? 0xe4bd91 : 0xb5895a),
      colorC: new THREE.Color(dark ? 0xa5a17a : 0x6d6f3a)
    });

    const initialColors = getPaletteColors(isDarkTheme());

    const starMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, SCENE_CONFIG.maxPixelRatio) },
        uColorA: { value: initialColors.colorA },
        uColorB: { value: initialColors.colorB },
        uColorC: { value: initialColors.colorC },
        uOpacityScale: { value: isDarkTheme() ? 0.88 : 0.62 }
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        attribute float aSpeed;
        attribute float aColorMix;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vAlpha;
        varying float vColorMix;

        void main() {
          vec3 pos = position;
          pos.y += sin(uTime * 0.14 * aSpeed + aPhase) * 0.18;
          pos.x += cos(uTime * 0.10 * aSpeed + aPhase) * 0.14;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aSize * uPixelRatio * (5.0 / -mvPosition.z);

          float twinkle = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * aSpeed + aPhase));
          vAlpha = twinkle;
          vColorMix = aColorMix;
        }
      `,
      fragmentShader: `
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        uniform float uOpacityScale;
        varying float vAlpha;
        varying float vColorMix;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float soft = smoothstep(0.5, 0.04, dist);
          vec3 col = vColorMix < 0.5
            ? mix(uColorA, uColorB, vColorMix * 2.0)
            : mix(uColorB, uColorC, (vColorMix - 0.5) * 2.0);

          gl_FragColor = vec4(col, soft * vAlpha * uOpacityScale);
        }
      `
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // Responsive sizing & moon anchor centered behind the left-side hero text
    let baseMoonPos = { x: -2.45, y: 0.05 };
    let baseMoonScale = 2.08;
    function updateSize() {
      const width = heroStage.clientWidth || window.innerWidth;
      const height = heroStage.clientHeight || 640;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      const pr = Math.min(window.devicePixelRatio || 1, SCENE_CONFIG.maxPixelRatio);
      renderer.setPixelRatio(pr);
      starMaterial.uniforms.uPixelRatio.value = pr;

      if (width < 760) {
        baseMoonPos = { x: 0, y: 1.15 };
        baseMoonScale = 1.42;
      } else if (width < 1040) {
        baseMoonPos = { x: -1.75, y: 0.08 };
        baseMoonScale = 1.72;
      } else {
        baseMoonPos = { x: -2.45, y: 0.05 };
        baseMoonScale = 2.08;
      }
      moonGroup.scale.setScalar(baseMoonScale);
    }
    updateSize();
    window.addEventListener('resize', updateSize, { passive: true });

    // Smooth theme transition state: 0 = Light (Sun), 1 = Dark (Moon)
    let targetMorph = isDarkTheme() ? 1 : 0;
    let currentMorph = targetMorph;
    const lightPalette = getPaletteColors(false);
    const darkPalette = getPaletteColors(true);

    // Theme adaptation listener (triggers smooth Sun <-> Moon transition)
    window.addEventListener('luna:themechange', (event) => {
      const dark = event.detail && event.detail.theme === 'dark';
      targetMorph = dark ? 1 : 0;
      if (prefersReducedMotion()) {
        currentMorph = targetMorph;
        renderFrame(0);
      }
    });

    // Pointer parallax state (desktop fine pointer only)
    const pointer = { x: 0, y: 0, currentX: 0, currentY: 0 };
    if (window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener(
        'pointermove',
        (e) => {
          pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
          pointer.y = -(e.clientY / window.innerHeight - 0.5) * 2;
        },
        { passive: true }
      );
    }

    // Scroll progress across the hero (moon drifts & shrinks gently)
    let scrollProgress = 0;
    function updateHeroScroll() {
      const rect = heroStage.getBoundingClientRect();
      const total = Math.max(rect.height, 1);
      scrollProgress = Math.min(Math.max(-rect.top / total, 0), 1);
    }
    window.addEventListener('scroll', updateHeroScroll, { passive: true });
    updateHeroScroll();

    // Render loop with IntersectionObserver offscreen pause
    let rafId = null;
    let isVisible = true;
    const clock = new THREE.Clock();

    function renderFrame(elapsed) {
      // Smooth camera sway toward pointer
      pointer.currentX += (pointer.x - pointer.currentX) * 0.045;
      pointer.currentY += (pointer.y - pointer.currentY) * 0.045;

      camera.position.x = pointer.currentX * SCENE_CONFIG.mouseParallaxStrength;
      camera.position.y = pointer.currentY * (SCENE_CONFIG.mouseParallaxStrength * 0.7);
      camera.lookAt(0, 0, 0);

      // Smooth Sun <-> Moon transition on theme toggle
      if (Math.abs(targetMorph - currentMorph) > 0.001) {
        currentMorph += (targetMorph - currentMorph) * 0.055;
      } else {
        currentMorph = targetMorph;
      }
      const moonVis = currentMorph;
      const sunVis = 1 - currentMorph;

      // Interpolate starfield palette & intensity smoothly
      starMaterial.uniforms.uColorA.value.lerpColors(lightPalette.colorA, darkPalette.colorA, moonVis);
      starMaterial.uniforms.uColorB.value.lerpColors(lightPalette.colorB, darkPalette.colorB, moonVis);
      starMaterial.uniforms.uColorC.value.lerpColors(lightPalette.colorC, darkPalette.colorC, moonVis);
      starMaterial.uniforms.uOpacityScale.value = 0.56 + moonVis * 0.32;

      // Celestial backdrop gentle float & scroll drift/shrink
      const floatY = Math.sin(elapsed * SCENE_CONFIG.moonFloatSpeed) * SCENE_CONFIG.moonFloatAmp;
      const scrollScale = 1 - scrollProgress * 0.45;

      moonGroup.position.x = baseMoonPos.x - scrollProgress * 0.55 - pointer.currentX * 0.16;
      moonGroup.position.y = baseMoonPos.y + floatY + scrollProgress * 1.1 - pointer.currentY * 0.12;
      moonGroup.scale.setScalar(baseMoonScale * Math.max(scrollScale, 0.48));

      // Moon visibility, scale, & gentle rotation
      moonMesh.visible = moonVis > 0.006;
      haloSprite.visible = moonVis > 0.006;
      moonMaterial.opacity = moonVis * 0.24;
      haloMaterial.opacity = moonVis * 0.36;
      moonMesh.scale.setScalar(0.42 + moonVis * 0.58);
      moonMesh.rotation.y =
        -0.22 + Math.sin(elapsed * SCENE_CONFIG.moonSpinSpeed) * 0.24 + (1 - moonVis) * 1.35;
      moonMesh.rotation.x = Math.cos(elapsed * 0.18) * 0.07;

      // Sun visibility, scale, & rotating solar corona
      sunGroup.visible = sunVis > 0.006;
      sunMaterial.opacity = sunVis * 0.24;
      sunRingMaterial.opacity = sunVis * 0.18;
      sunRayMaterial.opacity = sunVis * 0.22;
      sunHaloMaterial.opacity = sunVis * 0.42;
      sunGroup.scale.setScalar(0.42 + sunVis * 0.58);
      sunCoronaGroup.rotation.z = elapsed * 0.09 + moonVis * 0.9;
      sunGroup.rotation.y = Math.sin(elapsed * 0.16) * 0.14 - moonVis * 1.1;

      starField.rotation.y = elapsed * 0.009 + pointer.currentX * 0.04;
      starField.rotation.x = pointer.currentY * 0.03;
      starMaterial.uniforms.uTime.value = elapsed;

      renderer.render(scene, camera);
    }

    function animate() {
      if (!isVisible || document.hidden || prefersReducedMotion()) {
        rafId = null;
        return;
      }
      const elapsed = clock.getElapsedTime();
      renderFrame(elapsed);
      rafId = requestAnimationFrame(animate);
    }

    function startLoop() {
      if (prefersReducedMotion()) {
        renderFrame(0);
        return;
      }
      if (!rafId && isVisible && !document.hidden) {
        clock.start();
        rafId = requestAnimationFrame(animate);
      }
    }

    function stopLoop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isVisible = entry.isIntersecting;
            if (isVisible) startLoop();
            else stopLoop();
          });
        },
        { threshold: 0.01 }
      );
      observer.observe(heroStage);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopLoop();
      else startLoop();
    });

    startLoop();
  }

  /**
   * Initializes subtle floating 3D elements (open book, quill, pages) in Poetry background.
   */
  function initPoetryScene() {
    const section = document.querySelector('#poetry');
    const canvas = document.querySelector('#poetry-canvas');
    if (!section || !canvas) return;
    if (typeof THREE === 'undefined' || prefersReducedMotion() || isLowPowerOrMobile()) {
      canvas.style.display = 'none';
      return;
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      canvas.style.display = 'none';
      return;
    }
    if (!renderer || !renderer.getContext()) {
      canvas.style.display = 'none';
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    camera.position.set(0, 0, 10);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

    const ambient = new THREE.AmbientLight(0xfff5e4, 0.9);
    const dir = new THREE.DirectionalLight(0xe4bd91, 0.8);
    dir.position.set(3, 5, 5);
    scene.add(ambient, dir);

    const paperMat = new THREE.MeshStandardMaterial({
      color: 0xdfd6b9,
      roughness: 0.8,
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x6b574a,
      roughness: 0.6,
      transparent: true,
      opacity: 0.55
    });

    // Helper: gently curved page plane
    function createCurvedPage(w, h, arch) {
      const geo = new THREE.PlaneGeometry(w, h, 8, 2);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const norm = (x + w / 2) / w;
        pos.setZ(i, Math.sin(norm * Math.PI) * arch);
      }
      geo.computeVertexNormals();
      return geo;
    }

    // 1. Open Book Group
    const bookGroup = new THREE.Group();
    const leftPage = new THREE.Mesh(createCurvedPage(1.1, 1.45, 0.16), paperMat);
    leftPage.position.set(-0.56, 0, 0);
    leftPage.rotation.y = 0.22;

    const rightPage = new THREE.Mesh(createCurvedPage(1.1, 1.45, 0.16), paperMat);
    rightPage.position.set(0.56, 0, 0);
    rightPage.rotation.y = -0.22;

    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.48, 8), accentMat);
    bookGroup.add(leftPage, rightPage, spine);
    bookGroup.position.set(-4.2, 2.2, -1);
    bookGroup.rotation.set(0.35, 0.4, -0.15);
    scene.add(bookGroup);

    // 2. Stylized Quill Group
    const quillGroup = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.03, 2.2, 8), accentMat);
    const featherShape = new THREE.Shape();
    featherShape.moveTo(0, -0.35);
    featherShape.quadraticCurveTo(0.28, 0.2, 0.12, 0.95);
    featherShape.quadraticCurveTo(0.02, 1.15, 0, 1.2);
    featherShape.quadraticCurveTo(-0.18, 0.7, -0.08, -0.2);
    featherShape.closePath();
    const featherMesh = new THREE.Mesh(new THREE.ShapeGeometry(featherShape), paperMat);
    featherMesh.position.y = 0.05;
    quillGroup.add(shaft, featherMesh);
    quillGroup.position.set(4.3, -1.6, -1.2);
    quillGroup.rotation.set(0.2, -0.3, -0.45);
    scene.add(quillGroup);

    // 3. Floating Loose Pages
    const floatingPages = [];
    const pageOffsets = [
      { x: 4.1, y: 2.7, z: -2.2, scale: 0.72 },
      { x: -4.5, y: -2.4, z: -1.8, scale: 0.65 },
      { x: 0.6, y: 0.4, z: -3.2, scale: 0.58 }
    ];
    pageOffsets.forEach((cfg, idx) => {
      const mesh = new THREE.Mesh(createCurvedPage(0.95, 1.25, 0.12), paperMat);
      mesh.position.set(cfg.x, cfg.y, cfg.z);
      mesh.scale.setScalar(cfg.scale);
      mesh.userData = { baseY: cfg.y, speed: 0.45 + idx * 0.15, phase: idx * 2.1 };
      scene.add(mesh);
      floatingPages.push(mesh);
    });

    function resizePoetry() {
      const w = section.clientWidth || window.innerWidth;
      const h = section.clientHeight || 800;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    resizePoetry();
    window.addEventListener('resize', resizePoetry, { passive: true });

    let rafId = null;
    let isVisible = false;
    const clock = new THREE.Clock();

    function animate() {
      if (!isVisible || document.hidden) {
        rafId = null;
        return;
      }
      const t = clock.getElapsedTime();

      bookGroup.position.y = 2.2 + Math.sin(t * 0.48) * 0.25;
      bookGroup.rotation.y = 0.4 + Math.sin(t * 0.25) * 0.18;

      quillGroup.position.y = -1.6 + Math.cos(t * 0.52) * 0.24;
      quillGroup.rotation.z = -0.45 + Math.sin(t * 0.35) * 0.1;

      floatingPages.forEach((page) => {
        const { baseY, speed, phase } = page.userData;
        page.position.y = baseY + Math.sin(t * speed + phase) * 0.28;
        page.rotation.x = Math.sin(t * 0.3 + phase) * 0.22;
        page.rotation.y = Math.cos(t * 0.24 + phase) * 0.35;
      });

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    }

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isVisible = entry.isIntersecting;
            if (isVisible && !rafId) {
              clock.start();
              rafId = requestAnimationFrame(animate);
            } else if (!isVisible && rafId) {
              cancelAnimationFrame(rafId);
              rafId = null;
            }
          });
        },
        { threshold: 0.01 }
      );
      obs.observe(section);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initHeroScene();
    initPoetryScene();
  });
})();

