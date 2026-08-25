// Hair Art — site interactions

// ===== Zentrale Salondaten =====
const SALON = {
  adresse: 'Stromstr. 37, 10551 Berlin',
  telefon: '+49303962576',           // Festnetz Salon
  mobil: '+491779718633',            // Handy
  whatsapp: '491779718633',          // ohne + und ohne führende 0
  instagram: 'coiffeur_elif_',
  email: 'elifozserik11@gmail.com',
};

document.addEventListener('DOMContentLoaded', () => {

  // ===== Karte: Zwei-Klick-Lösung (Google Maps erst nach Zustimmung) =====
  const mapWrap = document.getElementById('mapWrap');
  const mapBtn = document.getElementById('mapLoadBtn');
  const mapExternal = document.getElementById('mapExternal');
  const query = encodeURIComponent(SALON.adresse);

  if (mapExternal) {
    mapExternal.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  if (mapBtn && mapWrap) {
    mapBtn.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.google.com/maps?q=${query}&hl=de&z=16&output=embed`;
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.title = `Karte: ${SALON.adresse}`;
      iframe.allowFullscreen = true;
      mapWrap.classList.add('is-loaded');
      mapWrap.innerHTML = '';
      mapWrap.appendChild(iframe);
    });
  }


  // Smooth scrolling (Lenis 1.3.x — autoRaf übernimmt den RAF-Loop)
  const lenis = new Lenis({
    autoRaf: true,
    lerp: 0.09,
    smoothWheel: true,
    touchMultiplier: 1.6,
  });

  // Anker-Links über Lenis führen
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -70 });
    });
  });

  // Logo-Badge: verblasst als Standbild über den ersten Viewport, dann weg
  const watermark = document.getElementById('logoWatermark');
  if (watermark) {
    const fadeWatermark = () => {
      const distance = window.innerHeight * 0.9;
      const progress = Math.min(1, window.scrollY / distance);
      const opacity = 1 - progress;
      watermark.style.opacity = opacity;
      watermark.style.transform = `translate(-50%, -50%) scale(${1 - progress * 0.15})`;
      watermark.classList.toggle('is-hidden', progress >= 1);
    };
    fadeWatermark();
    lenis.on('scroll', fadeWatermark);
    window.addEventListener('scroll', fadeWatermark, { passive: true }); // Fallback, falls Lenis das scroll-Event mal nicht feuert
    window.addEventListener('resize', fadeWatermark);
  }

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Header scroll state
  const header = document.getElementById('header');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile nav toggle
  const burger = document.getElementById('burger');
  const navMobile = document.getElementById('navMobile');
  burger.addEventListener('click', () => {
    navMobile.classList.toggle('open');
  });
  navMobile.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navMobile.classList.remove('open'));
  });

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  // Background focus: transparente Zonen bestimmen, welches Portrait hervortritt
  const focusZones = document.querySelectorAll('[data-focus]');
  const focusIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const focus = entry.target.dataset.focus;
      document.body.classList.toggle('focus-marilyn', focus === 'marilyn');
      document.body.classList.toggle('focus-audrey', focus === 'audrey');
      document.body.classList.toggle('focus-rollers', focus === 'rollers');
    });
  }, { threshold: 0.4 });
  focusZones.forEach(el => focusIo.observe(el));

  // Videos nur abspielen, solange sie im Viewport sind
  const videos = document.querySelectorAll('.work-video video, .salon-media video');
  const videoIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const v = entry.target;
      if (entry.isIntersecting) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.35 });
  videos.forEach(v => videoIo.observe(v));

  // ===== Terminanfrage =====
  // Kein Backend: die Anfrage wird als fertiger Text an Instagram oder E-Mail
  // übergeben. Instagram erlaubt kein automatisches Senden von DMs —
  // daher Text in die Zwischenablage + Chat öffnen.
  const WHATSAPP_NUMBER = SALON.whatsapp;
  const INSTAGRAM_HANDLE = SALON.instagram;
  const EMAIL = SALON.email;

  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');

  const buildMessage = () => {
    const val = (id) => (document.getElementById(id)?.value || '').trim();
    const lines = [
      'Terminanfrage — The Hair Art\'s',
      '',
      `Name: ${val('name') || '—'}`,
      `E-Mail: ${val('email') || '—'}`,
      `Telefon: ${val('phone') || '—'}`,
      `Leistung: ${val('service')}`,
      `Wunschtermin: ${val('wunschtermin') || '—'}`,
      '',
      'Was gemacht werden soll:',
      val('message') || '—',
    ];
    return lines.join('\n');
  };

  const isValid = () => {
    if (!form.reportValidity()) return false;
    return true;
  };

  document.querySelectorAll('[data-send]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!isValid()) return;

      const text = buildMessage();
      const mode = btn.dataset.send;

      if (mode === 'whatsapp') {
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
        note.textContent = 'WhatsApp geöffnet — Nachricht ist vorausgefüllt.';

      } else if (mode === 'instagram') {
        try {
          await navigator.clipboard.writeText(text);
          note.textContent = 'Anfrage kopiert — im DM-Chat einfach einfügen und senden.';
        } catch {
          note.textContent = 'Instagram geöffnet — bitte Anfrage im Chat eintragen.';
        }
        window.open(`https://ig.me/m/${INSTAGRAM_HANDLE}`, '_blank', 'noopener');

      } else if (mode === 'email') {
        const subject = 'Terminanfrage — The Hair Art\'s';
        window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
        note.textContent = 'E-Mail-Programm geöffnet.';
      }
    });
  });

  form.addEventListener('submit', (e) => e.preventDefault());

});
