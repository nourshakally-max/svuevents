/* ============================================================
   دليل فعاليات الجامعة الافتراضية — SVU Events Guide
   main.js — منطق التفاعل الكامل
   ============================================================ */

'use strict';

/* ── 1. Page Loader ─────────────────────────────────────────── */
window.addEventListener('load', () => {
  const loader = document.getElementById('pageLoader');
  if (loader) {
    setTimeout(() => loader.classList.add('hidden'), 1200);
  }
});

/* ── 2. Dark / Light Mode ───────────────────────────────────── */
(function initDarkMode() {
  // استرجاع التفضيل المحفوظ أو استخدام الوضع الافتراضي (داكن)
  const saved = localStorage.getItem('svu-theme') || 'dark';
  if (saved === 'light') {
    document.body.classList.add('light-mode');
  }
  updateDarkModeIcons(saved);
})();

function toggleDarkMode() {
  const isLight = document.body.classList.toggle('light-mode');
  const theme = isLight ? 'light' : 'dark';
  localStorage.setItem('svu-theme', theme);
  updateDarkModeIcons(theme);
}

function updateDarkModeIcons(theme) {
  const btns = document.querySelectorAll('.dark-mode-btn');
  btns.forEach(btn => {
    const icon = btn.querySelector('i');
    if (!icon) return;
    if (theme === 'light') {
      icon.className = 'fas fa-moon';
      btn.setAttribute('title', 'تفعيل الوضع الداكن');
    } else {
      icon.className = 'fas fa-sun';
      btn.setAttribute('title', 'تفعيل الوضع الفاتح');
    }
  });
}

/* ── 3. Hero Slider ─────────────────────────────────────────── */
class HeroSlider {
  constructor(container) {
    if (!container) return;
    this.container   = container;
    this.slides      = container.querySelectorAll('.hero-slide');
    this.dots        = document.querySelectorAll('.slider-dot');
    this.current     = 0;
    this.total       = this.slides.length;
    this.interval    = null;
    this.duration    = 5000; // مدة كل شريحة بالميللي ثانية

    if (this.total < 2) return;
    this.start();
    this.bindArrows();
    this.bindDots();
    this.bindSwipe();
  }

  goTo(index) {
    this.slides[this.current].classList.remove('active');
    if (this.dots[this.current]) this.dots[this.current].classList.remove('active');
    this.current = (index + this.total) % this.total;
    this.slides[this.current].classList.add('active');
    if (this.dots[this.current]) this.dots[this.current].classList.add('active');
  }

  next() { this.goTo(this.current + 1); }
  prev() { this.goTo(this.current - 1); }

  start() {
    this.interval = setInterval(() => this.next(), this.duration);
  }

  restart() {
    clearInterval(this.interval);
    this.start();
  }

  bindArrows() {
    const nextBtn = document.querySelector('.slider-arrow.next');
    const prevBtn = document.querySelector('.slider-arrow.prev');
    if (nextBtn) nextBtn.addEventListener('click', () => { this.next(); this.restart(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { this.prev(); this.restart(); });
  }

  bindDots() {
    this.dots.forEach((dot, i) => {
      dot.addEventListener('click', () => { this.goTo(i); this.restart(); });
    });
  }

  bindSwipe() {
    let startX = 0;
    this.container.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
    this.container.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? this.next() : this.prev();
        this.restart();
      }
    });
  }
}

/* ── 4. Events Filtering & Search ───────────────────────────── */
class EventsFilter {
  constructor() {
    this.cards      = document.querySelectorAll('.event-card-wrap');
    this.filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
    this.searchInput = document.getElementById('eventsSearch');
    this.sortSelect  = document.getElementById('eventsSort');
    this.countEl     = document.getElementById('resultsCount');
    this.noResults   = document.getElementById('noResults');
    this.currentFilter = this.getSavedFilter() || 'all';

    if (!this.cards.length) return;
    this.init();
  }

  getSavedFilter() {
    return localStorage.getItem('svu-filter-category');
  }

  saveFilter(val) {
    localStorage.setItem('svu-filter-category', val);
  }

