
// Javascript controlled by Hakan Bilgin (c) 2013

(function() {

'use strict';

var $ = function(selector, context) {
		context = context || document;
		return [].slice.call( context.querySelectorAll(selector) );
	},
	getDim = function(el, attr, val) {
		if (!el) return null;
		attr = attr || 'nodeName';
		val = val || 'BODY';
		var dim = {w: el.offsetWidth, h: el.offsetHeight, t: 0, l: 0, obj: el};
		while (el && el[attr] != val && el.getAttribute(attr) != val) {
			if (el == document.firstChild) return null;
			dim.t += el.offsetTop - el.scrollTop;
			dim.l += el.offsetLeft - el.scrollLeft;
			if (el.scrollWidth > el.offsetWidth) {
				//dim.w = Math.min(dim.w, dim.w-(dim.w + dim.l - el.offsetWidth - el.scrollLeft));
				dim.w = el.offsetWidth;
			}
			el = el.offsetParent;
		}
		return dim;
	},
	prefixedEvent = function(el, type, callback) {
		var pfx = 'webkit moz MS o '.split(' ');
		for (var p=0, pl=pfx.length; p<pl; p++) {
			if (!pfx[p]) type = type.toLowerCase();
			el.addEventListener(pfx[p] + type, callback, false);
		}
	},
	genie = {
		step_height: 3,
		init: function() {
			var el = document.body.appendChild( document.createElement('div') );
			this.el = el;

			var thumbs = $('.dock img');
			for (var i=0, il=thumbs.length; i<il; i++) {
				thumbs[i].setAttribute('data-src', thumbs[i].src );
				thumbs[i].style.backgroundImage = 'url('+ thumbs[i].src +')';
				thumbs[i].style.height = thumbs[i].height +'px';
				thumbs[i].src = '../img/_.gif';
			}

			document.addEventListener('click', this.doEvent, false);

			//genie.expand( thumbs[0] );
		},
		doEvent: function(event) {
			var target = event.target;
			switch(event.type) {
				case 'animationend':
				case 'oAnimationEnd':
				case 'MSAnimationEnd':
				case 'mozAnimationEnd':
				case 'webkitAnimationEnd':
					if (event.animationName === 'genie_scale') {
						// clear divs
						var tmp = target.parentNode;
						tmp.style.backgroundPosition = '0px 0px';
						tmp.innerHTML = '';
					}
					break;
				case 'transitionend':
					if (event.propertyName === 'left') {
						var source = target.parentNode,
							target = source.thumbEl,
							source_dim = getDim(source),
							target_dim = getDim(target),
							diffT = target_dim.t + source_dim.t - 100,
							step = source.childNodes,
							step_height = step[0].offsetHeight;
						target.style.backgroundPosition = '0px 0px';

						for (var i=0, il=step.length; i<il; i++) {
							step[i].style.backgroundPosition = '0px '+ (diffT + i - (i * step_height)) +'px';
						}
						source.className += ' change-pace';
					}
					if (event.propertyName === 'background-position') {
						target.parentNode.innerHTML = '';
					}
					break;
				case 'click':
					if (target.classList.contains('genie-thumb')) {
						genie.expand( target );
					}
					if (target.classList.contains('genie')) {
						genie.collapse();
					}
					break;
			}
		},
		collapse: function() {
			var step_height = this.step_height,
				source = this.el,
				source_dim = getDim(source),
				target = source.thumbEl,
				target_dim = getDim(target),
				step_length = Math.ceil((target_dim.t - source_dim.t) / step_height),
				htm = '',
				bg_pos,
				top,
				i = 0;

			source.className = 'genie';
			source.style.backgroundPosition = '0px -9999px';

			for (; i<step_length; i++) {
				top = i * step_height;
				bg_pos = '0px '+ (((top + step_height) / source_dim.h) * 100 ) + '%';
				htm += '<div class="genie-step" style="left: 0px; top: '+ top +'px; width: '+ source_dim.w +
						'px; height: '+ (step_height + 1) +'px; background-position: '+ bg_pos +';"></div>';
			}
			source.innerHTML = htm;

			setTimeout(function() {
				var steps = source.childNodes,
					radians_left = Math.floor((target_dim.l - source_dim.l) / 2),
					radians_width = Math.floor((target_dim.w - source_dim.w) / 2),
					rw_offset = radians_width - target_dim.w + 1,
					increase = (Math.PI * 2) / (step_length * 2),
					counter = 4.7,
					i = 0,
					il = steps.length;
				for (; i<il; i++) {
					steps[i].style.left = Math.ceil((Math.sin(counter) * radians_left) + radians_left) +'px';
					steps[i].style.width = Math.ceil((Math.sin(counter) * radians_width) - rw_offset) +'px';
					counter += increase;
				}
				steps[il-1].addEventListener('transitionend', genie.doEvent, true);
				source.className += ' collapse';
			}, 0);
		},
		setupTarget: function(img, source_dim) {
			var target = this.el,
				margin = 100,
				window_width = -(margin * 2) + Math.max(document.documentElement.clientWidth, document.body.scrollWidth, document.documentElement.scrollWidth, document.body.offsetWidth, document.documentElement.offsetWidth),
				window_height = -(margin * 2) + source_dim.t,
				gauge = new Image(),
				gauge_ratio,
				target_width,
				target_height,
				target_top,
				target_left;

			gauge.src = img.getAttribute('data-src');

			gauge_ratio = gauge.width / gauge.height;
			target_width = window_width;
			target_height = window_width / gauge_ratio;

			if (target_height > window_height) {
				target_height = window_height;
				target_width = window_height * gauge_ratio;
			}

			target_top = margin / 2;
			target_left = margin + Math.floor((window_width - target_width) / 2);

			target.style.display = 'block';
			target.style.width = target_width +'px';
			target.style.height = target_height +'px';
			target.style.top = target_top +'px';
			target.style.left = target_left +'px';
			target.style.backgroundPosition = '0px -9999px';
			target.style.backgroundImage = 'url('+ gauge.src +')';
			target.className = 'genie';
			target.thumbEl = img;

			return getDim(target);
		},
		expand: function(source) {
			var step_height = this.step_height,
				target = this.el,
				source_dim = getDim(source),
				target_dim = this.setupTarget(source, source_dim),
				diffT = source_dim.t - target_dim.t,
				radians_left = Math.floor((source_dim.l - target_dim.l) / 2),
				radians_width = Math.floor((source_dim.w - target_dim.w) / 2),
				rw_offset = radians_width - source_dim.w + 1,
				step_length = Math.ceil((source_dim.t - target_dim.t) / step_height),
				increase = (Math.PI * 2) / (step_length * 2),
				counter = 4.7,
				htm = '',
				i = 0;
			for (; i<step_length; i++) {
				htm += '<div class="genie-step" data-top="'+ (i * step_height) +'" style="top: '+ (i * step_height) +
						'px; height: '+ (step_height + 1) +'px; background-position: 0px '+ (diffT - (i * step_height)) +
						'px; left: '+ Math.ceil((Math.sin(counter) * radians_left) + radians_left) +
						'px; width: '+ Math.ceil((Math.sin(counter) * radians_width) - rw_offset) +'px;"></div>';
				counter += increase;
			}
			target.innerHTML = htm;

			// one listener
			prefixedEvent(target.childNodes[0], 'AnimationEnd', genie.doEvent);

			setTimeout(function() {
				var steps = target.childNodes,
					s_dim = source_dim,
					t_dim = target_dim,
					s_height = step_height,
					i=0,
					il=steps.length;
				for (; i<il; i++) {
					steps[i].style.backgroundPosition = '0px '+ (((+(steps[i].getAttribute('data-top')) + s_height - 3) / (t_dim.h - 4)) * 100 ) + '%';
				}
				source.style.backgroundPosition = '0px -'+ Math.floor(((s_dim.t - s_dim.h) / t_dim.h) * 100 ) +'px';
				target.className += ' expand';
			}, 0);

		}
	};

window.onload = function() {
	genie.init.apply(genie);
};

}());

