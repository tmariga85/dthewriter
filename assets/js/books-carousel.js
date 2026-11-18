/*!
 * books-carousel.js — "Books by Daisy Mariga"
 *
 * Drives the book carousel with Flickity (already bundled with the theme) and
 * adds the coverflow tilt: covers rotate and fall back in 3D the further they
 * sit from the centre of the track. Honours prefers-reduced-motion.
 */
(function () {
	'use strict';

	var SELECTOR = '[data-books-carousel]';
	var MAX_TILT = 26;   // degrees at the edge of the track
	var MAX_DEPTH = 120; // px pushed away from the viewer
	var MAX_FADE = 0.45; // how far the outer covers fade

	var reduced = window.matchMedia &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	ready(function () {
		var el = document.querySelector(SELECTOR);
		if (!el) return;
		waitFor(function () { return typeof window.Flickity === 'function'; }, function (ok) {
			if (!ok) { fallback(el); return; }
			build(el);
		});
	});

	function build(el) {
		var flkty = new window.Flickity(el, {
			cellSelector: '.lqd-book-slide',
			cellAlign: 'center',
			contain: false,
			wrapAround: true,
			draggable: true,
			freeScroll: false,
			pageDots: true,
			prevNextButtons: true,
			autoPlay: reduced ? false : 5000,
			pauseAutoPlayOnHover: true,
			selectedAttraction: 0.018,
			friction: 0.22,
			imagesLoaded: true,
			// Flickity's default is 3px, which counts most trackpad clicks and
			// nearly every tap on a phone as a drag and swallows the click.
			// Ten gives a press room to wobble and still open the book.
			dragThreshold: 10
		});

		// Nothing else is needed to open a book: each cover is a real anchor
		// with target="_blank", so the browser follows it natively. An earlier
		// version intercepted the press and called window.open instead, which
		// was worse in two ways -- window.open(url, '_blank', 'noopener')
		// returns null even when it succeeds, so its popup-blocked fallback
		// fired every time and navigated this tab to Amazon as well as opening
		// the new one; and popup blockers stop window.open where they never
		// stop a plain link. Letting the anchor be an anchor also restores
		// middle-click, ctrl-click and "copy link address".

		// Hold the carousel still while a finger or cursor is down on a cover.
		el.addEventListener('pointerdown', function (e) {
			var link = e.target.closest ? e.target.closest('a.lqd-book') : null;
			if (link && flkty.player) flkty.stopPlayer();
		});

		if (reduced) {
			markReady(el);
			return;
		}

		// --- keep it turning ------------------------------------------------
		// Flickity stops autoplay for good the first time anyone touches the
		// carousel. Nudge it back into motion once the pointer has left.
		var hovering = false;
		el.addEventListener('mouseenter', function () { hovering = true; });
		el.addEventListener('mouseleave', function () { hovering = false; });
		setInterval(function () {
			if (hovering || document.hidden) return;
			if (flkty.player && flkty.player.state !== 'playing') {
				flkty.playPlayer();
			}
		}, 2500);

		var slides = el.querySelectorAll('.lqd-book-slide-inner');

		function paint() {
			var width = flkty.size && flkty.size.innerWidth ? flkty.size.innerWidth : el.offsetWidth;
			if (!width) return;
			flkty.slides.forEach(function (slide, i) {
				var inner = slides[i];
				if (!inner) return;
				// 0 when the slide sits dead centre, ±1 towards the edges.
				var offset = (slide.target + flkty.x) / (width / 2);
				var clamped = Math.max(-1, Math.min(1, offset));
				var distance = Math.abs(clamped);
				inner.style.transform =
					'rotateY(' + (-clamped * MAX_TILT) + 'deg) ' +
					'translateZ(' + (-distance * MAX_DEPTH) + 'px) ' +
					'scale(' + (1 - distance * 0.07) + ')';
				inner.style.opacity = String(1 - distance * MAX_FADE);
				inner.style.zIndex = String(Math.round(100 - distance * 50));
			});
		}

		flkty.on('scroll', paint);
		flkty.on('ready', paint);
		window.addEventListener('resize', debounce(paint, 150));
		paint();

		// Flickity measures before webfonts settle; re-measure once they land.
		if (document.fonts && document.fonts.ready) {
			document.fonts.ready.then(function () { flkty.resize(); paint(); });
		}

		entrance(el);
		markReady(el);
	}

	/* Flickity missing: leave a readable, scrollable row rather than nothing. */
	function fallback(el) {
		el.classList.add('lqd-books-nojs');
		el.style.display = 'flex';
		el.style.overflowX = 'auto';
		el.style.gap = '20px';
		markReady(el);
	}

	function markReady(el) {
		var section = el.closest ? el.closest('.lqd-books') : null;
		if (section) section.classList.add('lqd-books-is-ready');
	}

	/* Fade the heading and the track up as the section arrives.
	   The hiding class is added here rather than in the markup, so a missing
	   or broken GSAP can never leave the section invisible. */
	function entrance(el) {
		var section = el.closest ? el.closest('.lqd-books') : null;
		if (!section) return;
		if (reduced || !window.gsap || !window.ScrollTrigger) return;

		var targets = section.querySelectorAll('.lqd-books-head, .lqd-books-carousel-wrap');
		if (!targets.length) return;

		section.classList.add('lqd-books-animate');

		var revealed = false;
		function reveal() {
			if (revealed) return;
			revealed = true;
			window.gsap.to(targets, {
				opacity: 1,
				y: 0,
				duration: 0.9,
				ease: 'power3.out',
				stagger: 0.15,
				onComplete: function () { section.classList.remove('lqd-books-animate'); }
			});
		}

		window.ScrollTrigger.create({
			trigger: section,
			start: 'top 85%',
			once: true,
			onEnter: reveal
		});

		// If the trigger never fires — layout shifted, refresh missed, anything —
		// show the section anyway rather than leave a blank gap on the page.
		setTimeout(function () {
			if (!revealed) reveal();
		}, 3000);
	}

	/* --- helpers --- */
	function ready(fn) {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', fn);
		} else {
			fn();
		}
	}

	function waitFor(test, done, tries) {
		tries = tries == null ? 40 : tries;
		if (test()) { done(true); return; }
		if (tries <= 0) { done(false); return; }
		setTimeout(function () { waitFor(test, done, tries - 1); }, 50);
	}

	function debounce(fn, wait) {
		var t;
		return function () {
			clearTimeout(t);
			t = setTimeout(fn, wait);
		};
	}
})();
