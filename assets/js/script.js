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

// ===== Spruch des Tages =====
// Hier trägt Elif ihre eigenen Sätze ein — einer pro Zeile, in Anführungszeichen,
// am Ende ein Komma. Die Liste darf beliebig lang werden; je mehr Einträge,
// desto länger dauert es, bis sich etwas wiederholt.
// Die folgenden Sätze sind Platzhalter und sollten durch ihre eigenen ersetzt werden.
const SPRUECHE = [
  'Ein guter Schnitt ersetzt keinen guten Tag — aber er hilft.',
  'Haare wachsen nach. Mut zur Veränderung auch.',
  'Die beste Farbe ist die, bei der man dich sieht und nicht sie.',
  'Wer morgens in den Spiegel lächelt, hat den Tag schon halb gewonnen.',
  'Es gibt keine schlechten Haare. Nur den falschen Schnitt.',
  'Manchmal braucht es keine neue Farbe. Nur eine ehrliche Beratung.',
  'Volumen ist keine Frage der Menge, sondern der Form.',
  'Blond ist ein Weg, kein Termin.',
  'Der schönste Moment ist der Blick in den Spiegel am Ende.',
  'Pflege ist das, was zwischen zwei Terminen passiert.',
  'Zeit ist die Zutat, die man einem Haarschnitt ansieht.',
  'Locken brauchen keinen Kampf, nur die richtige Technik.',
  'Eine Frisur soll zu dir passen, nicht zum Trend.',
  'Zuhören ist der erste Schritt jeder guten Farbe.',
];

