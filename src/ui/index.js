import { SDK } from '../microblink.SDK';

import ResizeSensor from './ResizeSensor.js';
import ElementQueriesFactory from './ElementQueries.js';

import {escapeHtml, labelFromCamelCase, dateFromObject, isMobile, hasClass, addClass, removeClass, toggleClass} from './utils.js';

const Microblink = {
	SDK: SDK
};

// Expose it to global window object
if (window) {
	window['Microblink'] = Microblink;
}

class WebApi extends HTMLElement {

	static get observedAttributes() {
		return ['tabs', 'recognizer', 'autoscroll'];
	}

	get tabs() { return this.hasAttribute('tabs'); }
	set tabs(value) { value === true ? this.setAttribute('tabs', '') : this.removeAttribute('tabs'); }

	get autoscroll() { return this.hasAttribute('autoscroll'); }
	set autoscroll(value) { value === true ? this.setAttribute('autoscroll', '') : this.removeAttribute('autoscroll'); }

	get recognizer() { return this.getAttribute('recognizer'); }
	set recognizer(value) {
		if (value instanceof Array && value.length) {
			this.setAttribute('recognizer', value.join());
		} else {
			this.setAttribute('recognizer', String(value));
		}
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.onScanError = this.onScanError.bind(this);
		this.onScanSuccess = this.onScanSuccess.bind(this);
		this.onScanProgress = this.onScanProgress.bind(this);
		this.startRecording = this.startRecording.bind(this);
		this.autoScrollListener = this.autoScrollListener.bind(this);
		Microblink.SDK.RegisterListener(this);
    Microblink.SDK.SetRecognizers(['MRTD'/*, 'USDL', 'PDF417', 'CODE128', 'CODE39', 'AZTEC', 'DATA_MATRIX', 'EAN13', 'EAN8', 'ITF', 'QR', 'UPCA', 'UPCE', 'SIM', 'VIN', 'UAE_ID_FRONT', 'UAE_ID_BACK', 'CYP_ID_FRONT', 'CYP_ID_BACK'*/]);
		Microblink.SDK.SetAuthorization('Bearer MDY0YWNlMGNiN2IzNGUwZTk4YWVmMDVhZDEyOGJjY2E6Mzk5NzNkNDUtYjg4MS00OWE1LTlhMTItYmEzYTRkNmYzY2Fj');
	}
	connectedCallback() {
		this.getLocalization().then(() => {
			this.shadowRoot.innerHTML = `<style>
				:host {
					all:initial;
					contain: content;
					display: block;
					width: 100%;
					height: 100%;
					box-sizing: border-box;
					border-style: solid;
					--mb-widget-font-family: Helvetica, Tahoma, Verdana, Arial, sans-serif;
					--mb-widget-border-width: 2px;
					--mb-widget-border-color: black;
					--mb-default-font-color: black;
					--mb-btn-font-color: #000;
					--mb-intro-font-color: #575757;
					--mb-btn-background-color: #ffc107;
					--mb-btn-background-color-hover: #C58F08;
					--mb-btn-flip-image-color: black;
					--mb-json-color-null: #ff00ff;
					--mb-json-color-number: #ffc000;
					--mb-json-color-string: #008000;
					--mb-json-color-boolean: #0000FF;
					--mb-json-color-key: #ff0000;
					font-size: inherit;
					font-family: var(--mb-widget-font-family);
					border-width: var(--mb-widget-border-width, 2px);
					border-color: var(--mb-widget-border-color, black);
				}
				.container { height:100%; width:100%; margin:auto; box-sizing: border-box; position: relative;}
				.font-0 {font-size:0;}
				.font-1 {font-size:1rem;}
				button, .button {
					font-family: inherit;
					cursor: pointer;
    				font-size: .9rem;
    				font-weight: 500;
    				line-height: 1;
    				padding: .7222222222em 0;
    				user-select: none;
    				border: 1px solid transparent;
    				outline: none;
    				color: var(--mb-btn-font-color);
    				background-color: var(--mb-btn-background-color);
    				transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out;
    				width: 7.5rem;
				}
				button:hover, .button:hover {
					background-color: var(--mb-btn-background-color-hover);
				}
				button#flipBtn {
					background-color: transparent;
					background-size: auto;
					position: absolute;
					bottom: 1rem;
					right: 1rem;
					margin: 0;
					padding: 0;
					width: 50px;
					height: 50px;
					display: flex;
					justify-content: center;
					align-items: center;
				}
				#flipBtn svg path {
					stroke: var(--mb-btn-flip-image-color);
				}
				#flipBtn svg .fill {
					fill: var(--mb-btn-flip-image-color);
				}
				.intro { text-align: center;}
				.inline {display: inline-block;}
				.intro .inline {
					text-align: center;
					width: 50%;
					height: 100%;
					flex-direction: column;
					padding: 0 10%;
					vertical-align: top;
					box-sizing: border-box;
				}
				.tabs > .container {
					height: calc(100% - 56px);
				}
				.tab-container {
					background: black;
					color: white;
					height: 56px;
					display: none;
					margin: 0;
					padding: 0;
				}
				.tabs .tab-container {
					display: flex;
					justify-content: space-around;
				}
				.flex-center {
					display: flex;
					align-items: center;
					justify-content: center;
				}
				.intro .flex-center {
					flex-direction: column;
					height: 100%;
				}
				.inline p { margin: 0; }
				.intro-label {
					color: var(--mb-intro-font-color);
				}
				.intro .inline p { margin-bottom: 2.5rem; }
				.intro .inline + .inline {
					border-left: 1px solid;
					border-image: linear-gradient(to bottom, transparent 15%, #bdbdbd 1.8rem, #bdbdbd 85%, transparent 85%) 0 100% ;
				}
				.intro .inline:only-child {
					width: 100%;
				}
				.dropzone {
					padding: 2rem 1.4rem;
				}
				.dropzone * { pointer-events: none; }
				.dropzone button { pointer-events: auto; }
				.draghover {
					background-color: rgba(72, 178, 232, .4);
					cursor: copy;
				}
				#file {
					display: none;
				}
				.video {
					display: flex;
					justify-content: center;
				}
				video.flipped, #flipBtn.flipped {
					-ms-transform: scaleX(-1);
					-webkit-transform: scaleX(-1);
					transform: scaleX(-1);
				}
				video {
					height: 100%;
				}
				.pending-container, .error-container, .permission {
					display: none;
					position: fixed;
					z-index: 1000;
					top: 0;
					bottom: 0;
					left: 0;
					right: 0;
				}
				.pending-container { 
					background-color: black; 
					flex-direction: column;
					color: white;
				}
				.pending-container h2 {
					font-size: 1.4rem;
					margin: 0 0 1rem;
					font-weight: 500;
				}
				.pending-container.loader { 
					background-color: #48b2e8;
					color: black;
				}
				.pending-container.show, .error-container.show, .permission.show {
					display: flex;
					align-items: center;
					justify-content: center;
				}
				.loader-img {
					display: none;
    				position: relative;
    				margin: 0;
				}
				.progress-bar {
  					background-color: rgba(72, 128, 232, 0.25);
  					width: 37.5%;
  					height: 10px;		
  					position: relative;
  					display: block;
				}
				.progress-bar > .progress-bar-value {
				 	background-color: #48b2e8;
				 	display: block;
				 	width: 0%;
				 	height: 100%;
				 	transition: width 0.25s linear;
				}
				.error-container, .permission {
					background-color: #000;
					color: white;
					font-weight: 500;
					font-size: 1.4rem;
					text-align: center;
				}
				.error-container.show {
					flex-direction: column;
				}
				.error-container p { margin: 2.5rem 0; }
				.container.hidden {
					display: none;
				}
				.hidden {
					display: none;
				}
				.show {
					display: block;
				}
				.container.main > * {
					display: none;
				}
				.container.main > .active {
					display: block;
				}
				.container.main > .image.active {
					display: block;
					overflow: hidden;
				}
				.container.main > .json {
					padding: 0.7rem 1.5rem;
					overflow: auto;
					font-size: 0.9rem;
					line-height: 1.5rem;
					position: relative;
				}
				.json > div {
					white-space: pre;
				}
				.json .key { color: var(--mb-json-color-key); }
				.json .string { color: var(--mb-json-color-string); }
				.json .number { color: var(--mb-json-color-number); }
				.json .null { color: var(--mb-json-color-null); }
				.json .boolean { color: var(--mb-json-color-boolean); }
				#copyBtn {
					font-size: 0.8rem;
					padding: 0 0.8rem;
					line-height: 1.9rem;
					height: 1.9rem;
					box-sizing: content-box;
					width: auto;
					position: absolute;
					top: 1.5rem;
					right: 1.5rem;
				}
				.cpyTxtArea {
					position: absolute;
					left: -9999px;
					top: -9999px;
				}
				.container.results { overflow: auto; }
				.container.results caption {
					text-align: center;
					padding: 1rem 2rem;
					font-weight: bold;
					font-size: 1.2rem;
					color: var(--mb-default-font-color);
				}
				.results table {
					border-width: 1px 0;
					border-style: solid;
					table-layout: fixed;
					width: 100%;
					border-collapse: collapse;
				}
				.results table + table {
					margin-top: 2rem;
				}
				.results th {
					font-weight: bold;
					background-color: #f2f2f2;
				}
				.results th, .results td {
					width: 50%;
					word-break: break-word;
					border: 1px solid black;
					padding: 0.8rem 2rem;
					box-sizing: border-box;
				}
				.results th:first-child, .results td:first-child {
					border-left: 0;
					text-transform: capitalize;
				}
				.results th:last-child, .results td:last-child {
					border-right: 0;
				}
				.results td:last-child {
					font-weight: 500;
					color: var(--mb-default-font-color);
				}
				.container.image img {
					width: 100%;
					height: auto;
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					max-width: 100%;
					max-height: 100%;
					object-fit: contain;
				}
				#photoBtn {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
				}
				#counter {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					background: rgba(72, 178, 232, 0.7);
					width: 8rem;
					height: 8rem;
					display: none;
					text-align: center;
					color: black;
					font-size: 2.5rem;
					justify-content: center;
					align-items: center;
				}
				.counter-number, .counter-alt {
					margin: 0;
					padding: 0;
					font-weight: 500;
				}
				.counter-alt {
					line-height: 1.25;
					font-size: 2.5rem;
				}
				.counter-number {
					line-height: 1;
					font-size: 4rem;
				}
				#counter.show {
					display: flex;
				}
				.tab {
					text-align: center;
					line-height: 56px;
					cursor: pointer;
				}
				.tab label {
					display: inline-block;
					margin: auto;
					padding: 0 1.25rem;
					box-sizing: border-box;
					border-bottom: 4px solid transparent;
					height: 56px;
					user-select: none;
					cursor: inherit;
				}
				.tab:hover label, .tab.active label {
					color: #48b2e8;
					border-bottom-color: #48b2e8;
				}

				@media only screen and (max-width: 775px) {
					.intro .inline {
						padding: 0 5%;
					}
				}
				@media only screen and (max-width: 500px) {
					.tab label {
						padding: 0 0.5rem;
					}
					.intro .inline {
						height: 50%;
						width: 100%;
						padding: 0 15%;
					}
					.intro .inline + .inline {
						border-left: none;
						border-top: 1px solid;
						border-image: linear-gradient(to right, transparent 15%, #bdbdbd 1.8rem, #bdbdbd 85%, transparent 85%) 100% 0;
					}
					.intro .inline:only-child {
						height: 100%;
					}
					.intro .inline p { margin-bottom: 1.5rem; }
				}

				.container.root[max-width~="500px"] .tab label {
					padding: 0 5%;
				}
				.container.root[max-width~="500px"] .intro .inline {
					height: 50%;
					width: 100%;
					padding: 0 15%;
				}
				.container.root[max-width~="500px"] .intro .inline + .inline {
					border-left: none;
					border-top: 1px solid;
					border-image: linear-gradient(to right, transparent 15%, #bdbdbd 1.8rem, #bdbdbd 85%, transparent 85%) 100% 0;
				}
				.container.root[max-width~="500px"] .intro .inline:only-child {
					height: 100%;
				}
				.container.root[max-width~="500px"] .intro .inline p {margin-bottom: 1.5rem;}

				@media only screen and (orientation: portrait) {
					.container.image img {
						width: auto;
						height: 100%;
					}
				}
			</style>
			<div class="container root">
				<div class="tab-container">
					<div class="tab" id="introTab"><label><slot name="tabs.retake">RETAKE</slot></label></div>
					<div class="tab active" id="resultsTab"><label><slot name="tabs.results">RESULTS</slot></label></div>
					<div class="tab" id="imageTab"><label><slot name="tabs.image">IMAGE</slot></label></div>
					<div class="tab" id="jsonTab"><label><slot name="tabs.json">JSON</slot></label></div>
				</div>
				<div class="container main">
					<div class="container intro font-0 active">
						<div class="inline font-1 dropzone">
							<div class="flex-center">
								<p class="intro-label"><slot name="labels.dragDrop">Drag and Drop<br/>document here OR</slot></p>
								<button type="button" id="fileBtn"><slot name="buttons.browse">Browse</slot></button>
								<input type="file" accept="application/pdf,image/*" id="file" />
							</div>
						</div>
						<div class="inline font-1">
							<div class="flex-center">
								<p class="intro-label"><slot name="labels.cameraActivate">Activate your camera to capture the ID document:</slot></p>
								<button type="button" id="cameraBtn"><slot name="buttons.camera">Use camera</slot></button>
							</div>
						</div>
					</div>
					<div class="container results"></div>
					<div class="container image"></div>
					<div class="container json">
						<button id="copyBtn"><slot name="buttons.copy">Copy to clipboard</slot></button>
						<div></div>
					</div>
				</div>
				<div class="container video hidden">
					<video id="video" playsinline>Your browser does not support video tag.</video>
					<button type="button" id="photoBtn"><slot name="buttons.takePhoto">TAKE A PHOTO</slot></button>
					<button type="button" id="flipBtn">
						<svg width='44' height='35' viewBox='0 0 44 35' fill='none' xmlns='http://www.w3.org/2000/svg'>
							<path d='M22 7V35' stroke-width='1.38744' stroke-miterlimit='3.8637' stroke-dasharray='1.39 2.77'/>
							<path d='M38.8375 11.5471L27.2239 20.9999L38.8375 30.4527L38.8375 11.5471Z' stroke-width='1.38744'/>
							<path class="fill" d='M5.16247 11.5471L16.7761 20.9999L5.16247 30.4527L5.16247 11.5471Z' stroke-width='1.38744'/>
							<path class="fill" d='M21.4447 1.75C23.851 1.75 26.2572 2.975 28.1082 5.075L26.0721 7H31.625V1.75L29.4038 3.85C27.1827 1.4 24.4063 0 21.4447 0C17.9279 0 14.7812 1.75 12.375 5.075L13.8558 6.125C15.8918 3.325 18.4832 1.75 21.4447 1.75Z'/>
						</svg>
					</button>
					<div id="counter">
						<p class="counter-number"></p>
						<p class="counter-alt hidden"><slot name="labels.holdStill">HOLD STILL</slot></p>
					</div>
				</div>
				<div class="pending-container">
					<h2><slot name="labels.processing">Processing</slot></h2>
					<div class="progress-bar">
						<div class="progress-bar-value"></div>
					</div>
					<img class="loader-img" src="https://microblink.com/bundles/microblinkmicroblink/images/loading-animation-on-blue.gif" />
				</div>
				<div class="error-container">
					<p><slot name="labels.errorMsg">We're sorry, but something went wrong. Please try again.</slot></p>
					<button type="button" id="againBtn"><slot name="buttons.tryAgain">TRY AGAIN</slot></button>
				</div>
				<div class="permission">
					<p><slot name="labels.permissionMsg">Enable camera please</slot></p>
				</div>
			</div>
		`;
			/*let template = this.getElementsByClassName('web-api-style')[0];
			if (template) {
				this.shadowRoot.insertBefore(template.content.cloneNode(true), this.shadowRoot.childNodes[1]);
			}*/
			this.shadowRoot.getElementById('fileBtn').addEventListener('click', () => this.shadowRoot.getElementById('file').click());
			this.shadowRoot.getElementById('file').addEventListener('click', function() { this.value = ''; });
			this.shadowRoot.getElementById('file').addEventListener('touchstart', function() { this.value = ''; });
			this.shadowRoot.getElementById('file').addEventListener('change', this.fileChosen.bind(this));
			this.shadowRoot.getElementById('againBtn').addEventListener('click', () => {
				this.restart();
				this.stopCamera();
				this.toggleError();
			});
			this.shadowRoot.querySelector('.dropzone').addEventListener('dragover', event => event.preventDefault());
			this.shadowRoot.querySelector('.dropzone').addEventListener('drop', this.onDrop.bind(this));
			this.shadowRoot.querySelector('.dropzone').addEventListener('dragenter', this.onDragEnter.bind(this));
			this.shadowRoot.querySelector('.dropzone').addEventListener('dragleave', this.onDragLeave.bind(this));
			this.shadowRoot.getElementById('cameraBtn').addEventListener('click', this.activateCamera.bind(this));
			this.shadowRoot.querySelector('video').addEventListener('loadedmetadata', function() { this.play(); });
			this.shadowRoot.getElementById('photoBtn').addEventListener('click', () => this.startRecording());
			this.shadowRoot.getElementById('flipBtn').addEventListener('click', this.flipCamera.bind(this));

			Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.tab'), elem => {
				elem.addEventListener('click', () => {
					let tabId = elem.id;
					Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.tab'), elem => toggleClass(elem, 'active', tabId === elem.id));
					Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.main > .container'), elem => {
						toggleClass(elem, 'active', hasClass(elem, tabId.substring(0,tabId.length - 3)));
					});
				});
			});

			this.shadowRoot.getElementById('copyBtn').addEventListener('click', () => {
				let text = this.shadowRoot.querySelector('.main > .json > div').textContent;
				let textarea = document.createElement('textarea');
				textarea.value = text;
				textarea.className += 'cpyTxtArea';
				this.shadowRoot.appendChild(textarea);
				textarea.select();
				document.execCommand('copy');
				this.shadowRoot.removeChild(textarea);
			});
			this.handleWebRTCSupport();
			this.adjustComponent();
		});
		window.addEventListener('resize', this.adjustComponent.bind(this));
		this.ElementQueries = ElementQueriesFactory(ResizeSensor);
		this.ElementQueries.listen();
		this.ElementQueries.init();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'recognizer' && newValue) {
			let recognizers = newValue.split(',');
			if (recognizers.length === 1) recognizers = recognizers[0];
			Microblink.SDK.SetRecognizers(recognizers);
		}
		else if (name === 'autoscroll') {
			window[( newValue !== null ? 'add' : 'remove') + 'EventListener']('scroll', this.autoScrollListener);
		}
	}

	setAuthorization(authorization) {
		if (authorization) {
			Microblink.SDK.SetAuthorization(authorization);
		}
	}

	setEndPoint(endpoint) {
		if (endpoint) {
			Microblink.SDK.SetEndpoint(endpoint);
		}
	}

	adjustComponent() {
		if (isMobile()) {
			this.style.height = `${window.innerHeight}px`;
			if(parseInt(getComputedStyle(this.parentNode).height) < window.innerHeight) {
				this.style.height = getComputedStyle(this.parentNode).height;
			}
			this.shadowRoot.getElementById('flipBtn').style.setProperty('display', 'none', 'important');
		}
	}

	autoScrollListener(event) {
		if (isMobile()) {
			if (this.autoScrollListener.previousPositionY === undefined) {
				this.autoScrollListener.previousPositionY = this.getBoundingClientRect().top;
			} else {
				let previousPositionY = this.autoScrollListener.previousPositionY;
				let positionY = this.getBoundingClientRect().top;
				this.autoScrollListener.previousPositionY = positionY;
				if (Math.abs(positionY) < 30 && Math.abs(previousPositionY) > Math.abs(positionY)) {
					event.preventDefault();
					if (!this.autoScrollListener.touchEventInit) {
						this.autoScrollListener.touchEventInit = true;
						document.body.style.setProperty('overflow', 'hidden', 'important');
						window.scrollTo(0, window.pageYOffset + this.getBoundingClientRect().top);
						let posIntervalId = setInterval(() => window.scrollTo(0, window.pageYOffset + this.getBoundingClientRect().top), 25);
						setTimeout(() => {
							clearInterval(posIntervalId);
							document.body.style.overflow = '';
							this.autoScrollListener.touchEventInit = false;
						}, 400);
					}
				}
			}
		}
	}

	handleWebRTCSupport() {
		if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
			let cameraPart = this.shadowRoot.querySelector('.container.intro .inline + .inline');
			cameraPart.parentNode.removeChild(cameraPart);
		}
	}

	getLocalization() {
		let template = this.getElementsByClassName('localization')[0];
		if (template) {
			return new Promise(resolve => {
				let isJson = /\sjson\s/.test(` ${template.className} `);
				if (isJson) {
					try {
						this.handleJson(JSON.parse(template.content.textContent));
						resolve(true);
					} catch(exception) {
						resolve(false);
					}
				} else {
					let url = template.content.textContent;
					let xhr = new XMLHttpRequest();
					xhr.onreadystatechange = () => {
						if (xhr.readyState === 4 && xhr.status === 200) {
							try {
								this.handleJson(JSON.parse(xhr.responseText));
								resolve(true);
							} catch (exception) {
								resolve(false);
							}
						} else if (xhr.readyState === 4) {
							resolve(false);
						}

					};
					xhr.open('GET', url && url.trim(), true);
					xhr.send();
				}

			});
		} else
			return Promise.resolve(true);
	}

	handleJson(json) {
		let templateHtml = "";
		iterateJson(json, '');
		if (templateHtml) {
			let template = document.createElement('template');
			template.innerHTML = templateHtml;
			this.appendChild(template.content.cloneNode(true));
		}

		function iterateJson(jsonTree, name) {
			Object.keys(jsonTree).forEach(key => {
				if (jsonTree[key] instanceof Object) iterateJson(jsonTree[key], name ? (name + '.' + key) : key);
				else templateHtml += `<span slot="${name ? (name + '.' + key) : key}">${jsonTree[key]}</span>`;
			});
		}
	}

	injectStyleSheet(url) {
		if(url) {
			let link = document.createElement('link');
			link.rel = "stylesheet";
			link.type = "text/css";
			link.href = url;
			this.shadowRoot.insertBefore(link, this.shadowRoot.childNodes[1]);
		}
	}

	//TODO: this is testing method - remove it later
	switchLocale() {
		let slotTargets =  this.querySelectorAll('[slot]'); //not live nodelist so it will work
		if (slotTargets && slotTargets.length) {
			Array.prototype.forEach.call(slotTargets, target => target.parentNode.removeChild(target));
		} else {
			this.getLocalization();
		}
	}


	//TODO: this is testing method - remove it later
	switchTheme() {
		var theme = document.getElementById('webApiTheme');
		if (theme) {
			theme.parentNode.removeChild(theme);
		} else {
			let template = document.getElementsByClassName('web-api-style')[0];
			if (template) {
				document.head.appendChild(template.content.cloneNode(true));
			}
		}

	}

  toggleLoader(show) {
    let loader = this.shadowRoot.querySelector('.pending-container');
    if(show) {
      this.shadowRoot.querySelector('.progress-bar-value').style.width = '';
      this.toggleTabs(false);
    }
    toggleClass(loader, 'show', show);
  }

	toggleError(show) {
		let errDialog = this.shadowRoot.querySelector('.error-container');
		toggleClass(errDialog, 'show', show);
	}

	toggleTabs(show) {
		toggleClass(this.shadowRoot.querySelector('.container.root'), 'tabs', show);
		let tabTargets = this.shadowRoot.querySelectorAll('.main > .container');
		if(show === false) {
			Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.tab'), elem => toggleClass(elem, 'active', elem.id === 'resultsTab'));
			Array.prototype.forEach.call(tabTargets, elem => toggleClass(elem, 'active', hasClass(elem, 'intro')));
		} else if(show === true) {
			Array.prototype.forEach.call(tabTargets, elem => toggleClass(elem, 'active', hasClass(elem, 'results')));
		}
	}

	onDrop(event) {
		event.preventDefault();
		this.onDragLeave();
		let file;
		if (event.dataTransfer.items && event.dataTransfer.items[0]) {
			file = event.dataTransfer.items[0].getAsFile();
		} else {
			file = event.dataTransfer.files && event.dataTransfer.files[0];
		}
		if (file) {
			if (file.type && (file.type.indexOf('image') !== -1 || file.type.indexOf('pdf') !== -1)) {
				this.setFile(file);
			}
		}
	}

	onDragEnter() {
		addClass(this.shadowRoot.querySelector('.dropzone'), 'draghover');
		this.shadowRoot.getElementById('fileBtn').style.pointerEvents = 'none';
	}

	onDragLeave() {
		removeClass(this.shadowRoot.querySelector('.dropzone'), 'draghover');
		this.shadowRoot.getElementById('fileBtn').style.pointerEvents = '';
	}

	fileChosen(event) {
		let file = event.target.files && event.target.files[0];
		if (file) this.setFile(file);
	}

	setFile(file) {
		this.toggleLoader(true);
		this.restart();
		Microblink.SDK.SendImage({ blob: file }, this.onScanProgress);
		this.enableResultShow = true;
	}

	activateCamera() {
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			this.shadowRoot.getElementById('cameraBtn').setAttribute('disabled', '');
			let constraints = { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: { ideal: 'environment' } } };
			let permissionTimeoutId = setTimeout(() => { permissionTimeoutId = null; this.permissionDialogPresent(); }, 1500); //this is "event" in case of browser's camera allow/block dialog
			navigator.mediaDevices.getUserMedia(constraints).then(stream => {
				this.permissionDialogAbsent(permissionTimeoutId);
				let video = this.shadowRoot.getElementById('video');
				if ('srcObject' in video) {
					video.srcObject = stream;
				} else {
					video.src = URL.createObjectURL(stream);
				}
				this.toggleTabs(false);
				this.clearTabs();
				Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.root > .container'), elem => toggleClass(elem, 'hidden', !hasClass(elem, 'video')));
			}).catch(error => {
				this.permissionDialogAbsent(permissionTimeoutId);
				this.toggleError(true);
				console.log(error.name); //NotFoundError, NotAllowedError, PermissionDismissedError
			}).then(() => this.shadowRoot.getElementById('cameraBtn').removeAttribute('disabled'));

		} else {
			alert('WebRTC not supported by your browser'); //should we fallback to flash?
		}
	}

	flipCamera() {
		Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.video video, #flipBtn'), elem => toggleClass(elem, 'flipped'));
	}

	stopCamera() {
		let video = this.shadowRoot.getElementById('video');
		video.pause();
		if (video.srcObject) {
			video.srcObject.getTracks()[0].stop();
			video.srcObject = null;
		}
		else if (video.src) {
			if(video.captureStream || video.mozCaptureStream) {
				(video.captureStream || video.mozCaptureStream)().getTracks()[0].stop();
				URL.revokeObjectURL(video.src);
				video.src = null;
			}
		}
		video.load();
		Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.root > .container'), elem => toggleClass(elem, 'hidden', !hasClass(elem, 'main')));
	}

	startRecording() {
		this.enableResultShow = false;
		let countdown = 3;
		addClass(this.shadowRoot.getElementById('photoBtn'), 'hidden');
		addClass(this.shadowRoot.getElementById('counter'), 'show');
		let numberNode = this.shadowRoot.querySelector('.counter-number');
		numberNode.textContent = String(countdown);
		this.frameSendingIntervalId = setInterval(() => {
			this.captureFrame().then(data => {
				Microblink.SDK.SendImage(data);
			});
		}, 100);
		let counterIntervalId = setInterval(() => {
			if(countdown > 1) {
				numberNode.textContent = String(--countdown);
			} else {
				addClass(numberNode, 'hidden');
				removeClass(this.shadowRoot.querySelector('.counter-alt'), 'hidden');
				clearInterval(counterIntervalId);
				this.enableResultShow = true;
				setTimeout(() => {
					this.hideCounter();
				}, 2500);
			}
		}, 1000);
		this.recordingTimeoutId = setTimeout(() => {
			clearInterval(this.frameSendingIntervalId);
			Microblink.SDK.TerminateRequest();
			this.stopCamera();
			this.restartCounter();
			this.restart();
			//TODO: set timed out error this.toggleError(true, 'TIMED OUT');
		}, 15000);
	}

	captureFrame() {
		let video = this.shadowRoot.getElementById('video');
		let canvas = document.createElement('canvas');
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
		let pixelData = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
		return new Promise(resolve => {
			if (canvas.toBlob) {
				canvas.toBlob(blob => resolve({ blob, pixelData }), "image/jpeg");
			} else {
				let binStr = atob(canvas.toDataURL("image/jpeg").split(',')[1]), len = binStr.length, arr = new Uint8Array(len);
				Array.prototype.forEach.call(arr, (_, index) => arr[index] = binStr.charCodeAt(index));
				let blob = new Blob([arr], { type: "image/jpeg" });
				resolve({ blob, pixelData });
			}
		});
	}

	restart() {
		this.toggleTabs(false);
		this.clearTabs();
		Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.root > .container'), elem => toggleClass(elem, 'hidden', !hasClass(elem, 'main')));
	}

	restartCounter() {
		removeClass(this.shadowRoot.getElementById('photoBtn'), 'hidden');
		removeClass(this.shadowRoot.getElementById('counter'), 'show');
		removeClass(this.shadowRoot.querySelector('.counter-number'), 'hidden');
		addClass(this.shadowRoot.querySelector('.counter-alt'), 'hidden');
	}

	hideCounter() {
		removeClass(this.shadowRoot.getElementById('counter'), 'show');
	}

	fillTabs(response) {
		if (response.sourceBlob) {
			let image = new Image();
			image.src = URL.createObjectURL(response.sourceBlob);
			this.shadowRoot.querySelector('.main > .image').appendChild(image);
		}
		this.fillResultTable(response.result);
		this.fillJson(response.result);
		this.toggleTabs(true);
	}

	fillResultTable(json) {
		if (!json || !json.data) return;
		let data = json.data instanceof Array ? json.data : [json.data];
		let innerHtml = '';
		data.forEach(({ recognizer, result }) => {
			if (!result) return;
			innerHtml += `<table>
							<caption>${recognizer}</caption>
							<thead><tr>
								<th><slot name="labels.table.keys">Data field from the ID</slot></th>
								<th><slot name="labels.table.values">Value</slot></th>
							</tr></thead>
							<tbody>`;
			Object.keys(result).forEach(key => {
				innerHtml += `<tr><td>${labelFromCamelCase(key)}</td>
								  <td>${result[key] instanceof Object ? dateFromObject(result[key]) : escapeHtml(result[key])}</td>
							  </tr>`;
			});
			innerHtml += '</tbody></table>';
		});
		if (innerHtml) {
			this.shadowRoot.querySelector('.container.results').innerHTML = innerHtml;
		} else {
			//here paste No results HTML
		}
	}

	fillJson(json) {
		if(!json || JSON.stringify(json) === '{}' || JSON.stringify(json) === '[]') return;
		let jsonHtml = '';
		iterateJson(null, json, 0);
		jsonHtml = jsonHtml.slice(0, -1);
		this.shadowRoot.querySelector('.main > .json > div').innerHTML = jsonHtml;

		function iterateJson(key, value, depth) {
			let prefix = Array(depth + 1).join('     ');
			if (key !== null) {
				if (value === undefined) return;
				jsonHtml += `\n${prefix}<span class="key">"${escapeHtml(key)}"</span>: `;
			} else if (prefix.length) {
				jsonHtml += `\n${prefix}`;
			}
			switch(typeof value) {
				case "undefined": case "function": case "symbol": break;
				case "string":
					jsonHtml += `<span class="string">"${escapeHtml(value)}"</span>,`; break;
				case "number":
					jsonHtml += `<span class="number">${value}</span>,`; break;
				case "boolean":
					jsonHtml += `<span class="boolean">${value}</span>,`; break;
				default: {
					if (value === null) {
						jsonHtml += `<span class="null">${value}</span>,`;
					}
					else if (value instanceof Array) {
						jsonHtml += `[`;
						value.forEach(item => iterateJson(null, item, depth + 1));
						if (value.length) jsonHtml = jsonHtml.slice(0, -1);
						jsonHtml += `\n${prefix}],`;
					} else { //object
						jsonHtml += `{`;
						Object.keys(value).forEach(key => iterateJson(key, value[key], depth + 1));
						if (Object.keys(value).length) jsonHtml = jsonHtml.slice(0, -1);
						jsonHtml += `\n${prefix}},`;
					}
				}
			}
		}
	}

	clearTabs() {
		let image = this.shadowRoot.querySelector('.image image');
		if (image) URL.revokeObjectURL(image.src);
		Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.main > :not(.intro):not(.json)'), elem => elem.innerHTML = '');
		this.shadowRoot.querySelector('.main > .json > div').innerHTML = '';
	}

	onScanSuccess(response) {
		if (!response) return;
		clearInterval(this.frameSendingIntervalId);
		clearTimeout(this.recordingTimeoutId);
		let showIntervalId = setInterval(() => {
			if (this.enableResultShow) {
				clearInterval(showIntervalId);
				this.toggleLoader(false);
				this.stopCamera();
				this.restartCounter();
				if (this.tabs) this.fillTabs(response);
				let event;
				if (typeof CustomEvent === 'function') {
					event = new CustomEvent('resultReady', { detail: { result: response.result }, cancelable: true, bubbles: true });
				} else {
					event = document.createEvent('CustomEvent');
					event.initCustomEvent('resultReady', true, true, { result: response.result });
				}
				this.dispatchEvent(event);
			}
		}, 100);
	}

	onScanError(errorMsg) {
		clearInterval(this.frameSendingIntervalId);
		clearTimeout(this.recordingTimeoutId);
		this.toggleLoader(false);
		this.stopCamera();
		this.restartCounter();
		this.toggleError(true);
		let event;
		if (typeof ErrorEvent === 'function') {
			event = new ErrorEvent('error', { cancelable: true, bubbles: true, message: errorMsg, error: new Error(errorMsg) });
		} else {
			event = document.createEvent('ErrorEvent');
			event.initErrorEvent('error', true, true, errorMsg, null, null );

		}
		this.dispatchEvent(event);
	}

  onScanProgress(progressEvent) {
    let { loaded, total, lengthComputable } = progressEvent;
    let isProgressBarHidden = hasClass(this.shadowRoot.querySelector('.progress-bar'), 'hidden');
    if (lengthComputable) {
      if (isProgressBarHidden) {
        removeClass(this.shadowRoot.querySelector('.pending-container'), 'loader');
        removeClass(this.shadowRoot.querySelector('.progress-bar'), 'hidden');
        removeClass(this.shadowRoot.querySelector('.pending-container h2'), 'hidden');
        removeClass(this.shadowRoot.querySelector('.loader-img'), 'show');
      }
      this.shadowRoot.querySelector('.progress-bar-value').style.width = `${ (loaded/total) * 100 }%`;
    }
    else if(!isProgressBarHidden) {
      addClass(this.shadowRoot.querySelector('.pending-container'), 'loader');
      addClass(this.shadowRoot.querySelector('.progress-bar'), 'hidden');
      addClass(this.shadowRoot.querySelector('.pending-container h2'), 'hidden');
      addClass(this.shadowRoot.querySelector('.loader-img'), 'show');
    }
  }

	permissionDialogPresent() {
		addClass(this.shadowRoot.querySelector('.permission'), 'show');
	}

	permissionDialogAbsent(timeoutId) {
		timeoutId !== null ? clearTimeout(timeoutId) : removeClass(this.shadowRoot.querySelector('.permission'), 'show');
	}

}
customElements.define('microblink-ui-web', WebApi);

