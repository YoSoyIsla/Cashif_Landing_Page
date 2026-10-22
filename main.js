/**
 * Cashif Landing Page Logic
 * - Buttery Lerp Smooth Scrolling (Zero motion blur)
 * - Sticky Split-Scroll Feature Showcase in Purple Platform Section
 * - Mobile Navigation Menu
 */

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Scroll position that puts `el` just below the fixed header
function elementScrollTop(el) {
  const header = document.querySelector('.site-header');
  const headerHeight = header ? header.offsetHeight : 0;
  const gap = el.dataset.scrollGap ? Number(el.dataset.scrollGap) : 0;
  return el.getBoundingClientRect().top + window.scrollY - headerHeight - gap;
}

// Single entry point for every in-page jump (anchors, logo, CTA)
function smoothScrollToElement(el, onArrive) {
  if (window.lerpScroll && window.lerpScroll.enabled) {
    window.lerpScroll.scrollToElement(el, onArrive);
    return;
  }

  // 'instant', not 'auto': 'auto' inherits html { scroll-behavior: smooth } and still animates
  const behavior = prefersReducedMotion() ? 'instant' : 'smooth';
  window.scrollTo({ top: elementScrollTop(el), behavior });

  // Native smooth scroll can't follow layout shifts: correct once it settles
  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    const drift = elementScrollTop(el) - window.scrollY;
    if (Math.abs(drift) > 2) window.scrollTo({ top: elementScrollTop(el), behavior: 'instant' });
    if (onArrive) onArrive();
  };
  if ('onscrollend' in window && behavior === 'smooth') {
    window.addEventListener('scrollend', settle, { once: true });
  }
  setTimeout(settle, behavior === 'smooth' ? 1200 : 0);
}

// --- 1. Smooth Lerp Scroll Engine (Linear Interpolation, No Motion Blur) ---
class LerpSmoothScroll {
  constructor() {
    this.currentY = window.scrollY;
    this.targetY = window.scrollY;
    this.ease = 0.085; // Natural inertia damping
    this.isScrolling = false;
    this.rafId = null;
    this.enabled = false;
    // When set, the target is re-measured every frame so layout changes mid-scroll
    // (FAQ animating, images decoding, fonts swapping) never leave us at a stale position
    this.targetEl = null;
    this.onArrive = null;

    this.onWheel = this.onWheel.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.update = this.update.bind(this);

    this.init();
  }

