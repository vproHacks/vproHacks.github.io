(function (global) {
  'use strict';

  var STORAGE_KEY = 'vpro_intro_seen';
  var timers = [];
  var staticRaf = null;
  var staticOn = false;
  var pendingNav = null;

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
    staticOn = false;
    if (staticRaf) cancelAnimationFrame(staticRaf);
    staticRaf = null;
  }

  function go(ms, fn) {
    timers.push(setTimeout(fn, ms));
  }

  function prefersReducedMotion() {
    return global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function drawStatic(ctx, canvas, intensity) {
    var w = canvas.width;
    var h = canvas.height;
    var id = ctx.createImageData(w, h);
    var d = id.data;
    for (var i = 0; i < d.length; i += 4) {
      var on = Math.random() < intensity;
      var v = on ? ((Math.random() * 200 + 55) | 0) : 0;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = on ? ((v * 0.74) | 0) : 0;
    }
    ctx.putImageData(id, 0, 0);
  }

  function startStatic(ctx, canvas, intensity, fps) {
    staticOn = true;
    var ms = 1000 / fps;
    var last = 0;
    (function loop(ts) {
      if (!staticOn) return;
      if (ts - last > ms) {
        drawStatic(ctx, canvas, intensity);
        last = ts;
      }
      staticRaf = requestAnimationFrame(loop);
    })(0);
  }

  function stopStatic(ctx, canvas) {
    staticOn = false;
    if (staticRaf) cancelAnimationFrame(staticRaf);
    staticRaf = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function show(el, dur, extra) {
    if (!el) return;
    el.style.transition = 'opacity ' + (dur || 0.3) + 's' + (extra ? ', ' + extra : '');
    el.style.opacity = '1';
  }

  function resetViCell(glyph, cursor) {
    if (!glyph || !cursor) return;
    glyph.style.animation = 'none';
    cursor.style.animation = 'none';
    glyph.style.opacity = '0';
    cursor.style.opacity = '1';
    void glyph.offsetWidth;
    glyph.style.animation = '';
    cursor.style.animation = '';
  }

  function activateViCell(glyph, cursor) {
    resetViCell(glyph, cursor);
    cursor.classList.add('vi-cell__cursor--active');
    glyph.classList.add('vi-cell__glyph--active');
  }

  function resetIntro(intro) {
    var screen = intro.querySelector('#crt-screen');
    var canvas = intro.querySelector('#crt-canvas');
    var ctx = canvas.getContext('2d');
    var content = intro.querySelector('#intro-content');
    var wordmark = intro.querySelector('#intro-wordmark');
    var wmText = intro.querySelector('#intro-wm-text');
    var wmCursor = intro.querySelector('#intro-wm-cursor');
    var statusEl = intro.querySelector('#intro-status');
    var sweep = intro.querySelector('#intro-sweep');
    var viGlyph = intro.querySelector('#intro-vi-v');
    var viCursor = intro.querySelector('#intro-vi-cursor');
    var gbs = [intro.querySelector('#gb1'), intro.querySelector('#gb2'), intro.querySelector('#gb3')];

    intro.classList.remove('crt-intro--hidden');
    intro.style.opacity = '1';
    intro.style.pointerEvents = 'all';
    intro.setAttribute('aria-hidden', 'false');
    intro.dataset.playing = '0';
    document.body.classList.add('crt-intro-active');

    screen.style.transition = 'none';
    screen.style.transform = 'scaleY(0.003)';
    screen.style.filter = 'none';

    canvas.style.opacity = '0';
    canvas.style.transition = 'none';
    stopStatic(ctx, canvas);

    content.style.opacity = '0';
    content.style.transition = 'none';

    if (wmText) wmText.textContent = '';
    if (wmCursor) {
      wmCursor.style.opacity = '0';
      wmCursor.style.animation = 'none';
    }
    if (wordmark) {
      wordmark.style.opacity = '1';
      wordmark.style.transform = 'none';
      wordmark.style.textShadow = 'none';
    }

    if (statusEl) {
      statusEl.style.opacity = '0';
      statusEl.textContent = 'INITIALIZING...';
      statusEl.style.color = '';
      statusEl.style.textShadow = '';
    }

    sweep.style.opacity = '0';
    sweep.style.transition = 'none';
    sweep.style.top = '0';

    if (viGlyph && viCursor) {
      viGlyph.classList.remove('vi-cell__glyph--active');
      viCursor.classList.remove('vi-cell__cursor--active');
      resetViCell(viGlyph, viCursor);
    }

    gbs.forEach(function (gb) {
      if (gb) gb.style.opacity = '0';
    });

    return {
      screen: screen,
      canvas: canvas,
      ctx: ctx,
      content: content,
      wordmark: wordmark,
      wmText: wmText,
      wmCursor: wmCursor,
      statusEl: statusEl,
      sweep: sweep,
      viGlyph: viGlyph,
      viCursor: viCursor,
      gbs: gbs
    };
  }

  function hideIntro(intro, markSeen) {
    intro.classList.add('crt-intro--hidden');
    intro.style.pointerEvents = 'none';
    intro.setAttribute('aria-hidden', 'true');
    intro.dataset.playing = '0';
    document.body.classList.remove('crt-intro-active');
    if (markSeen) {
      try {
        localStorage.setItem(STORAGE_KEY, '1');
      } catch (e) { /* ignore */ }
    }
    if (pendingNav) {
      global.location.href = pendingNav;
      pendingNav = null;
    }
  }

  function viTypeLetter(wmText, wmCursor, letters, index, interval, onDone) {
    if (index >= letters.length) {
      if (onDone) onDone();
      return;
    }
    wmText.textContent += letters.charAt(index);
    timers.push(setTimeout(function () {
      viTypeLetter(wmText, wmCursor, letters, index + 1, interval, onDone);
    }, interval));
  }

  function runSequence(intro, markSeen) {
    if (intro.dataset.playing === '1') return;
    intro.dataset.playing = '1';

    var els = resetIntro(intro);

    if (prefersReducedMotion()) {
      els.content.style.opacity = '1';
      els.wmText.textContent = 'VPRO';
      if (els.wmCursor) els.wmCursor.style.display = 'none';
      if (els.viGlyph) els.viGlyph.style.opacity = '1';
      if (els.viCursor) els.viCursor.style.display = 'none';
      if (els.statusEl) els.statusEl.textContent = 'READY';
      timers.push(setTimeout(function () {
        hideIntro(intro, markSeen);
      }, 400));
      return;
    }

    go(300, function () {
      els.canvas.style.opacity = '0.85';
      startStatic(els.ctx, els.canvas, 0.44, 24);
      els.screen.style.transition = 'transform 0.56s cubic-bezier(0.23,1,0.32,1), filter 0.56s ease';
      els.screen.style.filter = 'brightness(12) saturate(0)';
      els.screen.style.transform = 'scaleY(1)';
      els.gbs.forEach(function (gb, i) {
        if (!gb) return;
        gb.style.top = (8 + Math.random() * 78) + '%';
        timers.push(setTimeout(function () {
          gb.style.transition = 'opacity 0.04s';
          gb.style.opacity = '1';
          timers.push(setTimeout(function () { gb.style.opacity = '0'; }, 65));
        }, i * 52));
      });
    });

    go(600, function () { els.screen.style.filter = 'brightness(1.6) saturate(0.3)'; });
    go(860, function () { els.screen.style.filter = 'brightness(1) saturate(1)'; });

    go(900, function () {
      stopStatic(els.ctx, els.canvas);
      startStatic(els.ctx, els.canvas, 0.065, 18);
      els.canvas.style.transition = 'opacity 0.5s';
      els.canvas.style.opacity = '0.16';
      show(els.statusEl, 0.4);
    });

    go(1000, function () {
      els.content.style.transition = 'opacity 0.22s';
      els.content.style.opacity = '1';
    });

    go(1150, function () {
      activateViCell(els.viGlyph, els.viCursor);
    });

    go(2100, function () {
      els.wmCursor.style.opacity = '1';
      els.wmCursor.classList.add('intro-vi-line__cursor--blink');
      viTypeLetter(els.wmText, els.wmCursor, 'VPRO', 0, 140);
    });

    go(2680, function () {
      if (els.statusEl) {
        els.statusEl.textContent = 'READY';
        els.statusEl.style.color = 'rgba(77,255,110,0.58)';
        els.statusEl.style.textShadow = '0 0 12px rgba(77,255,110,0.4)';
      }
    });

    go(2940, function () {
      stopStatic(els.ctx, els.canvas);
      els.canvas.style.opacity = '0';
      els.sweep.style.opacity = '1';
      els.sweep.style.transition = 'top 0.72s linear';
      els.sweep.style.top = '100%';
    });

    go(3360, function () {
      els.screen.style.transition = 'filter 0.07s';
      els.screen.style.filter = 'brightness(7) saturate(0)';
    });

    go(3500, function () {
      els.screen.style.transition = 'transform 0.30s ease-in, filter 0.15s';
      els.screen.style.transform = 'scaleY(0.003)';
      els.screen.style.filter = 'brightness(3)';
    });

    go(3820, function () {
      els.screen.style.transition = 'transform 0.22s ease-in, filter 0.12s';
      els.screen.style.transform = 'scaleY(0.003) scaleX(0)';
      els.screen.style.filter = 'brightness(9)';
    });

    go(4060, function () {
      intro.style.transition = 'opacity 0.12s';
      intro.style.opacity = '0';
      timers.push(setTimeout(function () {
        clearTimers();
        hideIntro(intro, markSeen);
      }, 130));
    });
  }

  function playIntro(options) {
    options = options || {};
    var intro = document.getElementById('crt-intro');
    if (!intro) return;

    clearTimers();
    pendingNav = options.thenNavigate || null;

    if (options.thenNavigate) {
      try {
        var target = new URL(options.thenNavigate, global.location.href);
        if (target.pathname === global.location.pathname) {
          pendingNav = null;
        }
      } catch (e) {
        pendingNav = null;
      }
    }

    runSequence(intro, options.markSeen === true);
  }

  function bindLogoReplay() {
    document.querySelectorAll('[data-replay-intro]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var href = el.getAttribute('href');
        var onHome = global.location.pathname === '/' || global.location.pathname === '/index.html';
        playIntro({
          markSeen: false,
          thenNavigate: onHome ? null : href
        });
      });
    });
  }

  function init() {
    var intro = document.getElementById('crt-intro');
    if (!intro) return;

    bindLogoReplay();

    var seen = false;
    try {
      seen = localStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) { /* ignore */ }

    if (seen) {
      intro.classList.add('crt-intro--hidden');
      intro.style.pointerEvents = 'none';
      intro.setAttribute('aria-hidden', 'true');
      return;
    }

    playIntro({ markSeen: true });
  }

  global.VproIntro = { play: playIntro };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
