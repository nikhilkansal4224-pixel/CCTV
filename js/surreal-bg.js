/**
 * ARGUS SURREAL BACKGROUND ENGINE
 * Creates a metaphysical living dreamscape with floating refractive glass spheres,
 * stardust motes, mouse parallax, and threat pulse ripples.
 */

(function() {
  const canvas = document.getElementById('surrealCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const bgImg = document.querySelector('.surreal-bg-image');
  const pulseOverlay = document.querySelector('.surreal-pulse-overlay');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initSpheres();
  });

  // Mouse Parallax coordinates
  let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
  });

  // Metaphysical floating glass spheres & cosmic stardust
  let spheres = [];
  let stars = [];

  function initSpheres() {
    spheres = [];
    const count = Math.min(18, Math.floor(width / 80));
    for (let i = 0; i < count; i++) {
      spheres.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseY: Math.random() * height,
        radius: 12 + Math.random() * 38,
        floatSpeed: 0.001 + Math.random() * 0.002,
        floatOffset: Math.random() * Math.PI * 2,
        driftSpeedX: (Math.random() - 0.5) * 0.35,
        depth: 0.2 + Math.random() * 0.8,
        hue: 180 + Math.random() * 120, // Cyan to Purple
        alpha: 0.25 + Math.random() * 0.35
      });
    }

    stars = [];
    const starCount = 65;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        twinkleSpeed: 0.02 + Math.random() * 0.03,
        twinklePhase: Math.random() * Math.PI * 2,
        depth: Math.random()
      });
    }
  }

  initSpheres();

  let time = 0;
  let pulseWave = { active: false, radius: 0, maxRadius: 1000, alpha: 0, x: width / 2, y: height * 0.3 };

  function animate() {
    requestAnimationFrame(animate);
    time += 0.016;

    // Smooth mouse parallax lerp
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    const parallaxX = (mouse.x - width / 2) * 0.03;
    const parallaxY = (mouse.y - height / 2) * 0.03;

    if (bgImg) {
      bgImg.style.transform = `scale(1.06) translate(${parallaxX * -0.5}px, ${parallaxY * -0.5}px)`;
    }

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Twinkling Stardust
    stars.forEach(star => {
      const alpha = 0.3 + 0.7 * Math.sin(time * star.twinkleSpeed * 10 + star.twinklePhase);
      const px = star.x + parallaxX * star.depth;
      const py = star.y + parallaxY * star.depth;
      ctx.fillStyle = `rgba(220, 240, 255, ${Math.max(0, alpha)})`;
      ctx.beginPath();
      ctx.arc(px, py, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Draw Floating Refractive Glass Spheres
    spheres.forEach(s => {
      // Sine wave vertical floating + horizontal gentle drift
      s.y = s.baseY + Math.sin(time + s.floatOffset) * (20 * s.depth);
      s.x += s.driftSpeedX;
      if (s.x < -s.radius * 2) s.x = width + s.radius;
      if (s.x > width + s.radius * 2) s.x = -s.radius;

      const px = s.x + parallaxX * s.depth * 1.5;
      const py = s.y + parallaxY * s.depth * 1.5;

      // Outer glass refraction aura
      const grad = ctx.createRadialGradient(
        px - s.radius * 0.3,
        py - s.radius * 0.3,
        s.radius * 0.1,
        px,
        py,
        s.radius
      );
      grad.addColorStop(0, `hsla(${s.hue}, 100%, 85%, ${s.alpha * 1.2})`);
      grad.addColorStop(0.4, `hsla(${s.hue + 40}, 80%, 60%, ${s.alpha * 0.5})`);
      grad.addColorStop(0.85, `hsla(${s.hue}, 90%, 40%, ${s.alpha * 0.2})`);
      grad.addColorStop(1, 'transparent');

      ctx.save();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, s.radius, 0, Math.PI * 2);
      ctx.fill();

      // Delicate glass perimeter rim
      ctx.strokeStyle = `hsla(${s.hue}, 100%, 90%, ${s.alpha * 0.6})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Specular glass highlight reflection
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.ellipse(
        px - s.radius * 0.38,
        py - s.radius * 0.38,
        s.radius * 0.22,
        s.radius * 0.12,
        Math.PI / 4,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    });

    // 3. Surreal Alarm Ripple Wave
    if (pulseWave.active) {
      pulseWave.radius += 18;
      pulseWave.alpha *= 0.96;
      if (pulseWave.radius > pulseWave.maxRadius || pulseWave.alpha < 0.01) {
        pulseWave.active = false;
      } else {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pulseWave.x, pulseWave.y, pulseWave.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 42, 95, ${pulseWave.alpha})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ff2a5f';
        ctx.shadowBlur = 25;
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  animate();

  // Global trigger for surreal reaction when motion / human is detected
  window.triggerSurrealShockwave = function() {
    pulseWave.active = true;
    pulseWave.radius = 20;
    pulseWave.alpha = 0.9;
    pulseWave.x = width / 2;
    pulseWave.y = height * 0.32; // Aligns with the cosmic eye in the background art

    if (pulseOverlay) {
      pulseOverlay.classList.add('active');
      setTimeout(() => {
        pulseOverlay.classList.remove('active');
      }, 1600);
    }
  };
})();