  init() {
    // Only on desktop pointer devices, and never when the visitor asked for reduced motion
    if (window.matchMedia('(pointer: coarse)').matches || prefersReducedMotion()) {
      return;
    }

    this.enabled = true;
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

  clamp(y) {
    return Math.max(0, Math.min(y, this.maxScroll()));
  }

  scrollTo(targetY) {
    this.targetEl = null;
    this.onArrive = null;
    this.currentY = window.scrollY;
    this.targetY = this.clamp(targetY);
    this.start();
  }

  scrollToElement(el, onArrive) {
    this.targetEl = el;
    this.onArrive = onArrive || null;
    this.currentY = window.scrollY;
    this.targetY = this.clamp(elementScrollTop(el));
    this.start();
  }

  start() {
    if (!this.isScrolling) {
      this.isScrolling = true;
      this.rafId = requestAnimationFrame(this.update);
    }
  }

  // Any manual wheel/key input cancels a pending anchor jump
  releaseTarget() {
    this.targetEl = null;
    this.onArrive = null;
  }

  onWheel(e) {
    // Let an open dialog scroll its own content natively
    if (document.querySelector('dialog[open]')) return;
    e.preventDefault();
    this.releaseTarget();

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
    if (document.querySelector('dialog[open]')) return;

    let delta = 0;
    if (e.key === 'ArrowDown') delta = 90;
    else if (e.key === 'ArrowUp') delta = -90;
    else if (e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) delta = window.innerHeight * 0.8;
    else if (e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) delta = -window.innerHeight * 0.8;

    if (delta !== 0) {
      e.preventDefault();
      this.releaseTarget();
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
    if (this.targetEl) this.targetY = elementScrollTop(this.targetEl);
    this.targetY = this.clamp(this.targetY);

    const diff = this.targetY - this.currentY;
    this.currentY += diff * this.ease;

    if (Math.abs(diff) < 0.5) {
      this.currentY = this.targetY;
      window.scrollTo(0, Math.round(this.currentY));
      this.isScrolling = false;
      updateAllScrollEffects();
      const done = this.onArrive;
      this.releaseTarget();
      if (done) done();
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
    if (window.innerWidth <= 1199.98) {
      platformHeader.style.transform = 'none';
    } else {
      const platRect = platformSection.getBoundingClientRect();
      if (platRect.top < vh && platRect.bottom > 0) {
        // enterProgress: 0 when purple enters viewport, 1 when it reaches top
        const enterProgress = Math.max(0, Math.min(1, (vh - platRect.top) / vh));
        // Purple header smoothly floats upward with subtle parallax depth
        const headerOffset = (1 - enterProgress) * 36;
        platformHeader.style.transform = `translate3d(0, ${headerOffset.toFixed(1)}px, 0)`;
      } else if (platRect.top >= vh) {
        platformHeader.style.transform = 'translate3d(0, 36px, 0)';
      } else {
        platformHeader.style.transform = 'translate3d(0, 0, 0)';
      }
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

  const stickyCol = showcase.querySelector('.showcase-sticky-col');
  const dots = showcase.querySelectorAll('.showcase-dots span');
  const mobileQuery = window.matchMedia('(max-width: 1199.98px)');
  let activeIndex = -1;
  let scrubbing = false;
  let ticking = false;

  function setActive(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    cards.forEach((card, i) => card.classList.toggle('active', i === index));
    steps.forEach((step, i) => step.classList.toggle('active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }

  // Desktop: the step whose center is closest to the middle of the viewport wins; cards crossfade via CSS.
  function updateDesktop() {
    const triggerLine = window.innerHeight * 0.5;
    let bestIndex = 0;
    let minDistance = Infinity;

    steps.forEach((step, index) => {
      const rect = step.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height * 0.5 - triggerLine);
      if (distance < minDistance) {
        minDistance = distance;
        bestIndex = index;
      }
    });

    setActive(bestIndex);
  }

  // Mobile/tablet: cards slide sideways with the scroll. The slide runs while the next step's text crosses the
  // middle of the space under the pinned card, so the new image has landed before that text is read.
  // When scrolling stops between two steps, the card settles on the nearer one instead of resting half-slid.
  let shown = 0;
  let idleTimer = 0;

  function scrollPosition() {
    // clientHeight ignores the iOS toolbar resize, so the slide doesn't twitch when the address bar collapses
    const vh = document.documentElement.clientHeight;
    const cardBottom = Math.max(stickyCol.getBoundingClientRect().bottom, 0);
    const space = Math.max(vh - cardBottom, 1);
    const from = cardBottom + space * 0.8;
    const to = cardBottom + space * 0.4;
    let position = 0;

    for (let i = 1; i < steps.length; i++) {
      const top = steps[i].getBoundingClientRect().top;
      const t = Math.min(Math.max((from - top) / (from - to), 0), 1);
      position += t * t * (3 - 2 * t); // smoothstep: eases in and out of every slide
    }
    return position;
  }

  function render(position) {
    cards.forEach((card, i) => {
      card.style.transform = `translate3d(${(i - position) * 104}%, 0, 0)`;
      card.style.visibility = Math.abs(i - position) < 1 ? '' : 'hidden';
    });
    steps.forEach((step, i) => {
      step.style.opacity = String(1 - 0.65 * Math.min(Math.abs(position - i), 1));
    });
    setActive(Math.round(position));
  }

  // The card follows a target instead of jumping to it: the raw scroll position while the finger moves,
  // the nearest step once scrolling has paused. Easing toward it keeps both switches seamless.
  let target = 0;
  let following = false;

  function follow() {
    if (!scrubbing) { following = false; return; }
    shown += (target - shown) * 0.3;
    if (Math.abs(target - shown) < 0.002) shown = target;
    render(shown);
    following = shown !== target;
    if (following) requestAnimationFrame(follow);
  }

  function setTarget(value) {
    target = value;
    if (!following) {
      following = true;
      requestAnimationFrame(follow);
    }
  }

  function updateMobile() {
    const position = scrollPosition();
    clearTimeout(idleTimer);

    if (prefersReducedMotion()) {
      shown = target = Math.round(position);
      render(shown);
      return;
    }

    setTarget(position);
    idleTimer = setTimeout(() => setTarget(Math.round(scrollPosition())), 140);
  }

  function clearInlineStyles() {
    cards.forEach((card) => { card.style.transform = ''; card.style.visibility = ''; });
    steps.forEach((step) => { step.style.opacity = ''; });
  }

  function update() {
    ticking = false;
    const mobile = mobileQuery.matches && !!stickyCol;
    if (mobile !== scrubbing) {
      scrubbing = mobile;
      showcase.classList.toggle('is-scrubbing', mobile);
      if (mobile) shown = target = Math.round(scrollPosition());
      else clearInlineStyles();
    }
    if (scrubbing) updateMobile();
    else updateDesktop();
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
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
  window.lerpScroll = new LerpSmoothScroll();

  // Initialize Sticky Split-Scroll Showcase in Purple Platform Section
  initPlatformShowcase();

  // Listen to native scroll/resize for fallback or trackpad/touch
  window.addEventListener('scroll', updateAllScrollEffects, { passive: true });
  window.addEventListener('resize', updateAllScrollEffects);
  updateAllScrollEffects();

  // Mobile Menu Toggle, Backdrop & Scroll Locking
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  const menuBackdrop = document.getElementById('menu-backdrop');

  if (menuToggle && navLinks) {
    const closeMenu = () => {
      navLinks.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    };

    const openMenu = () => {
      navLinks.classList.add('active');
      menuToggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
    };

    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.contains('active');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (menuBackdrop) {
      menuBackdrop.addEventListener('click', closeMenu);
    }

    navLinks.querySelectorAll('a, button').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('active')) {
        closeMenu();
      }
    });
  }


  // Prevent dead anchor navigation (excluding brand-logo)
  document.querySelectorAll('a[href="#"]:not(.brand-logo)').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
    });
  });

  // Smooth scroll to top when brand logo is clicked (no instant snapping/teleporting)
  document.querySelectorAll('.brand-logo, .footer-brand-link').forEach(logo => {
    logo.addEventListener('click', (e) => {
      e.preventDefault();

      // Close mobile menu if open
      const navLinks = document.getElementById('nav-links');
      const menuToggle = document.getElementById('menu-toggle');
      if (navLinks && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      }

      if (window.lerpScroll && window.lerpScroll.enabled) {
        window.lerpScroll.scrollTo(0);
      } else {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'instant' : 'smooth' });
      }
    });
  });

  // Buttery smooth scroll for in-page anchor links (Nasıl çalışır?, Hakkımızda, Bekleme listesi, vb.)
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href === '#' || href === '#!') return;

    link.addEventListener('click', (e) => {
      const targetId = href.substring(1);
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      e.preventDefault();

      // Close mobile menu if open
      const navLinks = document.getElementById('nav-links');
      const menuToggle = document.getElementById('menu-toggle');
      if (navLinks && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      }

      // A section can point the jump at an inner element (e.g. the waitlist card)
      const anchor = targetEl.querySelector('[data-scroll-anchor]') || targetEl;

      // Focus the email field only after arriving, without letting focus() scroll the page
      const input = targetId === 'bekleme-listesi' ? targetEl.querySelector('.wishlist-input') : null;
      smoothScrollToElement(anchor, input ? () => input.focus({ preventScroll: true }) : null);
    });
  });

  // Initialize interactive navbar logo touch support
  initNavbarLogoInteraction();

  // Initialize custom wishlist forms validation and design language feedback
  initWishlistForms();

  // Smooth open/close for the FAQ accordion
  initFaqAccordion();

  // KVKK notice opens in a dialog instead of a separate page
  initLegalDialog();
});

