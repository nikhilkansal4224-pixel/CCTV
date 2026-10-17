/**
 * Surrealism Canvas Engine
 * Renders an ethereal, dreamlike surrealist backdrop featuring:
 * - The All-Seeing Surveillance Eye with golden celestial orbital rings
 * - Floating Dalí-esque melting clock gears & fluid spheres
 * - Luminous stardust constellation threads undulating smoothly
 */

class SurrealEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.mouse = { x: this.width * 0.5, y: this.height * 0.35, targetX: this.width * 0.5, targetY: this.height * 0.35 };
    
    this.particles = [];
    this.floatingSpheres = [];
    this.clockGears = [];
    this.time = 0;
    
    this.showEye = true;
    this.showGears = true;
    this.showSpheres = true;
    this.showConstellation = true;

    this.init();
    this.bindEvents();
    this.animate();
  }

  init() {
    this.resize();

    // Generate Stardust Constellation Particles
    this.particles = [];
    const count = Math.min(Math.floor((this.width * this.height) / 18000), 75);
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 0.8,
        alpha: Math.random() * 0.6 + 0.2,
        color: ['#00f0ff', '#8a2be2', '#ff007f', '#ffd700'][Math.floor(Math.random() * 4)]
      });
    }

    // Generate Floating Surrealist Fluid Spheres
    this.floatingSpheres = [
      { x: this.width * 0.15, y: this.height * 0.25, baseR: 45, phase: 0, speed: 0.008, color: 'rgba(138, 43, 226, 0.25)' },
      { x: this.width * 0.85, y: this.height * 0.35, baseR: 60, phase: 2, speed: 0.006, color: 'rgba(0, 240, 255, 0.2)' },
      { x: this.width * 0.25, y: this.height * 0.8,  baseR: 50, phase: 4, speed: 0.007, color: 'rgba(255, 0, 127, 0.18)' },
      { x: this.width * 0.78, y: this.height * 0.85, baseR: 70, phase: 1, speed: 0.005, color: 'rgba(255, 215, 0, 0.15)' }
    ];

    // Generate Surreal Melting Clock Gears
    this.clockGears = [
      { x: this.width * 0.12, y: this.height * 0.65, radius: 55, teeth: 12, rot: 0, rotSpeed: 0.002, deform: 1.3 },
      { x: this.width * 0.88, y: this.height * 0.6, radius: 45, teeth: 8, rot: 0, rotSpeed: -0.003, deform: 0.8 }
    ];
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.init();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = e.clientX;
      this.mouse.targetY = e.clientY;
    });
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  animate() {
    this.time += 0.015;

    // Smooth mouse interpolation
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Surrealist Constellation Particles & Threads
    if (this.showConstellation) this.drawConstellation();

    // 2. Draw Floating Surreal Fluid Spheres (Metaball aura)
    if (this.showSpheres) this.drawFluidSpheres();

    // 3. Draw Dalí Melting Gears
    if (this.showGears) this.drawMeltingGears();

    // 4. Draw Omniscient Celestial Surveillance Eye
    if (this.showEye) this.drawOmniscientEye();

    requestAnimationFrame(() => this.animate());
  }

  drawConstellation() {
    const ctx = this.ctx;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw faint connections
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = '#00f0ff';
          ctx.globalAlpha = (1 - dist / 110) * 0.12;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  drawFluidSpheres() {
    const ctx = this.ctx;
    for (const sphere of this.floatingSpheres) {
      const r = sphere.baseR + Math.sin(this.time * 2 + sphere.phase) * 12;
      const x = sphere.x + Math.sin(this.time + sphere.phase) * 25;
      const y = sphere.y + Math.cos(this.time * 0.8 + sphere.phase) * 20;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, sphere.color);
      grad.addColorStop(0.7, sphere.color.replace(/[\d\.]+\)$/, '0.08)'));
      grad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Surrealist thin glowing outer ring
      ctx.beginPath();
      ctx.arc(x, y, r * 1.08, 0, Math.PI * 2);
      ctx.strokeStyle = sphere.color.replace(/[\d\.]+\)$/, '0.35)');
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  drawMeltingGears() {
    const ctx = this.ctx;
    for (const gear of this.clockGears) {
      gear.rot += gear.rotSpeed;
      const x = gear.x;
      const y = gear.y;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(gear.rot);
      // Salvador Dalí distortion stretch
      ctx.scale(1, gear.deform + Math.sin(this.time) * 0.1);

      ctx.beginPath();
      for (let i = 0; i < gear.teeth; i++) {
        const angle = (i / gear.teeth) * Math.PI * 2;
        const nextAngle = ((i + 1) / gear.teeth) * Math.PI * 2;
        const outerR = gear.radius;
        const innerR = gear.radius * 0.75;

        const x1 = Math.cos(angle) * innerR;
        const y1 = Math.sin(angle) * innerR;
        const x2 = Math.cos(angle + 0.1) * outerR;
        const y2 = Math.sin(angle + 0.1) * outerR;
        const x3 = Math.cos(nextAngle - 0.1) * outerR;
        const y3 = Math.sin(nextAngle - 0.1) * outerR;

        if (i === 0) ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(Math.cos(nextAngle) * innerR, Math.sin(nextAngle) * innerR);
      }
      ctx.closePath();

      ctx.strokeStyle = 'rgba(255, 215, 0, 0.22)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Gear center
      ctx.beginPath();
      ctx.arc(0, 0, gear.radius * 0.25, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
  }

  drawOmniscientEye() {
    const ctx = this.ctx;
    // Eye sits in upper-center space, subtly tracking cursor/gaze
    const eyeX = this.width * 0.5;
    const eyeY = this.height * 0.18;

    const dx = this.mouse.x - eyeX;
    const dy = this.mouse.y - eyeY;
    const angle = Math.atan2(dy, dx);
    const pupilDist = Math.min(Math.hypot(dx, dy) * 0.04, 18);

    const pupilX = eyeX + Math.cos(angle) * pupilDist;
    const pupilY = eyeY + Math.sin(angle) * pupilDist;

    // 1. Concentric Golden Orbital Rings (Surrealist armillary spheres)
    for (let r = 0; r < 4; r++) {
      const radius = 60 + r * 28;
      const rot = this.time * (0.2 + r * 0.1) * (r % 2 === 0 ? 1 : -1);

      ctx.save();
      ctx.translate(eyeX, eyeY);
      ctx.rotate(rot);
      ctx.scale(1, 0.4 + r * 0.15); // Elliptical projection

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.strokeStyle = r % 2 === 0 ? 'rgba(255, 215, 0, 0.18)' : 'rgba(0, 240, 255, 0.22)';
      ctx.lineWidth = 1;
      if (r === 2) ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Floating celestial bead on the ring
      const beadAngle = rot * 2;
      const beadX = Math.cos(beadAngle) * radius;
      const beadY = Math.sin(beadAngle) * radius;
      ctx.beginPath();
      ctx.arc(beadX, beadY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f0ff';
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    }

    // 2. Eye Sclera (Surrealistic Almond Contour)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(eyeX - 58, eyeY);
    ctx.bezierCurveTo(eyeX - 25, eyeY - 32, eyeX + 25, eyeY - 32, eyeX + 58, eyeY);
    ctx.bezierCurveTo(eyeX + 25, eyeY + 32, eyeX - 25, eyeY + 32, eyeX - 58, eyeY);
    ctx.closePath();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Soft mystical glow inside eye
    const scleraGrad = ctx.createRadialGradient(pupilX, pupilY, 0, eyeX, eyeY, 50);
    scleraGrad.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
    scleraGrad.addColorStop(0.8, 'rgba(14, 18, 34, 0.4)');
    scleraGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = scleraGrad;
    ctx.fill();

    // Clip pupil to eye contour
    ctx.clip();

    // 3. Iris (Surrealist Iris with chromatic radiance)
    const irisR = 20;
    const irisGrad = ctx.createRadialGradient(pupilX, pupilY, 2, pupilX, pupilY, irisR);
    irisGrad.addColorStop(0, '#00f0ff');
    irisGrad.addColorStop(0.5, '#8a2be2');
    irisGrad.addColorStop(1, '#ff007f');

    ctx.beginPath();
    ctx.arc(pupilX, pupilY, irisR, 0, Math.PI * 2);
    ctx.fillStyle = irisGrad;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f0ff';
    ctx.fill();
    ctx.shadowBlur = 0;

    // 4. Pupil (Deep Void with cyber targeting reticle)
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#06070d';
    ctx.fill();

    // Specular light reflection on eye
    ctx.beginPath();
    ctx.arc(pupilX - 4, pupilY - 4, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }
}

// Auto instantiate on load & store reference
document.addEventListener('DOMContentLoaded', () => {
  window.surrealEngine = new SurrealEngine('surreal-canvas');
});
