(function () {
  'use strict';

  var wrap = document.querySelector('.crt-hero__stripe-wrap');
  if (!wrap) return;

  var canvas = wrap.querySelector('.crt-hero__stripe-noise');
  if (!canvas) return;

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  var ctx = canvas.getContext('2d');
  var running = false;
  var raf = null;
  var last = 0;
  var interval = 1000 / 18;

  function resize() {
    var w = Math.max(1, Math.floor(wrap.clientWidth));
    var h = Math.max(1, Math.floor(wrap.clientHeight));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function draw() {
    var w = canvas.width;
    var h = canvas.height;
    var id = ctx.createImageData(w, h);
    var d = id.data;
    for (var i = 0; i < d.length; i += 4) {
      var on = Math.random() < 0.11;
      var v = on ? ((Math.random() * 180 + 40) | 0) : 0;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = on ? ((v * 0.55) | 0) : 0;
    }
    ctx.putImageData(id, 0, 0);
  }

  function loop(ts) {
    if (!running) return;
    if (ts - last >= interval) {
      draw();
      last = ts;
    }
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    resize();
    last = 0;
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  resize();
  window.addEventListener('resize', resize);

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) start();
        else stop();
      });
    }, { threshold: 0.05 });
    io.observe(wrap);
  } else {
    start();
  }
})();