// --- 7. Legal Dialog: loads kvkk.html's <main> once and shows it in a native <dialog> ---
function initLegalDialog() {
  const dialog = document.getElementById('legal-dialog');
  const links = document.querySelectorAll('a[data-legal-modal]');
  if (!dialog || !links.length || typeof dialog.showModal !== 'function') return; // fall back to the page

  const body = dialog.querySelector('.legal-dialog-body');
  const title = dialog.querySelector('.legal-dialog-title');
  let loaded = false;

  async function loadContent(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
    const main = doc.querySelector('main');
    if (!main) throw new Error('kvkk.html içinde <main> yok');
    main.querySelector('.legal-back')?.remove();
    const h1 = main.querySelector('h1');
    if (h1) {
      title.textContent = h1.textContent;
      h1.remove();
    }
    body.replaceChildren(...main.childNodes);
    loaded = true;
  }

  function close() {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    const finish = () => {
      dialog.classList.remove('is-closing');
      dialog.close();
    };
    if (prefersReducedMotion()) return finish();
    dialog.classList.add('is-closing');
    setTimeout(finish, 200);
  }

  links.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!loaded) {
        try {
          await loadContent(link.href);
        } catch (err) {
          console.error('Aydınlatma metni yüklenemedi, sayfaya yönlendiriliyor:', err);
          window.location.href = link.href;
          return;
        }
      }
      document.documentElement.classList.add('dialog-open');
      dialog.showModal();
      body.scrollTop = 0;
    });
  });

  dialog.querySelector('.legal-dialog-close')?.addEventListener('click', close);
  // Click on the dimmed backdrop (the dialog element itself, outside its content) closes it
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault(); // Esc: run the same animated close
    close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('dialog-open');
  });
}

