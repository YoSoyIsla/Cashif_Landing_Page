/**
 * Cashif Landing Page Logic
 * - Buttery Lerp Smooth Scrolling (Zero motion blur)
 * - Sticky Split-Scroll Feature Showcase in Purple Platform Section
 * - Interactive 12-Column Grid Toggle
 * - Mobile Navigation Menu
 */

// --- 1. Smooth Lerp Scroll Engine (Linear Interpolation, No Motion Blur) ---
class LerpSmoothScroll {
  constructor() {
    this.currentY = window.scrollY;
    this.targetY = window.scrollY;
    this.ease = 0.085; // Natural inertia damping
    this.isScrolling = false;
    this.rafId = null;

    this.onWheel = this.onWheel.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.update = this.update.bind(this);

    this.init();
  }

  init() {
    // Only on desktop pointer devices
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    document.documentElement.style.scrollBehavior = 'auto';

    window.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
  }

  maxScroll() {
    return Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    ) - window.innerHeight;
  }

  onWheel(e) {
    e.preventDefault();

    let delta = e.deltaY;
    if (e.deltaMode === 1) { // Firefox line mode
      delta *= 36;
    }

    this.targetY = Math.max(0, Math.min(this.targetY + delta, this.maxScroll()));

    if (!this.isScrolling) {
      this.isScrolling = true;
      this.rafId = requestAnimationFrame(this.update);
    }
  }

  onKeyDown(e) {
    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    if (['INPUT', 'TEXTAREA'].includes(activeTag)) return;

    let delta = 0;
    if (e.key === 'ArrowDown') delta = 90;
    else if (e.key === 'ArrowUp') delta = -90;
    else if (e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) delta = window.innerHeight * 0.8;
    else if (e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) delta = -window.innerHeight * 0.8;

    if (delta !== 0) {
      e.preventDefault();
      this.targetY = Math.max(0, Math.min(this.targetY + delta, this.maxScroll()));
      if (!this.isScrolling) {
        this.isScrolling = true;
        this.rafId = requestAnimationFrame(this.update);
      }
    }
  }

  onScroll() {
    if (!this.isScrolling) {
      this.currentY = window.scrollY;
      this.targetY = window.scrollY;
    }
  }

  onResize() {
    this.targetY = Math.max(0, Math.min(this.targetY, this.maxScroll()));
  }

  update() {
    const diff = this.targetY - this.currentY;
    this.currentY += diff * this.ease;

    if (Math.abs(diff) < 0.5) {
      this.currentY = this.targetY;
      window.scrollTo(0, Math.round(this.currentY));
      this.isScrolling = false;
      updateAllScrollEffects();
      return;
    }

    window.scrollTo(0, Math.round(this.currentY));
    updateAllScrollEffects();
    this.rafId = requestAnimationFrame(this.update);
  }
}

// --- Global Cache for Scroll Effect Elements ---
let curveDivider = null;
let curvePath = null;
let platformSection = null;
let platformHeader = null;

function updateAllScrollEffects() {
  const vh = window.innerHeight;

  // 1. Dynamic Morphing Curve Divider (Purple to Green Section)
  if (curveDivider && curvePath) {
    const rect = curveDivider.getBoundingClientRect();
    const startY = vh;
    const endY = vh * 0.25;
    let progress = (startY - rect.top) / (startY - endY);
    progress = Math.max(0, Math.min(1, progress));

    const maxCurveDepth = 110;
    const curveH = maxCurveDepth * (1 - progress);
    curvePath.setAttribute('d', `M 0,0 Q 720,${curveH.toFixed(1)} 1440,0 L 1440,120 L 0,120 Z`);
  }

  // 2. Parallax Depth on Purple Section Only (White sections remain completely static & intact)
  if (platformSection && platformHeader) {
    const platRect = platformSection.getBoundingClientRect();
    if (platRect.top < vh && platRect.bottom > 0) {
      // enterProgress: 0 when purple enters viewport, 1 when it reaches top
      const enterProgress = Math.max(0, Math.min(1, (vh - platRect.top) / vh));
      // Purple header smoothly floats upward with parallax depth, 100% full opacity always
      const headerOffset = (1 - enterProgress) * 110;
      platformHeader.style.transform = `translate3d(0, ${headerOffset.toFixed(1)}px, 0)`;
    } else if (platRect.top >= vh) {
      platformHeader.style.transform = 'translate3d(0, 110px, 0)';
    } else {
      platformHeader.style.transform = 'translate3d(0, 0, 0)';
    }
  }
}