document.addEventListener('DOMContentLoaded', () => {

  // Spruch des Tages einsetzen
  const spruchEl = document.getElementById('spruchText');
  if (spruchEl && SPRUECHE.length) {
    const jetzt = new Date();
    const jahresStart = new Date(jetzt.getFullYear(), 0, 0);
    const tagImJahr = Math.floor((jetzt - jahresStart) / 86400000);

    spruchEl.textContent = SPRUECHE[tagImJahr % SPRUECHE.length];

    const datumEl = document.getElementById('spruchDatum');
    if (datumEl) {
      datumEl.textContent = jetzt.toLocaleDateString('de-DE', {
        weekday: 'long', day: 'numeric', month: 'long',
      });
    }
    document.getElementById('spruch').hidden = false;
  }


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

  // Anker-Links über Lenis führen.
  // data-preselect: der CTA einer Section wählt die passende Leistung im Formular vor
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();

      const wunsch = link.dataset.preselect;
      if (wunsch) {
        const sel = document.getElementById('service');
        const treffer = sel && [...sel.options].find(o => o.value.toLowerCase().includes(wunsch.toLowerCase()));
        if (treffer) sel.value = treffer.value;
      }

      lenis.scrollTo(target, { offset: -70 });
    });
  });

  // Hero-Video einblenden, sobald das erste Bild steht
  const heroVideo = document.getElementById('heroVideo');
  if (heroVideo) {
    const zeigen = () => heroVideo.classList.add('is-ready');
    if (heroVideo.readyState >= 2) zeigen();
    else heroVideo.addEventListener('loadeddata', zeigen, { once: true });
    // Sicherheitsnetz, falls loadeddata ausbleibt
    setTimeout(zeigen, 2500);
  }

  // ===== Statement: Fortschritt durch die Section als CSS-Variablen =====
  // --p läuft von 0 (Section kommt ins Bild) bis 1 (oben raus),
  // --b steuert daraus die Überblendung Bild A → Bild B.
  const schichten = [...document.querySelectorAll('[data-blende]')]
    .filter(s => s.querySelector('[data-schicht]'));
  if (schichten.length) {
    let schichtTick = false;
    const rechne = () => {
      schichtTick = false;
      const vh = window.innerHeight;
      for (const sec of schichten) {
        const r = sec.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;
        const [start, dauer] = (sec.dataset.blende || '0.3 0.3').split(' ').map(Number);
        const p = Math.min(1, Math.max(0, (vh - r.top) / (r.height + vh)));
        sec.style.setProperty('--p', p.toFixed(3));
        sec.style.setProperty('--b', Math.min(1, Math.max(0, (p - start) / dauer)).toFixed(3));
      }
    };
    const schichtAnfordern = () => {
      if (schichtTick) return;
      schichtTick = true;
      requestAnimationFrame(rechne);
    };
    rechne();
    lenis.on('scroll', schichtAnfordern);
    window.addEventListener('scroll', schichtAnfordern, { passive: true });
    window.addEventListener('resize', schichtAnfordern);
  }

  // ===== 3D-Blume: öffnet und dreht sich beim Scrollen =====
  // --auf läuft von 0 auf 1, während die Blume durchs Bild wandert,
  // --dreh dreht sie dabei eine knappe halbe Umdrehung weiter.
  const blume = document.getElementById('blume');
  if (blume && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let blumeTick = false;
    const blumeRechnen = () => {
      blumeTick = false;
      const r = blume.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      // 0 = Blume betritt das Bild von unten, 1 = sie verlässt es oben
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      // Öffnen in der ersten Hälfte, danach bleibt sie offen
      blume.style.setProperty('--auf', Math.min(1, p / 0.55).toFixed(3));
      blume.style.setProperty('--dreh', (p * 160).toFixed(1) + 'deg');
    };
    const blumeAnfordern = () => {
      if (blumeTick) return;
      blumeTick = true;
      requestAnimationFrame(blumeRechnen);
    };
    blumeRechnen();
    lenis.on('scroll', blumeAnfordern);
    window.addEventListener('scroll', blumeAnfordern, { passive: true });
    window.addEventListener('resize', blumeAnfordern);
  }

  // ===== Ranke: wächst mit dem Scrollfortschritt =====
  // Jeder Pfad bekommt sein eigenes Fenster im Scrollverlauf, dadurch wächst
  // die Pflanze von unten nach oben statt überall gleichzeitig.
  const ranke = document.getElementById('ranke');
  if (ranke && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const pfade = [...ranke.querySelectorAll('path')];
    const letzterStart = 0.72;          // bis hierhin ist alles gezeichnet
    const ueberlappung = 0.18;          // Pfade gehen ineinander über

    const fenster = pfade.map((el, i) => {
      const start = (i / pfade.length) * letzterStart;
      return { el, start, ende: start + letzterStart / pfade.length + ueberlappung };
    });

    let angefordert = false;
    const wachsen = () => {
      angefordert = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      for (const { el, start, ende } of fenster) {
        const t = Math.min(1, Math.max(0, (p - start) / (ende - start)));
        el.style.strokeDashoffset = String(1 - t);
      }
    };
    const anfordern = () => {
      if (angefordert) return;
      angefordert = true;
      requestAnimationFrame(wachsen);
    };

    wachsen();
    lenis.on('scroll', anfordern);
    window.addEventListener('scroll', anfordern, { passive: true });
    window.addEventListener('resize', anfordern);
  }

  // ===== Logo-Badge =====
  // Sichtbar im Hero. Sections mit data-logo="weg" schieben es nach hinten,
  // data-logo="da" holt es zurück. Steuerung also im HTML, nicht über Pixel.
  const watermark = document.getElementById('logoWatermark');
  if (watermark) {
    const zonen = document.querySelectorAll('[data-logo]');
    if (zonen.length) {
      const logoIo = new IntersectionObserver((eintraege) => {
        // Die unterste gerade sichtbare Zone gewinnt
        const sichtbar = eintraege.filter(e => e.isIntersecting);
        if (!sichtbar.length) return;
        const aktuell = sichtbar.sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
        ).pop();
        const modus = aktuell.target.dataset.logo;   // da | leise | weg
        watermark.classList.toggle('is-back',  modus === 'weg');
        watermark.classList.toggle('is-quiet', modus === 'leise');
      }, { threshold: 0.3 });
      zonen.forEach(z => logoIo.observe(z));
    }
  }


  // ===== Galerie: ziehen, wischen, Pfeile =====
  const bahn = document.getElementById('galerieBahn');
  if (bahn) {
    const schritt = () => {
      const item = bahn.querySelector('.galerie-item');
      return item ? item.offsetWidth + 20 : 300;
    };

    document.getElementById('galerieVor')?.addEventListener('click',
      () => bahn.scrollBy({ left: schritt(), behavior: 'smooth' }));
    document.getElementById('galerieZurueck')?.addEventListener('click',
      () => bahn.scrollBy({ left: -schritt(), behavior: 'smooth' }));

    // Pfeile ausgrauen, wenn es in die Richtung nicht weitergeht
    const pfeileAktualisieren = () => {
      const ende = bahn.scrollWidth - bahn.clientWidth;
      const zurueck = document.getElementById('galerieZurueck');
      const vor = document.getElementById('galerieVor');
      if (zurueck) zurueck.disabled = bahn.scrollLeft <= 2;
      if (vor) vor.disabled = bahn.scrollLeft >= ende - 2;
    };
    bahn.addEventListener('scroll', pfeileAktualisieren, { passive: true });
    window.addEventListener('resize', pfeileAktualisieren);
    pfeileAktualisieren();

    // Mit der Maus ziehen. Touch macht der Browser von selbst.
    let zieht = false, startX = 0, startScroll = 0, bewegt = 0;

    bahn.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      zieht = true;
      bewegt = 0;
      startX = e.clientX;
      startScroll = bahn.scrollLeft;
      bahn.classList.add('is-dragging');
      bahn.setPointerCapture(e.pointerId);
    });

    bahn.addEventListener('pointermove', (e) => {
      if (!zieht) return;
      const weg = e.clientX - startX;
      bewegt = Math.max(bewegt, Math.abs(weg));
      bahn.scrollLeft = startScroll - weg;
    });

    const loslassen = (e) => {
      if (!zieht) return;
      zieht = false;
      bahn.classList.remove('is-dragging');
      if (e.pointerId !== undefined && bahn.hasPointerCapture?.(e.pointerId)) {
        bahn.releasePointerCapture(e.pointerId);
      }
    };
    bahn.addEventListener('pointerup', loslassen);
    bahn.addEventListener('pointercancel', loslassen);

    // Nach dem Ziehen keinen Klick auslösen
    bahn.addEventListener('click', (e) => {
      if (bewegt > 6) { e.preventDefault(); e.stopPropagation(); }
    }, true);
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
