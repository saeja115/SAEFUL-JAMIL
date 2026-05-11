// ═══════════════════════════════════════════════
//  THREE.JS 3D ANIMATED BACKGROUND
// ═══════════════════════════════════════════════
(function() {
  const canvas = document.getElementById('bg3d');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x050810, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 60;

  // ── Fog for depth ──
  scene.fog = new THREE.FogExp2(0x050810, 0.018);

  // ── 1. PARTICLE FIELD ──
  const particleCount = 1800;
  const positions = new Float32Array(particleCount * 3);
  const colors    = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    positions[i3]     = (Math.random() - 0.5) * 200;
    positions[i3 + 1] = (Math.random() - 0.5) * 200;
    positions[i3 + 2] = (Math.random() - 0.5) * 120;
    // cyan/green tint
    const r = Math.random();
    if (r < 0.55) { colors[i3]=0; colors[i3+1]=0.9; colors[i3+2]=1; }
    else if (r < 0.8) { colors[i3]=0.22; colors[i3+1]=1; colors[i3+2]=0.08; }
    else { colors[i3]=1; colors[i3+1]=1; colors[i3+2]=1; }
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.35, vertexColors: true, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ── 2. FLOATING WIREFRAME OCTAHEDRA ──
  const shapes = [];
  const shapeColors = [0x00e5ff, 0x39ff14, 0x00aaff, 0x00ffcc];
  for (let i = 0; i < 12; i++) {
    const geo = Math.random() < 0.5
      ? new THREE.OctahedronGeometry(Math.random() * 3 + 1.5, 0)
      : new THREE.IcosahedronGeometry(Math.random() * 2.5 + 1, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: shapeColors[i % shapeColors.length],
      wireframe: true, transparent: true, opacity: Math.random() * 0.18 + 0.07
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 120,
      (Math.random() - 0.5) * 80,
      (Math.random() - 0.5) * 60 - 10
    );
    mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
    mesh.userData = {
      rX: (Math.random() - 0.5) * 0.008,
      rY: (Math.random() - 0.5) * 0.008,
      floatSpeed: Math.random() * 0.003 + 0.001,
      floatAmp: Math.random() * 4 + 2,
      originY: mesh.position.y,
      phase: Math.random() * Math.PI * 2
    };
    scene.add(mesh);
    shapes.push(mesh);
  }

  // ── 3. GLOWING GRID PLANE ──
  const gridHelper = new THREE.GridHelper(200, 40, 0x00e5ff, 0x001520);
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.12;
  gridHelper.position.y = -30;
  scene.add(gridHelper);

  // ── 4. CONNECTING LINES between nearby particles ──
  const lineGeo = new THREE.BufferGeometry();
  const linePositions = [];
  const maxLinks = 300, range = 18;
  for (let i = 0; i < maxLinks; i++) {
    const a = Math.floor(Math.random() * particleCount) * 3;
    const b = Math.floor(Math.random() * particleCount) * 3;
    const dx = positions[a]-positions[b], dy = positions[a+1]-positions[b+1], dz = positions[a+2]-positions[b+2];
    if (Math.sqrt(dx*dx+dy*dy+dz*dz) < range) {
      linePositions.push(positions[a], positions[a+1], positions[a+2]);
      linePositions.push(positions[b], positions[b+1], positions[b+2]);
    }
  }
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x00e5ff, transparent: true, opacity: 0.06,
    blending: THREE.AdditiveBlending
  });
  scene.add(new THREE.LineSegments(lineGeo, lineMat));

  // ── Mouse parallax ──
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ── Resize ──
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Animate ──
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.008;

    // Slow particle rotation
    particles.rotation.y += 0.00025;
    particles.rotation.x += 0.00010;

    // Camera parallax follow mouse
    camera.position.x += (mouseX * 6 - camera.position.x) * 0.025;
    camera.position.y += (-mouseY * 4 - camera.position.y) * 0.025;
    camera.lookAt(scene.position);

    // Grid drift
    gridHelper.position.z = (t * 3) % 5;

    // Float shapes
    shapes.forEach(s => {
      s.rotation.x += s.userData.rX;
      s.rotation.y += s.userData.rY;
      s.position.y = s.userData.originY + Math.sin(t * s.userData.floatSpeed * 200 + s.userData.phase) * s.userData.floatAmp;
    });

    renderer.render(scene, camera);
  }
  animate();
})();

// ═══════════════════════════════════════════════
//  CUSTOM CURSOR
// ═══════════════════════════════════════════════
const cursor     = document.querySelector('.cursor');
const cursorRing = document.querySelector('.cursor-ring');
document.addEventListener('mousemove', e => {
  cursor.style.transform     = `translate(${e.clientX - 5}px, ${e.clientY - 5}px)`;
  cursorRing.style.transform = `translate(${e.clientX - 17}px, ${e.clientY - 17}px)`;
});
document.querySelectorAll('a, button, .skill-card, .project-card').forEach(el => {
  el.addEventListener('mouseenter', () => { cursorRing.style.opacity='0.9'; cursorRing.style.transform += ' scale(1.5)'; });
  el.addEventListener('mouseleave', () => { cursorRing.style.opacity='0.45'; });
});

// ═══════════════════════════════════════════════
//  SCROLL REVEAL
// ═══════════════════════════════════════════════
const revealEls = document.querySelectorAll('.reveal');
const observer  = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      const fill = entry.target.querySelector('.skill-fill');
      if (fill) setTimeout(() => { fill.style.width = fill.dataset.width; }, 200);
    }
  });
}, { threshold: 0.1 });
revealEls.forEach(el => observer.observe(el));

