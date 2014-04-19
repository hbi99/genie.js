// Javascript by Hakan Bilgin (c) 2013

(function() {

'use strict';

var $ = function(selector, context) { // extreme slim version of jQuery
		context = context || document;
		return [].slice.call( context.querySelectorAll(selector) );
	},
	getDim = function(el, attr, val) {
		attr = attr || 'nodeName';
		val  = val || 'BODY';
		var dim = {w: el.offsetWidth, h: el.offsetHeight, t: 0, l: 0, obj: el};
		while (el && el[attr] != val && el.getAttribute(attr) != val) {
			if (el == document.firstChild) return null;
			dim.t += el.offsetTop - el.scrollTop;
			dim.l += el.offsetLeft - el.scrollLeft;
			//if (el.scrollWidth > el.offsetWidth) dim.w = el.offsetWidth;
			el = el.offsetParent;
		}
		return dim;
	},
	prefixedEvent = function(el, type, callback) {
		var pfx = 'webkit moz MS o '.split(' '),
			p   = 0,
			pl  = pfx.length;
		for (; p<pl; p++) {
			if (!pfx[p]) type = type.toLowerCase();
			el.addEventListener(pfx[p] + type, callback, false);
		}
	},

	genie = {
		active: false,
		// chrome animates faster than firefox & safari
		step_height: window.chrome ? 3 : 5,
		init: function() {
			var thumbs = $('.dock img'),
				gauge  = new Image(),
				il     = thumbs.length,
				i      = 0;
			for (; i<il; i++) {
				gauge.src = thumbs[i].src;
				thumbs[i].setAttribute('data-src', gauge.src );
				thumbs[i].setAttribute('data-width', gauge.width );
				thumbs[i].setAttribute('data-height', gauge.height );
				thumbs[i].style.backgroundImage = 'url('+ gauge.src +')';
				thumbs[i].style.height = thumbs[i].height +'px';
				thumbs[i].src = './img/_.gif';
			}
			genie.el = document.body.appendChild( document.createElement('div') );

			document.addEventListener('click', genie.doEvent, false);
			//genie.expand( thumbs[0] );

			LS({id: 'genie_text'});
		},
		doEvent: function(event) {
			switch(event.type) {
				case 'transitionend':
				case 'webkitTransitionEnd':
					var source      = genie.el,
						target      = source.thumbEl,
						source_dim  = getDim(source),
						target_dim  = getDim(target),
						diffT       = target_dim.t + source_dim.t - 100,
						step        = source.childNodes,
						step_height = step[0].offsetHeight,
						il          = step.length,
						i           = 0;

					switch (event.propertyName) {
						case 'left':
							if (source.classList.contains('collapse')) {
								for (; i<il; i++) {
									step[i].style.backgroundPosition = '0px '+ (diffT + i - (i * step_height)) +'px';
								}
								target.style.backgroundPosition = '0px 0px';
								source.classList.add('change-pace');
								source.style.height = '0px';
							}
							break;
						case 'background-position':
						/* '-x' and '-y' suffix should be added in Chrome */
						case 'background-position-x':
						case 'background-position-y':
							if (source.classList.contains('expand')) {
								for (; i<il; i++) {
									step[i].style.left = '0px';
									step[i].style.width = source_dim.w +'px';
								}
								source.classList.add('fan');
							} else {
								target.classList.remove('paced-thumb');
								target.classList.add('genie-thumb');
								source.classList.remove('change-pace');
								source.classList.remove('collapse');
								source.innerHTML = '';
								
								genie.active = false;

								if (genie.next) {
									genie.expand( genie.next );
									genie.next = false;
								}
							}
							break;
						case 'width':
							if (source.classList.contains('fan')) {
								source.style.backgroundPosition = '0px 0px';
								setTimeout(function() {
									source.classList.remove('fan');
									source.classList.remove('expand');
									source.innerHTML = '';
								}, 0);
								genie.active = target;
								//setTimeout(function() { genie.collapse(); }, 500);
							}
							break;
					}
					break;
				case 'click':
					if (event.target === genie.active) return;
					if (event.target.classList.contains('genie-thumb')) {
						if (genie.active) {
							genie.next = event.target;
							genie.collapse();
							return;
						}
						genie.el.style.display = 'block';
						genie.expand( event.target );
					}
					if (event.target.classList.contains('genie')) {
						genie.collapse();
					}
					break;
			}
		},
		collapse: function() {
			var step_height = this.step_height,
				source      = this.el,
				source_dim  = getDim(source),
				target      = source.thumbEl,
				target_dim  = getDim(target),
				step_length = Math.ceil((target_dim.t - source_dim.t) / step_height),
				htm = '',
				bg_pos,
				top,
				i = 0;

			source.className = 'genie';
			source.style.backgroundPosition = '0 -9999px';

			target.classList.remove('genie-thumb');
			target.classList.add('paced-thumb');

			for (; i<step_length; i++) {
				top    = i * step_height;
				bg_pos = '0px '+ (((top + step_height) / source_dim.h) * 100 ) + '%';
				htm   += '<div class="genie-step" style="left: 0px; top: '+ top +'px; width: '+ source_dim.w +
							'px; height: '+ (step_height + 1) +'px; background-position: '+ bg_pos + ';"></div>';
			}
			source.innerHTML = htm;
			source.classList.add('collapse');

			setTimeout(function() {
				var steps         = source.childNodes,
					radians_left  = Math.floor((target_dim.l - source_dim.l) / 2),
					radians_width = Math.floor((target_dim.w - source_dim.w) / 2),
					rw_offset     = radians_width - target_dim.w,
					increase      = (Math.PI * 2) / (step_length * 2),
					counter       = 4.7,
					i             = 0,
					il            = steps.length;
				for (; i<il; i++) {
					steps[i].style.left  = Math.ceil((Math.sin(counter) * radians_left) + radians_left) +'px';
					steps[i].style.width = Math.ceil((Math.sin(counter) * radians_width) - rw_offset) +'px';
					counter             += increase;
				}
				prefixedEvent(steps[il-1], 'transitionend', genie.doEvent);
			}, 100);
		},
		setupTarget: function(img, source_dim) {
			var target        = this.el,
				margin        = 100,
				dEl           = document.documentElement,
				dBody         = document.body,
				window_width  = Math.max(dEl.clientWidth, dBody.scrollWidth, dEl.scrollWidth, dBody.offsetWidth, dEl.offsetWidth) - (margin * 2),
				window_height = source_dim.t - (margin * 2),
				gauge_src     = img.getAttribute('data-src'),
				gauge_width   = +img.getAttribute('data-width'),
				gauge_height  = +img.getAttribute('data-height'),
				gauge_ratio,
				target_width,
				target_height;

			gauge_ratio   = gauge_width / gauge_height;
			target_width  = window_width;
			target_height = window_width / gauge_ratio;

			if (target_height > window_height) {
				target_height = window_height;
				target_width  = window_height * gauge_ratio;
			}

			target.style.display            = 'block';
			target.style.width              = target_width +'px';
			target.style.height             = target_height +'px';
			target.style.top                = (margin * 1.2) +'px';
			target.style.left               = (margin + Math.floor((window_width - target_width) / 2)) +'px';
			target.style.backgroundPosition = '0px -9999px';
			target.style.backgroundImage    = 'url('+ gauge_src +')';
			target.className                = 'genie';
			target.thumbEl                  = img;

			return getDim(target);
		},
		expand: function(source) {
			var step_height   = this.step_height,
				target        = this.el,
				source_dim    = getDim(source),
				target_dim    = this.setupTarget(source, source_dim),
				diffT         = source_dim.t - target_dim.t,
				radians_left  = Math.floor((source_dim.l - target_dim.l) / 2),
				radians_width = Math.floor((source_dim.w - target_dim.w) / 2),
				rw_offset     = radians_width - source_dim.w,
				step_length   = Math.ceil((source_dim.t - target_dim.t) / step_height),
				increase      = (Math.PI * 2) / (step_length * 2),
				counter       = 4.75,
				htm           = '',
				i             = 0,
				bgy;

			for (; i<step_length; i++) {
				bgy = (diffT - (i * step_height));
				htm += '<div class="genie-step" style="top: '+ (i * step_height) +
						'px; height: '+ (step_height + 1) +'px; background-position: 0px '+ bgy +
						'px; left: '+ Math.ceil((Math.sin(counter) * radians_left) + radians_left) +
						'px; width: '+ Math.ceil((Math.sin(counter) * radians_width) - rw_offset) +'px;"></div>';
				counter += increase;
			}
			target.innerHTML = htm;

			// single listener
			prefixedEvent(target.childNodes[step_length-1], 'TransitionEnd', genie.doEvent);

			setTimeout(function() {
				var steps    = target.childNodes,
					s_dim    = source_dim,
					t_dim    = target_dim,
					s_height = step_height,
					il       = steps.length,
					i        = 0,
					step_top,
					bgy,
					t,
					o;
				for (; i<il; i++) {
					t = i * s_height;
					o = t - t_dim.h;
					bgy = ((t - 2) / (t_dim.h - s_height)) * 100;
					steps[i].style.backgroundPosition = '0% '+ bgy + '%';
				}
				source.style.backgroundPosition = '0 -'+ (s_dim.h + 10) +'px';
				//source.style.backgroundPosition = '0 -'+ (s_dim.t - t_dim.t - t_dim.h) +'px';
				target.className += ' expand';
			}, 100);
		}
	};

window.onload = genie.init;

}());