setTimeout(() => {
	let template = document.createElement('template');
	template.className = 'web-api-style';
	template.innerHTML = `<style id="webApiTheme">
		microblink-ui-web {
			--mb-widget-font-family: AvenirNextPro;
			--mb-widget-border-width: 4px;
			--mb-widget-border-color: black;
			--mb-default-font-color: #48b2e8;
			--mb-btn-font-color: white;
			--mb-btn-background-color: #48b2e8;
			--mb-btn-background-color-hover: #26a4e4;
			--mb-btn-flip-image-color: #48b2e8;
			--mb-json-color-key: black;
			--mb-json-color-string: #48b2e8;
			--mb-json-color-boolean: black;
			--mb-json-color-number: black;
	}
	</style>`;
	document.body.appendChild(template);
	/*let widgetContainer = document.querySelector('.web-api-component');
	if (widgetContainer) {
		widgetContainer.innerHTML += `
		<microblink-ui-web tabs autoscroll>
			<!--<template class="localization json">
				{
					"buttons" : {
						"browse": "Prolistaj",
						"camera": "Koristi kameru",
						"tryAgain": "POKUŠAJTE PONOVO",
						"takePhoto": "USLIKAJ",
						"copy": "Kopiraj u međuspremnik"
					},
					"labels" : {
						"dragDrop": "Dovuci i otpusti dokument ovdje ILI",
						"cameraActivate": "Uključi kameru za slikanje dokumenta",
						"errorMsg": "Nešto je pošlo krivo. Molimo pokušajte opet.",
						"holdStill": "MIRNO DRŽI",
						"table": {
							"keys": "Podatkovno polje",
							"values": "Vrijednost"
						}
					},
					"tabs" : {
						"retake": "PONOVO",
						"results": "REZULTATI",
						"image": "SLIKA",
						"json": "JSON"
					}
 				}
			</template>-->
		</microblink-ui-web>`;
	}*/
	document.querySelector('microblink-ui-web').switchTheme();
	}, 0);
