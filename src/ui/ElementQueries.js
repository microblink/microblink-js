/**
 * @license
 *
 * Copyright (c) 2013 Marc J. Schmidt

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 * */

export default function(ResizeSensor, shadowRoot) {

	var ElementQueries = function () {

		var cssStyleElement;
		var allQueries = {};
		var idToSelectorMapping = [];

		function getEmSize(element) {
			if (!element) {
				element = document.documentElement;
			}
			var fontSize = window.getComputedStyle(element, null).fontSize;
			return parseFloat(fontSize) || 16;
		}

		function getElementSize(element) {
			if (!element.getBoundingClientRect) {
				return {
					width: element.offsetWidth,
					height: element.offsetHeight
				}
			}
			var rect = element.getBoundingClientRect();
			return {
				width: Math.round(rect.width),
				height: Math.round(rect.height)
			}
		}

		function convertToPx(element, value) {
			var numbers = value.split(/\d/);
			var units = numbers[numbers.length - 1];
			value = parseFloat(value);
			switch (units) {
				case "px":
					return value;
				case "em":
					return value * getEmSize(element);
				case "rem":
					return value * getEmSize();
				case "vw":
					return value * document.documentElement.clientWidth / 100;
				case "vh":
					return value * document.documentElement.clientHeight / 100;
				case "vmin":
				case "vmax":
					var vw = document.documentElement.clientWidth / 100;
					var vh = document.documentElement.clientHeight / 100;
					var chooser = Math[units === "vmin" ? "min" : "max"];
					return value * chooser(vw, vh);
				default:
					return value;
			}
		}

		function SetupInformation(element, id) {
			this.element = element;
			var key, option, elementSize, value, actualValue, attrValues, attrValue, attrName;
			var attributes = ['min-width', 'min-height', 'max-width', 'max-height'];

			this.call = function () {
				elementSize = getElementSize(this.element);
				attrValues = {};

				for (key in allQueries[id]) {
					if (!allQueries[id].hasOwnProperty(key)) {
						continue;
					}
					option = allQueries[id][key];

					value = convertToPx(this.element, option.value);

					actualValue = option.property === 'width' ? elementSize.width : elementSize.height;
					attrName = option.mode + '-' + option.property;
					attrValue = '';

					if (option.mode === 'min' && actualValue >= value) {
						attrValue += option.value;
					}
					if (option.mode === 'max' && actualValue <= value) {
						attrValue += option.value;
					}
					if (!attrValues[attrName]) attrValues[attrName] = '';
					if (attrValue && -1 === (' ' + attrValues[attrName] + ' ').indexOf(' ' + attrValue + ' ')) {
						attrValues[attrName] += ' ' + attrValue;
					}
				}

				for (var k in attributes) {
					if (!attributes.hasOwnProperty(k)) continue;
					if (attrValues[attributes[k]]) {
						this.element.setAttribute(attributes[k], attrValues[attributes[k]].substr(1));
					} else {
						this.element.removeAttribute(attributes[k]);
					}
				}
			};
		}

		function setupElement(element, id) {
			if (!element.elementQueriesSetupInformation) {
				element.elementQueriesSetupInformation = new SetupInformation(element, id);
			}
			if (!element.elementQueriesSensor) {
				element.elementQueriesSensor = new ResizeSensor(element, function () {
					element.elementQueriesSetupInformation.call();
				});
			}

			element.elementQueriesSetupInformation.call();
		}

		function queueQuery(selector, mode, property, value) {
			if (typeof(allQueries[selector]) === 'undefined') {
				allQueries[selector] = [];
				// add animation to trigger animationstart event, so we know exactly when a element appears in the DOM

				var id = idToSelectorMapping.length;
				cssStyleElement.innerHTML += '\n' + selector + ' {animation: 0.1s element-queries;}';
				cssStyleElement.innerHTML += '\n' + selector + ' > .resize-sensor {min-width: '+id+'px;}';
				idToSelectorMapping.push(selector);
			}
			allQueries[selector].push({
				mode: mode,
				property: property,
				value: value
			});
		}

		function getQuery(container) {
			var query;
			if (document.querySelectorAll) query = (container) ? container.querySelectorAll.bind(container) : shadowRoot ? shadowRoot.querySelectorAll.bind(shadowRoot) : document.querySelectorAll.bind(document);
			if (!query && 'undefined' !== typeof $$) query = $$;
			if (!query && 'undefined' !== typeof jQuery) query = jQuery;

			if (!query) {
				throw 'No document.querySelectorAll, jQuery or Mootools\'s $$ found.';
			}
			return query;
		}

		function findElementQueriesElements(container) {
			var query = getQuery(container);
			for (var selector in allQueries) if (allQueries.hasOwnProperty(selector)) {
				// find all elements based on the extract query selector from the element query rule
				var elements = query(selector, container);

				for (var i = 0, j = elements.length; i < j; i++) {
					setupElement(elements[i], selector);
				}
			}
		}

		function attachResponsiveImage(element) {
			var children = [];
			var rules = [];
			var sources = [];
			var defaultImageId = 0;
			var lastActiveImage = -1;
			var loadedImages = [];

			for (var i in element.children) {
				if (!element.children.hasOwnProperty(i)) continue;

				if (element.children[i].tagName && element.children[i].tagName.toLowerCase() === 'img') {
					children.push(element.children[i]);
					var minWidth = element.children[i].getAttribute('min-width') || element.children[i].getAttribute('data-min-width');
					//var minHeight = element.children[i].getAttribute('min-height') || element.children[i].getAttribute('data-min-height');
					var src = element.children[i].getAttribute('data-src') || element.children[i].getAttribute('url');
					sources.push(src);
					var rule = {
						minWidth: minWidth
					};
					rules.push(rule);
					if (!minWidth) {
						defaultImageId = children.length - 1;
						element.children[i].style.display = 'block';
					} else {
						element.children[i].style.display = 'none';
					}
				}
			}

			lastActiveImage = defaultImageId;

			function check() {
				var imageToDisplay = false, i;
				for (i in children) {
					if (!children.hasOwnProperty(i)) continue;

					if (rules[i].minWidth) {
						if (element.offsetWidth > rules[i].minWidth) {
							imageToDisplay = i;
						}
					}
				}

				if (!imageToDisplay) {
					imageToDisplay = defaultImageId;
				}
				if (lastActiveImage !== imageToDisplay) {
					if (!loadedImages[imageToDisplay]) {
						var image = new Image();
						image.onload = function () {
							children[imageToDisplay].src = sources[imageToDisplay];
							children[lastActiveImage].style.display = 'none';
							children[imageToDisplay].style.display = 'block';
							loadedImages[imageToDisplay] = true;
							lastActiveImage = imageToDisplay;
						};
						image.src = sources[imageToDisplay];
					} else {
						children[lastActiveImage].style.display = 'none';
						children[imageToDisplay].style.display = 'block';
						lastActiveImage = imageToDisplay;
					}
				} else {
					children[imageToDisplay].src = sources[imageToDisplay];
				}
			}
			element.resizeSensorInstance = new ResizeSensor(element, check);
			check();
		}

		function findResponsiveImages() {
			var query = getQuery();
			var elements = query('[data-responsive-image],[responsive-image]');
			for (var i = 0, j = elements.length; i < j; i++) {
				attachResponsiveImage(elements[i]);
			}
		}

		var regex = /,?[\s\t]*([^,\n]*?)((?:\[[\s\t]*?(?:min|max)-(?:width|height)[\s\t]*?[~$\^]?=[\s\t]*?"[^"]*?"[\s\t]*?])+)([^,\n\s\{]*)/mgi;
		var attrRegex = /\[[\s\t]*?(min|max)-(width|height)[\s\t]*?[~$\^]?=[\s\t]*?"([^"]*?)"[\s\t]*?]/mgi;

		function extractQuery(css) {
			var match, smatch, attrs, attrMatch;
			css = css.replace(/'/g, '"');
			while (null !== (match = regex.exec(css))) {
				smatch = match[1] + match[3];
				attrs = match[2];
				while (null !== (attrMatch = attrRegex.exec(attrs))) {
					queueQuery(smatch, attrMatch[1], attrMatch[2], attrMatch[3]);
				}
			}
		}

		function readRules(rules) {
			var selector = '';
			if (!rules) {
				return;
			}
			if ('string' === typeof rules) {
				rules = rules.toLowerCase();
				if (-1 !== rules.indexOf('min-width') || -1 !== rules.indexOf('max-width')) {
					extractQuery(rules);
				}
			} else {
				for (var i = 0, j = rules.length; i < j; i++) {
					if (1 === rules[i].type) {
						selector = rules[i].selectorText || rules[i].cssText;
						if (-1 !== selector.indexOf('min-height') || -1 !== selector.indexOf('max-height')) {
							extractQuery(selector);
						} else if (-1 !== selector.indexOf('min-width') || -1 !== selector.indexOf('max-width')) {
							extractQuery(selector);
						}
					} else if (4 === rules[i].type) {
						readRules(rules[i].cssRules || rules[i].rules);
					} else if (3 === rules[i].type) {
						if(rules[i].styleSheet.hasOwnProperty("cssRules")) {
							readRules(rules[i].styleSheet.cssRules);
						}
					}
				}
			}
		}

		var defaultCssInjected = false;

		this.init = function () {
			var animationStart = 'animationstart';
			if (typeof document.documentElement.style['webkitAnimationName'] !== 'undefined') {
				animationStart = 'webkitAnimationStart';
			} else if (typeof document.documentElement.style['MozAnimationName'] !== 'undefined') {
				animationStart = 'mozanimationstart';
			} else if (typeof document.documentElement.style['OAnimationName'] !== 'undefined') {
				animationStart = 'oanimationstart';
			}
			var root = shadowRoot || document.body;

			root.addEventListener(animationStart, function (e) {
				var element = e.target;
        var styles = element && window.getComputedStyle(element, null);
        var animationName = styles && styles.getPropertyValue('animation-name');
        var requiresSetup = animationName && (-1 !== animationName.indexOf('element-queries'));

				if (requiresSetup) {
					element.elementQueriesSensor = new ResizeSensor(element, function () {
						if (element.elementQueriesSetupInformation) {
							element.elementQueriesSetupInformation.call();
						}
					});

					var sensorStyles = window.getComputedStyle(element.resizeSensor, null);
					var id = sensorStyles.getPropertyValue('min-width');
					id = parseInt(id.replace('px', ''));
					setupElement(e.target, idToSelectorMapping[id]);
				}
			});
			root = shadowRoot || document;
			if (!defaultCssInjected) {
				cssStyleElement = document.createElement('style');
				cssStyleElement.type = 'text/css';
				cssStyleElement.innerHTML = '[responsive-image] > img, [data-responsive-image] {overflow: hidden; padding: 0; } [responsive-image] > img, [data-responsive-image] > img {width: 100%;}';
				cssStyleElement.innerHTML += '\n@keyframes element-queries { 0% { visibility: inherit; } }';
				shadowRoot ? shadowRoot.appendChild(cssStyleElement) : document.getElementsByTagName('head')[0].appendChild(cssStyleElement);
        if (!root.styleSheets) {
          Array.prototype.forEach.call(root.querySelectorAll('style'), (style, i) => {
            let styleCpy = document.createElement('style');
            styleCpy.id = 'elemQueryStyleFix' + i;
            styleCpy.innerHTML = style.innerHTML;
            document.head.appendChild(styleCpy);
          });
          root = document;
        }
        for (var i = 0, j = root.styleSheets.length; i < j; i++) {
          try {
            if (root.styleSheets[i].href && 0 === root.styleSheets[i].href.indexOf('file://')) {
              console.log("CssElementQueries: unable to parse local css files, " + root.styleSheets[i].href);
            }
            readRules(root.styleSheets[i].cssRules || root.styleSheets[i].rules || root.styleSheets[i].cssText);
          } catch (e) {
          }
        }
        if(!root.styleSheets) {
          Array.prototype.forEach.call(document.head.querySelectorAll('style'), (style) => {
            if(style.id && style.id.indexOf('elemQueryStyleFix') === 0) {
              document.head.removeChild(style);
            }
          });
        }
      }
      defaultCssInjected = true;
			findResponsiveImages();
		};

		this.findElementQueriesElements = function (container) {
			findElementQueriesElements(container);
		};
		this.update = function () {
			this.init();
		};
	};

	ElementQueries.update = function () {
		ElementQueries.instance.update();
	};

	ElementQueries.detach = function (element) {
		if (element.elementQueriesSetupInformation) {
			element.elementQueriesSensor.detach();
			delete element.elementQueriesSetupInformation;
			delete element.elementQueriesSensor;
		} else if (element.resizeSensorInstance) {
			element.resizeSensorInstance.detach();
			delete element.resizeSensorInstance;
		}
	};

	ElementQueries.init = function () {
		if (!ElementQueries.instance) {
			ElementQueries.instance = new ElementQueries();
		}
		ElementQueries.instance.init();
	};

	var domLoaded = function (callback) {
    if(/loaded|complete/i.test(document.readyState)) {
      callback();
    }
		else if (document.addEventListener) {
			document.addEventListener('DOMContentLoaded', callback, false);
		}
		else if (/KHTML|WebKit|iCab/i.test(navigator.userAgent)) {
			var DOMLoadTimer = setInterval(function () {
				if (/loaded|complete/i.test(document.readyState)) {
					callback();
					clearInterval(DOMLoadTimer);
				}
			}, 10);
		}
		else window.onload = callback;
	};
	ElementQueries.findElementQueriesElements = function (container) {
		ElementQueries.instance.findElementQueriesElements(container);
	};
	ElementQueries.listen = function () {
		domLoaded(ElementQueries.init);
	};
	return ElementQueries;
};
