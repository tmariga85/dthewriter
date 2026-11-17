/* The Voice of Inspiration carousel.
 *
 * Hand-rolled rather than pulled from a library, because the page is
 * standalone and the two things that usually go wrong with a library are
 * exactly what matters here: autoplay that never restarts after someone
 * touches it, and clicks swallowed because a finger moved three pixels.
 *
 *  - the centred canvas is scaled up; its neighbours shrink, tilt and fade
 *  - it loops continuously: the slides are tripled, and after the run
 *    leaves the middle copy the position is snapped back by one set with
 *    the transition off, so there is never a jump back across the row
 *  - it rotates on its own, pausing on hover, focus and hidden tabs, and
 *    a watchdog restarts it after any interaction
 *  - dragging scrolls; a press that stays within a tolerance counts as a
 *    click, which centres a side canvas or opens the centred one's enquiry
 */
(function () {
  'use strict';

  var AUTOPLAY_MS = 5000;
  var WATCHDOG_MS = 2500;
  var CLICK_SLOP = 12;      // px of wobble still counted as a click
  var DRAG_TRIGGER = 45;    // px of travel that advances a slide
  var SCALE_CENTRE = 1.08;
  var SCALE_SIDE = 0.78;
  var OPACITY_SIDE = 0.45;
  var TILT = 16;            // degrees of rotateY on the side canvases

  function init(root) {
    var track = root.querySelector('.es-car-track');
    var viewport = root.querySelector('.es-car-viewport');
    var dotsWrap = root.querySelector('.es-car-dots');
    var prev = root.querySelector('.es-car-prev');
    var next = root.querySelector('.es-car-next');
    var originals = [].slice.call(root.querySelectorAll('.es-canvas'));
    if (!track || !viewport || originals.length === 0) return;

    var reduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var N = originals.length;

    // Triple the row so there is always a canvas either side of the
    // centred one, and so the run can carry on in either direction.
    if (N > 1) {
      [-1, 1].forEach(function (side) {
        originals.forEach(function (slide) {
          var clone = slide.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          clone.dataset.clone = 'true';
          if (side === -1) track.insertBefore(clone, track.firstChild);
          else track.appendChild(clone);
        });
      });
    }

    var slides = [].slice.call(track.querySelectorAll('.es-canvas'));
    var index = N > 1 ? N : 0;   // start on the first real slide

    var timer = null;
    var hovering = false;
    var dragging = false;
    var pointerDown = false;
    var startX = 0, startY = 0, dragX = 0;
    var downLink = null;

    // ---- dots -------------------------------------------------------

    var dots = originals.map(function (slide, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'es-car-dot';
      b.setAttribute('role', 'tab');
      var title = slide.querySelector('.es-canvas-title');
      b.setAttribute('aria-label', title ? title.textContent.trim() : 'Canvas ' + (i + 1));
      b.addEventListener('click', function () {
        go(N > 1 ? N + i : i);
        restart();
      });
      dotsWrap.appendChild(b);
      return b;
    });

    // ---- layout -----------------------------------------------------

    function paint(offset) {
      offset = offset || 0;
      var active = slides[index];
      if (!active) return;

      var centre = viewport.clientWidth / 2;
      var target = active.offsetLeft + active.offsetWidth / 2;
      track.style.transform = 'translate3d(' + (centre - target + offset) + 'px,0,0)';

      slides.forEach(function (slide, i) {
        var d = Math.abs(i - index);
        var isCentre = d === 0;
        var tilt = isCentre ? 0 : (i < index ? TILT : -TILT);

        slide.style.transform = 'perspective(1400px) rotateY(' + tilt + 'deg) scale(' +
          (isCentre ? SCALE_CENTRE : SCALE_SIDE) + ')';
        slide.style.opacity = isCentre ? 1 : OPACITY_SIDE;
        slide.style.zIndex = String(100 - d);
        slide.classList.toggle('is-centre', isCentre);
        slide.tabIndex = isCentre ? 0 : -1;
      });

      var real = N > 1 ? ((index - N) % N + N) % N : 0;
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-on', i === real);
        dot.setAttribute('aria-selected', i === real ? 'true' : 'false');
      });
    }

    function go(i) {
      index = i;
      track.classList.remove('is-dragging');
      paint();
    }

    // Once a move finishes outside the middle copy, shift back by one set
    // with the transition suppressed. Visually identical, so the run can
    // continue forever in either direction.
    function normalise() {
      if (N < 2) return;
      var shifted = false;
      if (index >= 2 * N) { index -= N; shifted = true; }
      else if (index < N) { index += N; shifted = true; }
      if (!shifted) return;

      track.classList.add('is-dragging');
      paint();
      void track.offsetWidth;            // flush the un-transitioned position
      track.classList.remove('is-dragging');
    }

    track.addEventListener('transitionend', function (e) {
      if (e.target === track && e.propertyName === 'transform') normalise();
    });

    // ---- autoplay ---------------------------------------------------

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    function start() {
      if (reduced || timer) return;
      timer = setInterval(function () {
        if (hovering || dragging || document.hidden) return;
        go(index + 1);
      }, AUTOPLAY_MS);
    }

    function restart() { stop(); start(); }

    // A watchdog, because every way autoplay dies in practice — an
    // interaction, a backgrounded tab, a thrown timer — looks the same
    // from here: a carousel that has quietly stopped moving.
    if (!reduced) {
      setInterval(function () {
        if (hovering || dragging || document.hidden) return;
        if (!timer) start();
      }, WATCHDOG_MS);
    }

    // ---- interaction ------------------------------------------------

    root.addEventListener('mouseenter', function () { hovering = true; });
    root.addEventListener('mouseleave', function () { hovering = false; });
    root.addEventListener('focusin', function () { hovering = true; });
    root.addEventListener('focusout', function () { hovering = false; });

    if (prev) prev.addEventListener('click', function () { go(index - 1); restart(); });
    if (next) next.addEventListener('click', function () { go(index + 1); restart(); });

    viewport.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointerDown = true;
      dragging = false;
      startX = e.clientX;
      startY = e.clientY;
      dragX = 0;
      downLink = e.target.closest ? e.target.closest('.es-canvas') : null;
      stop();
    });

    viewport.addEventListener('pointermove', function (e) {
      if (!pointerDown) return;
      dragX = e.clientX - startX;
      if (!dragging && Math.abs(dragX) > CLICK_SLOP) {
        dragging = true;
        track.classList.add('is-dragging');
      }
      if (dragging) paint(dragX * 0.6);
    });

    function release(e) {
      if (!pointerDown) return;
      pointerDown = false;
      var link = downLink;
      downLink = null;

      if (dragging) {
        if (dragX <= -DRAG_TRIGGER) go(index + 1);
        else if (dragX >= DRAG_TRIGGER) go(index - 1);
        else go(index);
        dragging = false;
        restart();
        return;
      }

      track.classList.remove('is-dragging');

      // A press that did not travel is a click.
      if (link && e) {
        var dx = e.clientX - startX, dy = e.clientY - startY;
        if (Math.sqrt(dx * dx + dy * dy) <= CLICK_SLOP) {
          var i = slides.indexOf(link);
          if (i !== -1 && i !== index) {
            go(i);                       // a side canvas: bring it to the centre
          } else if (!(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) {
            var opened = window.open(link.href, '_blank', 'noopener');
            if (!opened) window.location.href = link.href;
          }
        }
      }
      restart();
    }

    viewport.addEventListener('pointerup', release);
    viewport.addEventListener('pointercancel', function () {
      pointerDown = false;
      dragging = false;
      downLink = null;
      track.classList.remove('is-dragging');
      paint();
      restart();
    });

    // The pointer handlers above own the click, so stop the anchor from
    // navigating a second time. Keyboard activation (detail 0) is left alone.
    viewport.addEventListener('click', function (e) {
      var link = e.target.closest ? e.target.closest('.es-canvas') : null;
      if (!link || e.detail === 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
    });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(index - 1); restart(); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { go(index + 1); restart(); e.preventDefault(); }
    });

    // ---- start ------------------------------------------------------

    root.classList.add('is-ready');
    track.classList.add('is-dragging');   // place the first slide without a slide-in
    paint();
    void track.offsetWidth;
    track.classList.remove('is-dragging');
    start();

    window.addEventListener('resize', function () {
      track.classList.add('is-dragging');
      paint();
      void track.offsetWidth;
      track.classList.remove('is-dragging');
    });

    // Artwork arriving late changes the slide widths, so re-centre.
    slides.forEach(function (slide) {
      var img = slide.querySelector('img');
      if (img && !img.complete) {
        img.addEventListener('load', function () {
          track.classList.add('is-dragging');
          paint();
          void track.offsetWidth;
          track.classList.remove('is-dragging');
        });
      }
    });
  }

  function boot() {
    var roots = document.querySelectorAll('[data-canvas-carousel]');
    for (var i = 0; i < roots.length; i++) init(roots[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
