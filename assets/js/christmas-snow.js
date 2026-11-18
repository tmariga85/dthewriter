/* Snowfall over the Christmas Collection.
 *
 * Hover the section (or scroll it into view on a touch screen) and snow
 * starts falling, settles into a drift along the floor, and once enough has
 * landed a snowman builds himself out of it. Leave, and the whole thing fades
 * and resets, so it plays again next time.
 *
 * Hand-rolled on a canvas rather than a library: the only interesting parts
 * are the depth map the flakes land on and the build threshold, and both are
 * a few lines. Everything is time-based, not frame-based, so it runs the same
 * on a 60Hz laptop and a 144Hz monitor.
 *
 * It never runs for a visitor who asks for reduced motion, it stops when the
 * tab is hidden, and the canvas takes no pointer events, so the call to
 * action underneath stays clickable throughout.
 */

(function () {
  'use strict';

  var zone = document.getElementById('christmas');
  if (!zone) { return; }
  var canvas = zone.querySelector('.es-snow');
  if (!canvas || !canvas.getContext) { return; }

  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (calm.matches) { return; }

  var ctx = canvas.getContext('2d');

  var W = 0, H = 0, dpr = 1;
  var cols = 0, ground = null;     // settled depth per column, in CSS px
  var profile = null;              // per-column growth weight, so the drift lumps
  var flakes = [];
  var build = 0;                   // 0..1, how finished the snowman is
  var alpha = 0;                   // whole-layer fade
  var falling = false;             // is the section currently being hovered
  var raf = null, last = 0;

  var MAX_FLAKES = 230;
  var SPAWN_PER_SEC = 62;
  var FILL_SECONDS = 5;            // how long the floor takes to reach its cap
  var SNOWMAN_UNITS = 155;         // his height at scale 1, hat included
  var spawnDebt = 0;
  var room = 0;                    // clear space under the copy, in CSS px

  // How much clear space sits under the last piece of copy. Everything the
  // snow draws is sized from this, so the drift and the snowman always keep
  // off the text no matter how the column has been laid out.
  function measureRoom() {
    var last = zone.querySelector('.es-btn-row') || zone.lastElementChild;
    if (!last) { room = H * 0.2; return; }
    room = Math.max(32, zone.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom);
  }

  function measure() {
    var r = zone.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width));
    var h = Math.max(1, Math.round(r.height));
    if (w === W && h === H) { measureRoom(); return; }
    W = w; H = h;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.max(28, Math.round(W / 7));
    if (!ground || ground.length !== n) { ground = new Float32Array(n); profile = null; }
    cols = n;
    if (!profile) { makeProfile(); }
    measureRoom();
  }

  // Two offset sine waves give the drift a believable uneven surface without
  // needing noise: deeper in some places, scoured in others.
  function makeProfile() {
    profile = new Float32Array(cols);
    var a = Math.random() * 6.283, b = Math.random() * 6.283;
    for (var i = 0; i < cols; i++) {
      var t = i / cols;
      var v = 0.74 + 0.3 * Math.sin(t * 7.1 + a) + 0.17 * Math.sin(t * 17.3 + b);
      profile[i] = v < 0.28 ? 0.28 : v;
    }
  }

  function colAt(x) {
    var i = Math.floor(x / W * cols);
    return i < 0 ? 0 : (i > cols - 1 ? cols - 1 : i);
  }

  function reset() {
    flakes.length = 0;
    build = 0; spawnDebt = 0;
    if (ground) { ground.fill(0); }
    makeProfile();            // a different drift shape every time it plays
  }

  function spawn() {
    flakes.push({
      x: Math.random() * W,
      y: -10 - Math.random() * 60,
      r: 1.3 + Math.random() * 2.7,
      vy: 62 + Math.random() * 78,              // px per second
      drift: (Math.random() - 0.5) * 30,
      phase: Math.random() * Math.PI * 2,
      sway: 0.7 + Math.random() * 1.6,
      o: 0.5 + Math.random() * 0.5
    });
  }

  // The drift is capped so it never swallows the copy above it.
  function capDepth() { return Math.max(18, Math.min(78, room * 0.46)); }

  // He is scaled to the clear space, and skipped outright when a layout
  // leaves him nowhere to stand.
  function snowmanScale() {
    var s = Math.min(1, W / 540, (room * 0.92) / SNOWMAN_UNITS);
    return s < 0.4 ? 0 : s;
  }

  function step(dt, now) {
    if (falling) {
      spawnDebt += SPAWN_PER_SEC * dt;
      while (spawnDebt >= 1) {
        spawnDebt -= 1;
        if (flakes.length < MAX_FLAKES) { spawn(); }
      }
    }

    var cap = capDepth();

    // The drift grows on a clock rather than flake by flake. Settling each
    // flake individually looks right in theory but takes half a minute to
    // show, and nobody hovers a section for half a minute.
    var total = 0;
    if (falling) {
      var grow = cap / FILL_SECONDS * dt;
      for (var g = 0; g < cols; g++) {
        var top = cap * profile[g];
        if (ground[g] < top) { ground[g] = Math.min(top, ground[g] + grow * profile[g]); }
        total += ground[g];
      }
    } else {
      for (var g2 = 0; g2 < cols; g2++) { total += ground[g2]; }
    }

    for (var i = flakes.length - 1; i >= 0; i--) {
      var f = flakes[i];
      f.y += f.vy * dt;
      f.x += (f.drift + Math.sin(now / 1000 * f.sway + f.phase) * 16) * dt;
      if (f.x < -12) { f.x += W + 24; } else if (f.x > W + 12) { f.x -= W + 24; }

      var c = colAt(f.x);
      var surface = H - ground[c];
      if (f.y + f.r >= surface) {
        // A flake landing nudges its own spot up a touch, so where the snow
        // falls still shows in the surface.
        if (ground[c] < cap * 1.04) { ground[c] += f.r * 0.22; }
        flakes.splice(i, 1);
      } else if (f.y > surface - 16) {
        f.o *= Math.max(0, 1 - dt * 3.2);   // fade out as it meets the drift
      }
    }

    // A gentle smoothing pass keeps the surface rolling rather than spiky.
    if (cols > 2) {
      var prev = ground[0];
      for (var k = 1; k < cols - 1; k++) {
        var cur = ground[k];
        ground[k] = cur + (prev + ground[k + 1] - 2 * cur) * Math.min(1, dt * 7) * 0.5;
        prev = cur;
      }
    }

    // He starts once the floor is a third laid and is finished not long after.
    var fill = cols ? (total / cols) / cap : 0;
    var want = Math.max(0, Math.min(1, (fill - 0.3) / 0.45));
    build += (want - build) * Math.min(1, dt * 2.4);

    var target = falling ? 1 : 0;
    alpha += (target - alpha) * Math.min(1, dt * (falling ? 5 : 2.2));
    if (!falling && alpha < 0.012) { alpha = 0; reset(); return false; }
    return true;
  }

  function drawDrift() {
    ctx.beginPath();
    ctx.moveTo(-4, H + 4);
    var stepX = W / (cols - 1);
    ctx.lineTo(-4, H - ground[0]);
    for (var i = 0; i < cols - 1; i++) {
      var x0 = i * stepX, x1 = (i + 1) * stepX;
      var y0 = H - ground[i], y1 = H - ground[i + 1];
      ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    }
    ctx.lineTo(W + 4, H - ground[cols - 1]);
    ctx.lineTo(W + 4, H + 4);
    ctx.closePath();
    var g = ctx.createLinearGradient(0, H - capDepth(), 0, H);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#e9eef4');
    ctx.fillStyle = g;
    ctx.fill();
  }

  function ball(x, y, r, grow) {
    var rr = r * grow;
    if (rr <= 0.4) { return; }
    var g = ctx.createRadialGradient(x - rr * 0.35, y - rr * 0.4, rr * 0.1, x, y, rr);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#dfe7f0');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.fill();
  }

  function dot(x, y, r, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eases a detail in over its own slice of the build.
  function phase(from, to) {
    return Math.max(0, Math.min(1, (build - from) / (to - from)));
  }

  function drawSnowman() {
    if (build <= 0.01) { return; }

    var s = snowmanScale();
    if (!s) { return; }
    var cx = Math.max(W * 0.17, 46 * s);
    var gy = H - ground[colAt(cx)] + 2 * s;

    var r1 = 38 * s, r2 = 27 * s, r3 = 19 * s;
    var y1 = gy - r1 * 0.92;
    var y2 = y1 - (r1 + r2) * 0.74;
    var y3 = y2 - (r2 + r3) * 0.78;

    var b1 = phase(0, 0.42), b2 = phase(0.3, 0.68), b3 = phase(0.56, 0.84);
    var face = phase(0.82, 1);

    // A soft shadow so he sits in the snow rather than on top of it.
    if (b1 > 0) {
      ctx.save();
      ctx.globalAlpha = alpha * 0.18 * b1;
      ctx.fillStyle = '#5d6b7d';
      ctx.beginPath();
      ctx.ellipse(cx, gy + 2 * s, r1 * 1.15 * b1, r1 * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ball(cx, y1, r1, b1);
    ball(cx, y2, r2, b2);
    ball(cx, y3, r3, b3);

    if (b2 > 0.6) {
      // Buttons down the middle ball.
      for (var i = 0; i < 3; i++) {
        dot(cx, y2 - r2 * 0.4 + i * r2 * 0.42, 1.7 * s, 'rgba(48,44,40,.85)');
      }
    }

    if (b3 > 0.5) {
      // Twig arms, drawn from the middle ball outwards.
      ctx.strokeStyle = '#7a5a36';
      ctx.lineWidth = 2 * s;
      ctx.lineCap = 'round';
      var ay = y2 - r2 * 0.25;
      ctx.beginPath();
      ctx.moveTo(cx - r2 * 0.85, ay);
      ctx.lineTo(cx - r2 * 2.1, ay - r2 * 0.6);
      ctx.moveTo(cx - r2 * 1.65, ay - r2 * 0.36);
      ctx.lineTo(cx - r2 * 1.9, ay - r2 * 0.95);
      ctx.moveTo(cx + r2 * 0.85, ay);
      ctx.lineTo(cx + r2 * 2.1, ay - r2 * 0.6);
      ctx.moveTo(cx + r2 * 1.65, ay - r2 * 0.36);
      ctx.lineTo(cx + r2 * 1.9, ay - r2 * 0.95);
      ctx.stroke();
    }

    if (face > 0) {
      ctx.save();
      ctx.globalAlpha = alpha * face;

      // Scarf in the brand olive, tied at the neck.
      ctx.fillStyle = '#5c6b3a';
      ctx.beginPath();
      ctx.ellipse(cx, y3 + r3 * 0.92, r3 * 1.05, r3 * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + r3 * 0.5, y3 + r3 * 0.85);
      ctx.lineTo(cx + r3 * 1.15, y3 + r3 * 2.25);
      ctx.lineTo(cx + r3 * 0.45, y3 + r3 * 2.1);
      ctx.closePath();
      ctx.fill();

      // Hat.
      ctx.fillStyle = '#32302c';
      ctx.beginPath();
      ctx.ellipse(cx, y3 - r3 * 0.86, r3 * 1.22, r3 * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - r3 * 0.66, y3 - r3 * 1.86, r3 * 1.32, r3 * 1.02);
      ctx.fillStyle = '#be9a4c';
      ctx.fillRect(cx - r3 * 0.66, y3 - r3 * 1.06, r3 * 1.32, r3 * 0.2);

      // Coal eyes, carrot nose, a smile of five dots.
      dot(cx - r3 * 0.34, y3 - r3 * 0.22, 1.9 * s, '#32302c');
      dot(cx + r3 * 0.34, y3 - r3 * 0.22, 1.9 * s, '#32302c');
      ctx.fillStyle = '#e07a2c';
      ctx.beginPath();
      ctx.moveTo(cx, y3 + r3 * 0.04);
      ctx.lineTo(cx + r3 * 0.78, y3 + r3 * 0.2);
      ctx.lineTo(cx, y3 + r3 * 0.24);
      ctx.closePath();
      ctx.fill();
      for (var m = -2; m <= 2; m++) {
        dot(cx + m * r3 * 0.22, y3 + r3 * 0.5 + Math.abs(m) * r3 * -0.06, 1.2 * s, '#32302c');
      }
      ctx.restore();
    }
  }

  function frame(now) {
    raf = null;
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    measure();

    var alive = step(dt, now);
    ctx.clearRect(0, 0, W, H);

    if (alpha > 0.004) {
      ctx.save();
      ctx.globalAlpha = alpha;
      drawDrift();
      drawSnowman();
      ctx.fillStyle = '#ffffff';
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        ctx.globalAlpha = alpha * f.o;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (alive || flakes.length) { raf = requestAnimationFrame(frame); }
  }

  function run() {
    if (raf === null) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function on() { if (!falling) { falling = true; measure(); run(); } }
  function off() { falling = false; run(); }

  var canHover = window.matchMedia('(hover: hover)');
  if (canHover.matches) {
    zone.addEventListener('pointerenter', on);
    zone.addEventListener('pointerleave', off);
    zone.addEventListener('focusin', on);
    zone.addEventListener('focusout', off);
  } else if ('IntersectionObserver' in window) {
    // No hover on a touch screen, so it plays while the section is on show.
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.intersectionRatio > 0.5) { on(); } else { off(); } });
    }, { threshold: [0, 0.5, 1] }).observe(zone);
  }

  document.addEventListener('visibilitychange', function () { if (document.hidden) { off(); } });
  window.addEventListener('resize', function () { if (falling || alpha > 0) { measure(); } });
  if (calm.addEventListener) {
    calm.addEventListener('change', function (e) { if (e.matches) { off(); } });
  }
})();