// --- 2. Purple Platform Section Sticky Image Scroll Showcase ---
function initPlatformShowcase() {
  const showcase = document.querySelector('.platform-showcase');
  if (!showcase) return;

  const steps = showcase.querySelectorAll('.showcase-step');
  const cards = showcase.querySelectorAll('.showcase-card');
  if (!steps.length || !cards.length) return;

  let activeIndex = -1;

  function update() {
    const vh = window.innerHeight;
    const triggerLine = vh * 0.5;

    let bestIndex = 0;
    let minDistance = Infinity;

    steps.forEach((step, index) => {
      const rect = step.getBoundingClientRect();
      const center = rect.top + rect.height * 0.5;
      const distance = Math.abs(center - triggerLine);

      if (distance < minDistance) {
        minDistance = distance;
        bestIndex = index;
      }
    });

    if (bestIndex !== activeIndex) {
      activeIndex = bestIndex;

      // Transition left sticky cards
      cards.forEach((card, index) => {
        card.classList.toggle('active', index === activeIndex);
      });

      // Highlight active text step
      steps.forEach((step, index) => {
        step.classList.toggle('active', index === activeIndex);
      });
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

// --- 3. DOM Ready Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM references for scroll effects
  curveDivider = document.getElementById('purple-green-curve');
  curvePath = document.getElementById('curve-path');
  platformSection = document.querySelector('.platform-section');
  platformHeader = document.querySelector('.platform-header');

  // Initialize Lerp Smooth Scrolling
  new LerpSmoothScroll();

  // Initialize Sticky Split-Scroll Showcase in Purple Platform Section
  initPlatformShowcase();

  // Listen to native scroll/resize for fallback or trackpad/touch
  window.addEventListener('scroll', updateAllScrollEffects, { passive: true });
  window.addEventListener('resize', updateAllScrollEffects);
  updateAllScrollEffects();

  // Mobile Menu Toggle
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('active');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Interactive 12-Column Grid Overlay Toggle
  const gridBtn = document.getElementById('grid-toggle-btn');
  const gridOverlay = document.getElementById('grid-overlay');

  if (gridBtn && gridOverlay) {
    const updateBtnState = (isActive) => {
      const label = gridBtn.querySelector('.grid-btn-label');
      if (label) label.textContent = isActive ? '12-Col Grid: ON' : '12-Col Grid: OFF';
      gridBtn.classList.toggle('is-active', isActive);
      gridBtn.setAttribute('aria-pressed', isActive);
    };

    const toggleGrid = () => {
      const isActive = gridOverlay.classList.toggle('active');
      updateBtnState(isActive);
    };

    gridBtn.addEventListener('click', toggleGrid);

    window.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'g' || e.key === 'G')) {
        toggleGrid();
      }
    });

    updateBtnState(gridOverlay.classList.contains('active'));
  }

  // Prevent dead anchor navigation (excluding brand-logo)
  document.querySelectorAll('a[href="#"]:not(.brand-logo)').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
    });
  });

  // Initialize interactive navbar logo touch support
  initNavbarLogoInteraction();
});

// --- 4. Interactive Navbar Logo Touch Support ---
function initNavbarLogoInteraction() {
  const brandLogo = document.querySelector('.brand-logo');
  if (!brandLogo) return;

  // Touch device responsiveness: brief tap toggles hover state then reverts
  let touchTimeout = null;
  brandLogo.addEventListener('touchstart', () => {
    clearTimeout(touchTimeout);
    brandLogo.classList.add('is-hovered');
  }, { passive: true });

  brandLogo.addEventListener('touchend', () => {
    touchTimeout = setTimeout(() => {
      brandLogo.classList.remove('is-hovered');
    }, 450);
  }, { passive: true });
}