  init() {
    // تطبيق الفلتر المحفوظ
    this.setActiveBtn(this.currentFilter);
    this.applyFilter();

    // ربط الأزرار
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentFilter = btn.dataset.filter;
        this.saveFilter(this.currentFilter);
        this.setActiveBtn(this.currentFilter);
        this.applyFilter();
      });
    });

    // ربط البحث
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => this.applyFilter());
    }

    // ربط الترتيب
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', () => this.applyFilter());
    }
  }

  setActiveBtn(filter) {
    this.filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
  }

  applyFilter() {
    const query  = this.searchInput ? this.searchInput.value.trim().toLowerCase() : '';
    const sort   = this.sortSelect  ? this.sortSelect.value : 'default';
    let   visible = 0;

    const cardsArr = Array.from(this.cards);

    // ترتيب البطاقات
    if (sort === 'date-asc' || sort === 'date-desc') {
      cardsArr.sort((a, b) => {
        const dA = new Date(a.dataset.date || '2025-01-01');
        const dB = new Date(b.dataset.date || '2025-01-01');
        return sort === 'date-asc' ? dA - dB : dB - dA;
      });
      const grid = document.getElementById('eventsGrid');
      if (grid) cardsArr.forEach(c => grid.appendChild(c));
    }

    // تطبيق الفلتر + البحث
    cardsArr.forEach(card => {
      const category = card.dataset.category || '';
      const title    = (card.dataset.title    || '').toLowerCase();
      const matchCat = this.currentFilter === 'all' || category === this.currentFilter;
      const matchQ   = !query || title.includes(query);

      if (matchCat && matchQ) {
        card.style.display = '';
        card.style.animation = 'none';
        // إعادة تشغيل الانيميشن
        requestAnimationFrame(() => {
          card.style.animation = '';
          card.classList.add('animate-fade-up', 'visible');
        });
        visible++;
      } else {
        card.style.display = 'none';
      }
    });

    // عداد النتائج
    if (this.countEl) {
      this.countEl.textContent = `${visible} فعالية`;
    }

    // رسالة "لا توجد نتائج"
    if (this.noResults) {
      this.noResults.style.display = visible === 0 ? 'block' : 'none';
    }
  }
}