// --- 6. FAQ Accordion: animates native <details> height (keeps keyboard & screen-reader behavior) ---
function initFaqAccordion() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const summary = item.querySelector('summary');
    if (!summary) return;
    let animation = null;

    summary.addEventListener('click', (e) => {
      if (prefersReducedMotion()) return; // native instant toggle
      e.preventDefault();

      const startHeight = item.offsetHeight;
      const closing = item.open && !item.classList.contains('is-closing');

      if (animation) animation.cancel();

      if (closing) {
        item.classList.add('is-closing');
        const endHeight = summary.offsetHeight;
        animation = item.animate(
          { height: [`${startHeight}px`, `${endHeight}px`] },
          { duration: 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        );
        animation.onfinish = () => {
          item.open = false;
          item.classList.remove('is-closing');
          animation = null;
        };
      } else {
        item.classList.remove('is-closing');
        item.open = true;
        const endHeight = item.offsetHeight;
        animation = item.animate(
          { height: [`${startHeight}px`, `${endHeight}px`] },
          { duration: 380, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        );
        animation.onfinish = () => { animation = null; };
      }
    });
  });
}

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

// --- 5. Custom Wishlist Form Validation & Design Language Feedback ---
function initWishlistForms() {
  document.querySelectorAll('.wishlist-form').forEach(form => {
    const input = form.querySelector('.wishlist-input');
    const wrap = form.closest('.cta-form-wrap');
    const feedback = wrap ? wrap.querySelector('.form-feedback') : null;

    if (!input) return;

    // Clear error state immediately when user begins typing
    input.addEventListener('input', () => {
      input.classList.remove('has-error');
      if (feedback && feedback.classList.contains('error')) {
        feedback.style.display = 'none';
      }
    });

    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email) {
        showError('Lütfen e-posta adresini gir.');
        return;
      }

      if (!emailRegex.test(email)) {
        showError('Lütfen geçerli bir e-posta adresi gir.');
        return;
      }

      const consent = form.querySelector('input[name="acik_riza"]');
      if (consent && !consent.checked) {
        showError('Devam etmek için onay kutusunu işaretle.', consent);
        return;
      }

      // Send the address to the collection service set in the form's action attribute
      const endpoint = form.getAttribute('action');
      if (!endpoint) {
        console.warn('Bekleme listesi formunun action adresi boş: e-posta hiçbir yere gönderilmedi.');
        showError('Kayıt şu an alınamıyor. Lütfen info@cashif.app adresine yaz.');
        return;
      }

      const originalLabel = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Gönderiliyor…';
      }

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        // Google Apps Script always answers 200; the JSON body says whether the row was saved
        const result = await response.json().catch(() => null);
        if (result && result.ok === false) throw new Error(result.error || 'rejected');
      } catch (err) {
        console.error('Bekleme listesi kaydı gönderilemedi:', err);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
        showError('Kayıt gönderilemedi. Bağlantını kontrol edip tekrar dene.');
        return;
      }

      // Success State
      input.classList.remove('has-error');
      form.style.display = 'none';
      if (feedback) {
        feedback.className = 'form-feedback success';
        feedback.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Bekleme listesine eklendin! Lansman tarihini ilk sen öğreneceksin.
        `;
        feedback.style.display = 'inline-flex';
      }
    });

    function showError(message, focusTarget = input) {
      if (focusTarget === input && !input.classList.contains('has-error')) {
        input.classList.add('has-error');
      }
      focusTarget.focus();
      if (feedback) {
        feedback.className = 'form-feedback error';
        feedback.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          ${message}
        `;
        feedback.style.display = 'inline-flex';
      }
    }
  });
}

