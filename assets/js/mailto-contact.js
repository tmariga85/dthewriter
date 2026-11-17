/*!
 * mailto-contact.js — D the Writer
 * Replaces the old PHP mailer. Both contact forms now compose a message in the
 * visitor's own email application, addressed to the inbox below.
 */
(function () {
	'use strict';

	var RECIPIENT = 'deemariga@gmail.com';
	var MAX_URL = 1900; // keep the mailto: link inside safe browser limits

	// Field name -> label used in the email body. Order sets the body order.
	var LABELS = [
		['name', 'Name'],
		['email', 'Email'],
		['topic', 'Topic'],
		['your-subject2', 'Budget'],
		['budget', 'Budget'],
		['message', 'Message'],
		['textarea', 'Message']
	];
	var REQUIRED = ['name', 'email'];
	var MESSAGE_FIELDS = ['message', 'textarea'];
	var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

	injectStyles();

	document.addEventListener('submit', function (e) {
		var form = e.target;
		if (!form || !form.classList || !form.classList.contains('lqd-cf-form')) return;

		// Nothing else gets to handle this submit.
		e.preventDefault();
		e.stopPropagation();
		if (e.stopImmediatePropagation) e.stopImmediatePropagation();

		handle(form);
	}, true);

	function handle(form) {
		clearTips(form);

		var values = {};
		var fields = form.querySelectorAll('input[name], select[name], textarea[name]');
		for (var i = 0; i < fields.length; i++) {
			var f = fields[i];
			if (f.type === 'submit' || f.type === 'button' || f.type === 'hidden') continue;
			if (f.type === 'checkbox' || f.type === 'radio') continue;
			values[f.name] = (f.value || '').trim();
		}

		// --- validation -------------------------------------------------
		var missing = [];
		REQUIRED.forEach(function (n) {
			if (form.elements[n] && !values[n]) missing.push(n);
		});

		var msgField = null;
		MESSAGE_FIELDS.forEach(function (n) {
			if (!msgField && form.elements[n]) msgField = n;
		});
		if (msgField && !values[msgField]) missing.push(msgField);

		missing.forEach(function (n) {
			tip(form, n, 'Please fill in this field.');
		});

		if (values.email && !EMAIL_RE.test(values.email)) {
			tip(form, 'email', 'Please enter a valid email address.');
			if (missing.indexOf('email') === -1) missing.push('email');
		}

		if (missing.length) {
			respond(form, 'Please complete the highlighted fields.', false);
			var first = form.elements[missing[0]];
			if (first && first.focus) first.focus();
			return;
		}

		// --- compose ----------------------------------------------------
		var subject = 'Website enquiry' + (values.name ? ' from ' + values.name : '');
		var lines = [];
		var used = {};
		LABELS.forEach(function (pair) {
			var n = pair[0];
			var label = pair[1];
			if (!(n in values) || !values[n] || used[label]) return;
			used[label] = true;
			if (label === 'Message') return; // message goes last, on its own
			lines.push(label + ': ' + values[n]);
		});
		if (msgField && values[msgField]) {
			lines.push('');
			lines.push('Message:');
			lines.push(values[msgField]);
		}
		lines.push('');
		lines.push('— sent from dthewriter.co.za');

		var body = lines.join('\r\n');
		var url = build(subject, body);
		if (url.length > MAX_URL && msgField) {
			// Trim the message rather than let the mail client drop the link.
			var over = url.length - MAX_URL;
			var trimmed = values[msgField].slice(0, Math.max(120, values[msgField].length - over - 80));
			body = body.replace(values[msgField], trimmed + '\r\n\r\n[message shortened — please continue here]');
			url = build(subject, body);
		}

		respond(form, 'Opening your email app… if nothing happens, email ' + RECIPIENT + ' directly.', true);
		openMail(url);
	}

	// Handing the URL to an anchor click is more reliable than assigning to
	// window.location across browsers, and keeps the navigation inspectable.
	function openMail(url) {
		var a = document.createElement('a');
		a.href = url;
		a.style.display = 'none';
		document.body.appendChild(a);
		a.click();
		setTimeout(function () { a.remove(); }, 0);
	}

	function build(subject, body) {
		return 'mailto:' + RECIPIENT +
			'?subject=' + encodeURIComponent(subject) +
			'&body=' + encodeURIComponent(body);
	}

	// --- small UI helpers -----------------------------------------------
	function wrapOf(form, name) {
		var el = form.elements[name];
		if (!el) return null;
		if (el.length && !el.tagName) el = el[0];
		return el.closest('.lqd-form-control-wrap') || el.parentNode;
	}

	function tip(form, name, text) {
		var el = form.elements[name];
		if (el && el.setAttribute) el.setAttribute('aria-invalid', 'true');
		var wrap = wrapOf(form, name);
		if (!wrap || wrap.querySelector('.lqd-cf-not-valid-tip')) return;
		var span = document.createElement('span');
		span.className = 'lqd-cf-not-valid-tip';
		span.setAttribute('role', 'alert');
		span.textContent = text;
		wrap.appendChild(span);
	}

	function clearTips(form) {
		form.querySelectorAll('.lqd-cf-not-valid-tip').forEach(function (n) { n.remove(); });
		form.querySelectorAll('[aria-invalid="true"]').forEach(function (n) {
			n.setAttribute('aria-invalid', 'false');
		});
		var out = outputOf(form);
		if (out) { out.textContent = ''; out.className = 'lqd-cf-response-output'; }
	}

	function outputOf(form) {
		var scope = form.parentNode;
		return scope ? scope.querySelector('.lqd-cf-response-output') : null;
	}

	function respond(form, text, ok) {
		var out = outputOf(form);
		if (!out) return;
		out.className = 'lqd-cf-response-output ' + (ok ? 'lqd-cf-output-ok' : 'lqd-cf-output-error');
		out.textContent = text;
	}

	function injectStyles() {
		var css =
			'.lqd-cf-not-valid-tip{display:block;margin-top:6px;font-size:12px;line-height:1.4;color:#d23f3f}' +
			'.lqd-cf-response-output:empty{display:none}' +
			'.lqd-cf-response-output{font-size:13px;line-height:1.5}' +
			'.lqd-cf-output-error{color:#d23f3f}' +
			'.lqd-cf-output-ok{opacity:.75}';
		var s = document.createElement('style');
		s.id = 'lqd-mailto-contact-styles';
		s.appendChild(document.createTextNode(css));
		(document.head || document.documentElement).appendChild(s);
	}
})();