/* ── 5. Countdown Timer ─────────────────────────────────────── */
class CountdownTimer {
  constructor(el, targetDate) {
    this.el = el;
    this.target = new Date(targetDate).getTime();
    if (!this.el || isNaN(this.target)) return;
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  tick() {
    const now  = Date.now();
    const diff = this.target - now;

    if (diff <= 0) {
      clearInterval(this.timer);
      this.el.innerHTML = '<span class="text-gradient fw-bold">الفعالية بدأت!</span>';
      return;
    }

    const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    this.el.innerHTML = `
      <div class="countdown-unit">
        <span class="countdown-number">${String(days).padStart(2,'0')}</span>
        <span class="countdown-label">يوم</span>
      </div>
      <div class="countdown-unit">
        <span class="countdown-number">${String(hours).padStart(2,'0')}</span>
        <span class="countdown-label">ساعة</span>
      </div>
      <div class="countdown-unit">
        <span class="countdown-number">${String(minutes).padStart(2,'0')}</span>
        <span class="countdown-label">دقيقة</span>
      </div>
      <div class="countdown-unit">
        <span class="countdown-number">${String(seconds).padStart(2,'0')}</span>
        <span class="countdown-label">ثانية</span>
      </div>
    `;
  }
}

/* ── 6. Animated Counter (Stats) ────────────────────────────── */
function animateCounter(el, target, duration = 2000) {
  if (!el) return;
  const start    = 0;
  const startTime = performance.now();
  const suffix   = el.dataset.suffix || '';

  function update(currentTime) {
    const elapsed  = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // easing: ease-out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = Math.floor(start + (target - start) * eased);
    el.textContent = current.toLocaleString('ar-SA') + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/* ── 7. Scroll Animations (IntersectionObserver) ────────────── */
function initScrollAnimations() {
  // انيميشن دخول العناصر
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.animate-fade-up').forEach(el => observer.observe(el));

  // عداد الإحصائيات
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.target || '0', 10);
        animateCounter(entry.target, target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-number[data-target]').forEach(el => counterObserver.observe(el));
}

/* ── 8. Scroll-to-Top Button ────────────────────────────────── */
function initScrollTop() {
  const btn = document.querySelector('.scroll-top-btn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ── 9. Contact Form Validation ─────────────────────────────── */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    clearAlerts();

    const name    = document.getElementById('contactName');
    const email   = document.getElementById('contactEmail');
    const subject = document.getElementById('contactSubject');
    const message = document.getElementById('contactMessage');

    let valid = true;

    // التحقق من الاسم
    if (!name.value.trim() || name.value.trim().length < 3) {
      setInvalid(name, 'يرجى إدخال اسمك الكامل (3 أحرف على الأقل)');
      valid = false;
    } else {
      setValid(name);
    }

    // التحقق من البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
      setInvalid(email, 'يرجى إدخال بريد إلكتروني صحيح');
      valid = false;
    } else {
      setValid(email);
    }

    // التحقق من الموضوع
    if (subject && (!subject.value.trim() || subject.value.trim().length < 5)) {
      setInvalid(subject, 'يرجى إدخال موضوع الرسالة');
      valid = false;
    } else if (subject) {
      setValid(subject);
    }

    // التحقق من الرسالة
    if (!message.value.trim() || message.value.trim().length < 20) {
      setInvalid(message, 'يرجى كتابة رسالتك (20 حرفاً على الأقل)');
      valid = false;
    } else {
      setValid(message);
    }

    if (valid) {
      showAlert('success', '✅ تم إرسال رسالتك بنجاح! سيتواصل معك فريقنا قريباً.');
      // محاكاة إرسال النموذج
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        const orig = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>جاري الإرسال...';
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = orig;
          form.reset();
          form.querySelectorAll('.form-control-custom, .form-control').forEach(el => {
            el.classList.remove('is-valid', 'is-invalid');
          });
        }, 2000);
      }
    } else {
      showAlert('danger', '❌ يوجد أخطاء في النموذج. يرجى مراجعة الحقول المحددة.');
    }
  });

  // التحقق الفوري عند الكتابة
  form.querySelectorAll('.form-control-custom, .form-control').forEach(input => {
    input.addEventListener('blur', function() {
      if (this.value.trim()) {
        this.classList.remove('is-invalid');
        this.classList.add('is-valid');
      }
    });
  });
}

function setInvalid(input, msg) {
  input.classList.add('is-invalid');
  input.classList.remove('is-valid');
  let fb = input.nextElementSibling;
  if (!fb || !fb.classList.contains('invalid-feedback')) {
    fb = document.createElement('div');
    fb.className = 'invalid-feedback';
    input.parentNode.insertBefore(fb, input.nextSibling);
  }
  fb.textContent = msg;
  fb.style.display = 'block';
}

function setValid(input) {
  input.classList.remove('is-invalid');
  input.classList.add('is-valid');
  const fb = input.nextElementSibling;
  if (fb && fb.classList.contains('invalid-feedback')) {
    fb.style.display = 'none';
  }
}