// ═══════════════════════════════════════════════
//  TYPING EFFECT
// ═══════════════════════════════════════════════
const taglines = ['Web Developer', 'Sistem Informasi', 'UI Enthusiast', 'Problem Solver'];
let i=0, j=0, deleting=false;
const typingEl = document.getElementById('typing');
function type() {
  const word = taglines[i];
  typingEl.textContent = word.slice(0, j);
  if (!deleting) {
    j++;
    if (j > word.length) { deleting=true; setTimeout(type, 1600); return; }
  } else {
    j--;
    if (j < 0) { deleting=false; i=(i+1)%taglines.length; j=0; }
  }
  setTimeout(type, deleting ? 55 : 95);
}
type();

// ═══════════════════════════════════════════════
//  NAV ACTIVE STATE
// ═══════════════════════════════════════════════
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 130) current = s.id; });
  navLinks.forEach(a => { a.style.color = a.getAttribute('href') === `#${current}` ? 'var(--accent)' : ''; });
});


// Stagger cards
document.querySelectorAll('.skill-card, .project-card').forEach((el, idx) => {
  el.style.transitionDelay = `${idx * 0.07}s`;
});

// ═══════════════════════════════════════════════
//  TILT EFFECT on skill cards
// ═══════════════════════════════════════════════
document.querySelectorAll('.skill-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect  = card.getBoundingClientRect();
    const cx    = rect.left + rect.width  / 2;
    const cy    = rect.top  + rect.height / 2;
    const dx    = (e.clientX - cx) / (rect.width  / 2);
    const dy    = (e.clientY - cy) / (rect.height / 2);
    const tiltX = dy * -10;
    const tiltY = dx *  10;
    card.style.transform = `translateY(-8px) scale(1.02) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    card.style.boxShadow = `${-dx*8}px ${-dy*8}px 30px rgba(0,229,255,0.2), 0 0 25px rgba(0,229,255,0.5)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.boxShadow = '';
  });
});

// ═══════════════════════════════════════════════
//  PARTICLE BURST on project card click
// ═══════════════════════════════════════════════
function spawnParticles(x, y) {
  const colors = ['#00e5ff', '#39ff14', '#ffffff', '#7fdbff'];
  for (let i = 0; i < 14; i++) {
    const p = document.createElement('div');
    p.style.cssText = `
      position:fixed; pointer-events:none; z-index:9999;
      width:${Math.random()*6+3}px; height:${Math.random()*6+3}px;
      border-radius:50%; background:${colors[i%colors.length]};
      left:${x}px; top:${y}px;
      transition: transform ${0.4+Math.random()*0.4}s ease-out, opacity 0.5s ease-out;
      transform: translate(0,0) scale(1); opacity:1;
      box-shadow: 0 0 6px currentColor;
    `;
    document.body.appendChild(p);
    const angle  = (i / 14) * Math.PI * 2 + Math.random() * 0.5;
    const dist   = 40 + Math.random() * 80;
    const tx     = Math.cos(angle) * dist;
    const ty     = Math.sin(angle) * dist;
    requestAnimationFrame(() => {
      p.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
      p.style.opacity   = '0';
    });
    setTimeout(() => p.remove(), 900);
  }
}
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('click', e => spawnParticles(e.clientX, e.clientY));
});

// ═══════════════════════════════════════════════
//  RIPPLE on buttons
// ═══════════════════════════════════════════════
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', e => {
    const r    = btn.getBoundingClientRect();
    const rip  = document.createElement('span');
    const size = Math.max(r.width, r.height) * 2;
    rip.style.cssText = `
      position:absolute; pointer-events:none;
      width:${size}px; height:${size}px; border-radius:50%;
      background:rgba(255,255,255,0.25);
      left:${e.clientX - r.left - size/2}px;
      top:${e.clientY - r.top  - size/2}px;
      transform:scale(0); animation:rippleAnim 0.6s ease-out forwards;
    `;
    if (!document.getElementById('ripple-style')) {
      const s = document.createElement('style');
      s.id = 'ripple-style';
      s.textContent = `@keyframes rippleAnim { to { transform:scale(1); opacity:0; } }`;
      document.head.appendChild(s);
    }
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(rip);
    setTimeout(() => rip.remove(), 650);
  });
});

// ═══════════════════════════════════════════════
//  SCAN LINE sweep on sections
// ═══════════════════════════════════════════════
const scanStyle = document.createElement('style');
scanStyle.textContent = `
  .scan-sweep {
    position: relative;
    overflow: hidden;
  }
  .scan-sweep::before {
    content: '';
    position: absolute;
    top: -100%; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    opacity: 0.5;
    animation: scanLine 4s linear infinite;
    pointer-events: none;
    z-index: 2;
  }
  @keyframes scanLine {
    0%   { top: -2px; opacity: 0.6; }
    100% { top: 100%; opacity: 0; }
  }
`;
document.head.appendChild(scanStyle);
document.querySelectorAll('section').forEach(s => s.classList.add('scan-sweep'));

// ═══════════════════════════════════════════════
//  MAGNETIC hover on nav links
// ═══════════════════════════════════════════════
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('mousemove', e => {
    const rect = link.getBoundingClientRect();
    const dx   = (e.clientX - rect.left - rect.width/2)  * 0.25;
    const dy   = (e.clientY - rect.top  - rect.height/2) * 0.25;
    link.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  link.addEventListener('mouseleave', () => {
    link.style.transform = '';
    link.style.transition = 'transform 0.4s ease, color 0.3s';
    setTimeout(() => { link.style.transition = ''; }, 400);
  });
});