function showAlert(type, msg) {
  const container = document.getElementById('formAlerts');
  if (!container) return;
  const icons = { success: 'check-circle', danger: 'exclamation-circle', warning: 'exclamation-triangle', info: 'info-circle' };
  const icon  = icons[type] || 'info-circle';
  container.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2" role="alert">
      <i class="fas fa-${icon}"></i>
      <span>${msg}</span>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="إغلاق"></button>
    </div>
  `;
  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearAlerts() {
  const container = document.getElementById('formAlerts');
  if (container) container.innerHTML = '';
}

/* ── 10. Booking Modal ───────────────────────────────────────── */
function initBookingModal() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const nameEl  = document.getElementById('bookName');
    const emailEl = document.getElementById('bookEmail');
    const seatsEl = document.getElementById('bookSeats');
    let valid = true;

    if (!nameEl.value.trim()) { nameEl.classList.add('is-invalid'); valid = false; }
    else { nameEl.classList.remove('is-invalid'); nameEl.classList.add('is-valid'); }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailEl.value.trim() || !emailRegex.test(emailEl.value.trim())) {
      emailEl.classList.add('is-invalid');
      valid = false;
    } else {
      emailEl.classList.remove('is-invalid');
      emailEl.classList.add('is-valid');
    }

    if (valid) {
      const modal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
      if (modal) modal.hide();
      // عرض تأكيد الحجز
      const toast = document.getElementById('bookingToast');
      if (toast) {
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
      }
      showBookingSuccess(nameEl.value, seatsEl ? seatsEl.value : 1);
      form.reset();
      form.querySelectorAll('.is-valid,.is-invalid').forEach(el => el.classList.remove('is-valid','is-invalid'));
    }
  });
}

function showBookingSuccess(name, seats) {
  const el = document.getElementById('bookingSuccess');
  if (!el) return;
  el.innerHTML = `
    <div class="alert alert-success d-flex align-items-center gap-3 animate-fade-up visible">
      <i class="fas fa-check-circle fa-2x"></i>
      <div>
        <strong>تم الحجز بنجاح! 🎉</strong><br>
        <small>مرحباً ${name}، تم حجز ${seats} مقعد(مقاعد) بنجاح. ستصلك رسالة تأكيد على بريدك الإلكتروني.</small>
      </div>
    </div>
  `;
  el.scrollIntoView({ behavior: 'smooth' });
}

/* ── 11. Favorite Toggle ─────────────────────────────────────── */
function initFavorites() {
  document.querySelectorAll('.event-card-favorite').forEach(btn => {
    const eventId = btn.dataset.eventId || '';
    const favs    = JSON.parse(localStorage.getItem('svu-favorites') || '[]');
    if (favs.includes(eventId)) {
      btn.classList.add('active');
      const icon = btn.querySelector('i');
      if (icon) { icon.className = 'fas fa-heart'; }
    }

    btn.addEventListener('click', function() {
      const favList = JSON.parse(localStorage.getItem('svu-favorites') || '[]');
      const id      = this.dataset.eventId || '';
      const icon    = this.querySelector('i');

      if (favList.includes(id)) {
        const idx = favList.indexOf(id);
        favList.splice(idx, 1);
        this.classList.remove('active');
        if (icon) icon.className = 'far fa-heart';
      } else {
        favList.push(id);
        this.classList.add('active');
        if (icon) icon.className = 'fas fa-heart';
        // تأثير بصري
        this.style.transform = 'scale(1.4)';
        setTimeout(() => { this.style.transform = ''; }, 300);
      }
      localStorage.setItem('svu-favorites', JSON.stringify(favList));
    });
  });
}

/* ── 12. Navbar Scroll Effect ───────────────────────────────── */
function initNavbarScroll() {
  const navbar = document.querySelector('.svu-navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      navbar.style.padding = '0.4rem 0';
      navbar.style.boxShadow = '0 8px 40px rgba(0,0,0,0.5)';
    } else {
      navbar.style.padding = '';
      navbar.style.boxShadow = '';
    }
  }, { passive: true });
}

/* ── 13. Highlight Active Nav Link ──────────────────────────── */
function highlightActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.svu-navbar .nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/* ── 14. Lazy Load Images ───────────────────────────────────── */
function initLazyLoad() {
  const images = document.querySelectorAll('img[data-src]');
  if (!images.length) return;

  const imgObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        img.classList.add('fade-in');
        imgObserver.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  images.forEach(img => imgObserver.observe(img));
}

/* ── 15. Tab Filter on Homepage ─────────────────────────────── */
function initHomeFilter() {
  const btns  = document.querySelectorAll('.home-filter-btn');
  const cards = document.querySelectorAll('.home-event-item');
  if (!btns.length || !cards.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', function() {
      btns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const filter = this.dataset.filter;
      cards.forEach(card => {
        const cat = card.dataset.category || '';
        const show = filter === 'all' || cat === filter;
        card.style.display = show ? '' : 'none';
        if (show) {
          card.classList.remove('visible');
          requestAnimationFrame(() => card.classList.add('visible'));
        }
      });
    });
  });
}

/* ── 16. Gallery Lightbox (simple) ──────────────────────────── */
function initGallery() {
  const items = document.querySelectorAll('.gallery-item');
  if (!items.length) return;

  items.forEach(item => {
    item.addEventListener('click', function() {
      const src = this.querySelector('img')?.src;
      if (!src) return;

      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;
        display:flex;align-items:center;justify-content:center;cursor:zoom-out;
        animation:fadeInDown 0.3s ease;
      `;
      const img = document.createElement('img');
      img.src = src;
      img.style.cssText = `
        max-width:90vw;max-height:90vh;object-fit:contain;
        border-radius:12px;box-shadow:0 20px 80px rgba(0,0,0,0.8);
      `;
      overlay.appendChild(img);
      overlay.addEventListener('click', () => overlay.remove());
      document.body.appendChild(overlay);
    });
  });
}

/* ── 17. Toast Notification ─────────────────────────────────── */
function showToast(msg, type = 'success') {
  const wrap = document.getElementById('toastContainer');
  if (!wrap) return;
  const id   = 'toast_' + Date.now();
  const icons = { success: 'check-circle text-success', danger: 'times-circle text-danger', info: 'info-circle text-info' };
  wrap.insertAdjacentHTML('beforeend', `
    <div id="${id}" class="toast align-items-center border-0 bg-dark text-white" role="alert">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="fas fa-${icons[type] || icons.info}"></i>
          ${msg}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `);
  const el = document.getElementById(id);
  const t  = new bootstrap.Toast(el, { delay: 4000 });
  t.show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}

/* ── 18. Search Live on Homepage ────────────────────────────── */
function initHeroSearch() {
  const searchBtn = document.getElementById('heroSearchBtn');
  const searchInput = document.getElementById('heroSearchInput');
  if (!searchBtn || !searchInput) return;

  searchBtn.addEventListener('click', () => {
    const q = searchInput.value.trim();
    if (q) {
      window.location.href = `events.html?q=${encodeURIComponent(q)}`;
    } else {
      window.location.href = 'events.html';
    }
  });

  searchInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') searchBtn.click();
  });
}

/* ── 19. URL Search Params (للفلترة من Homepage) ───────────── */
function applyURLParams() {
  const params = new URLSearchParams(window.location.search);
  const q      = params.get('q');
  const cat    = params.get('cat');

  if (q) {
    const input = document.getElementById('eventsSearch');
    if (input) { input.value = q; }
  }

  if (cat) {
    localStorage.setItem('svu-filter-category', cat);
  }
}

/* ── 20. Smooth link transitions ─────────────────────────────── */
function initPageTransitions() {
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    // تجاهل روابط الإرساء والمودال والخارجية
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;
    link.addEventListener('click', function(e) {
      // لا نضيف أنيميشن للروابط Bootstrap مثل data-bs-*
      if (this.dataset.bsToggle || this.dataset.bsDismiss) return;
    });
  });
}

/* ── 21. Initialize All on DOMContentLoaded ─────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  /* الخطوات العامة لجميع الصفحات */
  highlightActiveNav();
  initScrollTop();
  initScrollAnimations();
  initNavbarScroll();
  initFavorites();
  initLazyLoad();
  initGallery();
  initPageTransitions();

  /* Hero Slider */
  const heroSliderEl = document.querySelector('.hero-bg-slider');
  if (heroSliderEl) {
    window.heroSlider = new HeroSlider(heroSliderEl);
  }

  /* فلترة الفعاليات (صفحة events.html) */
  applyURLParams();
  const eventsGrid = document.getElementById('eventsGrid');
  if (eventsGrid) {
    window.eventsFilter = new EventsFilter();
  }

  /* فلترة الصفحة الرئيسية */
  initHomeFilter();

  /* Countdown timers */
  document.querySelectorAll('.countdown-widget[data-target-date]').forEach(el => {
    new CountdownTimer(el, el.dataset.targetDate);
  });

  /* نموذج التواصل */
  initContactForm();

  /* نموذج الحجز */
  initBookingModal();

  /* بحث الهيرو */
  initHeroSearch();

  /* Dark mode button */
  document.querySelectorAll('.dark-mode-btn').forEach(btn => {
    btn.addEventListener('click', toggleDarkMode);
  });
});
