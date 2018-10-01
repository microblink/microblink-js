function escapeHtml(txt) {
	return typeof txt === "string" ? txt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/\n/g, '\\n') : txt;
}

function extractFromCamelCase(value) {
	return value.replace(/([A-Z]+)/g, " $1").replace(/([A-Z][a-z])/g, " $1");
}

function dateFromObject(object) {
	let { day, month, year } = object;
	const number = "number";
	if (typeof day !== number || typeof month !== number || typeof year !== number) return object;
	let date = new Date(year, month - 1, day);
	let language = navigator.userLanguage || navigator.language || (navigator.languages && navigator.languages[0]);
	return date.toLocaleDateString(language ? language : undefined);
}

class WebApi extends HTMLElement {

	static get observedAttributes() {
		return ['tabs'];
	}

	get tabs() { return this.hasAttribute('tabs'); }
	set tabs(value) { value === true ? this.setAttribute('tabs', '') : this.removeAttribute('tabs'); }

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.onScanError = this.onScanError.bind(this);
		this.onScanSuccess = this.onScanSuccess.bind(this);
		this.onScanProgress = this.onScanProgress.bind(this);
		this.startRecording = this.startRecording.bind(this);
		//Microblink.SDK.RegisterListener(this);

		const microblinkSDKListener = {
			onScanSuccess: (scanOutput) => {
				console.log('onScanSuccess callback', scanOutput);
			},
			onScanError: (err) => {
				console.error('onScanError callback', err);
			}
		};
		
		Microblink.SDK.RegisterListener(microblinkSDKListener);
		Microblink.SDK.RegisterListener(this);
		
		// Microblink.SDK.SetRecognizers(['MRTD', 'QR', 'VIN']);
		Microblink.SDK.SetRecognizers('MRTD');
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
					--mb-widget-font-family: Tahoma, Verdana, Arial, sans-serif;
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
				} 
				.container { height:100%; width:100%; margin:auto; box-sizing: border-box;}
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
				.inline {display: inline-block;}
				.intro .inline {
					text-align: center;
					width: 50%;
					height: 100%;
					flex-direction: column;
					padding: 0 10%;
					vertical-align: top;
					min-width: 300px;
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
				.loader, .error-container, .permission {
					display: none;
					position: fixed;
					z-index: 1000;
					top: 0;
					bottom: 0;
					left: 0;
					right: 0;
				}
				.loader { background-color: #48b2e8; }
				.show {
					display: block;
				}
				.loader.show, .error-container.show, .permission.show {
					display: flex;
					align-items: center;
					justify-content: center;
				}
				.loader-img {
					display: block;
    				position: relative;
    				margin: 0;
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
				.container.main > * {
					display: none;
				}
				.container.main > .active {
					display: block;
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
				@media (max-width: 500px) {
					.tab label {
						padding: 0 0.5rem;
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
					<div class="container results">OVDJE IDE TABLICA/TABLICE REZULTATA</div>
					<div class="container image">OVDJE IDE SLIKA img src blob</div>
					<div class="container json">
						<button id="copyBtn"><slot name="buttons.copy">Copy to clipboard</slot></button>
						<div></div>
					</div>
				</div>
				<div class="container video hidden">
					<video playsinline>Your browser does not support video tag.</video>
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
				<div class="loader">
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
			$(this.shadowRoot).find('.theme').on('click', this.switchTheme.bind(this));
			$(this.shadowRoot).find('.language').on('click', this.switchLocale.bind(this));
			$(this.shadowRoot).find('#fileBtn').on('click', () => $(this.shadowRoot).find('#file')[0].click());
			$(this.shadowRoot).find('#file').on('click touchstart', function() { $(this).val(''); });
			$(this.shadowRoot).find('#file')[0].addEventListener('change', this.fileChosen.bind(this));
			$(this.shadowRoot).find('#againBtn').on('click', () => {
				this.restart();
				this.stopCamera();
				this.toggleError();
			});
			$(this.shadowRoot).find('.dropzone')[0].addEventListener('dragover', event => event.preventDefault());
			$(this.shadowRoot).find('.dropzone')[0].addEventListener('drop', this.onDrop.bind(this));
			$(this.shadowRoot).find('.dropzone')[0].addEventListener('dragenter', this.onDragEnter.bind(this));
			$(this.shadowRoot).find('.dropzone')[0].addEventListener('dragleave', this.onDragLeave.bind(this));

			$(this.shadowRoot).find('#cameraBtn').on('click', this.activateCamera.bind(this));
			$(this.shadowRoot).find('video').on('loadedmetadata', function() { $(this)[0].play(); });
			$(this.shadowRoot).find('#photoBtn').on('click', () => this.startRecording());
			$(this.shadowRoot).find('#flipBtn').on('click', this.flipCamera.bind(this));

			$(this.shadowRoot).find('.tab').on('click', event => {
				let tabId = event.currentTarget.id;
				$(this.shadowRoot).find('.tab').removeClass('active').filter(`#${tabId}`).addClass('active');
				$(this.shadowRoot).find('.main > .container').removeClass('active').filter(`.${tabId.substring(0,tabId.length - 3)}`).addClass('active');
			});

			$(this.shadowRoot).find('#copyBtn').on('click', () => {
				let text = $(this.shadowRoot).find('.main > .json > div')[0].textContent;
				let textarea = document.createElement('textarea');
				textarea.value = text;
				textarea.className += 'cpyTxtArea';
				this.shadowRoot.appendChild(textarea);
				textarea.select();
				document.execCommand('copy');
				this.shadowRoot.removeChild(textarea);
			});
		});
	}

	attributeChangedCallback(name, oldValue, newValue) {
		/* maybe later*/
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
			$('mb-api-widget').append(template.content.cloneNode(true));
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

	switchLocale() {
		$(this).find('[slot]').remove().length || this.getLocalization();
	}

	switchTheme() {
		if ($('#webApiTheme').length) {
			$('#webApiTheme').remove();
		}
		else {
			let template = document.getElementsByClassName('web-api-style')[0];
			if (template) {
				$(document.head).append(template.content.cloneNode(true));
			}
		}
	}

	toggleLoader(show) {
		let loader = $(this.shadowRoot).find('.loader');
		if(show) {
			this.toggleTabs(false);
		}
		this.toggleDialog(loader, show);

	}

	toggleError(show) {
		let errDialog = $(this.shadowRoot).find('.error-container');
		this.toggleDialog(errDialog, show);
	}

	toggleTabs(show) {
		$(this.shadowRoot).find('.container.root').toggleClass('tabs', show);
		if(show === false) {
			$(this.shadowRoot).find('.tab').removeClass('active').filter('#resultsTab').addClass('active');
			$(this.shadowRoot).find('.main > .container').removeClass('active').filter('.intro').addClass('active');
		} else if(show === true) {
			$(this.shadowRoot).find('.main > .container').removeClass('active').filter('.results').addClass('active');
		}
	}

	toggleDialog(dialog, show) {
		if(show === undefined) {
			dialog.toggleClass('show');
		} else if(show) {
			dialog.addClass('show');
		} else {
			dialog.removeClass('show');
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
		$(this.shadowRoot).find('.dropzone').addClass('draghover');
		$(this.shadowRoot).find('#fileBtn').css({ pointerEvents: 'none'});
	}

	onDragLeave() {
		$(this.shadowRoot).find('.dropzone').removeClass('draghover');
		$(this.shadowRoot).find('#fileBtn').css({ pointerEvents: ''});
	}

	fileChosen(event) {
		let file = event.target.files && event.target.files[0];
		if (file) this.setFile(file);
	}

	setFile(file) {
		this.toggleLoader(true);
		Microblink.SDK.SendImage({ blob: file }, this.onScanProgress);
		setTimeout(() => this.toggleLoader(false), 1500); //TODO: remove this part later
	}

	activateCamera() {
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			$(this.shadowRoot).find('#cameraBtn')[0].setAttribute('disabled', '');
			let constraints = { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: { ideal: 'environment' } } };
			let permissionTimeoutId = setTimeout(() => { permissionTimeoutId = null; this.permissionDialogPresent(); }, 1000); //this is "event" in case of browser's camera allow/block dialog
			navigator.mediaDevices.getUserMedia(constraints).then(stream => {
				this.permissionDialogAbsent(permissionTimeoutId);
				let video = $(this.shadowRoot).find('.video video')[0];
				if ('srcObject' in video) {
					video.srcObject = stream;
				} else {
					video.src = URL.createObjectURL(stream);
				}
				this.toggleTabs(false);
				$(this.shadowRoot).find('.root > .container').addClass('hidden').filter('.video').removeClass('hidden');
			}).catch(error => {
				this.permissionDialogAbsent(permissionTimeoutId);
				this.toggleError(true);
				console.log(error.name); //NotFoundError, NotAllowedError, PermissionDismissedError
			}).then(() => $(this.shadowRoot).find('#cameraBtn')[0].removeAttribute('disabled'));

		} else {
			alert('WebRTC not supported by your browser');
		}
	}

	flipCamera() {
		$(this.shadowRoot).find('.video video, #flipBtn').toggleClass('flipped');
	}

	stopCamera() {
		let video = $(this.shadowRoot).find('.video video')[0];
		video.pause();
		if (video.srcObject) {
			video.srcObject.getTracks()[0].stop();
		}
		else if (video.src) {
			if(video.captureStream || video.mozCaptureStream) {
				(video.captureStream || video.mozCaptureStream)().getTracks()[0].stop();
				video.src = null;
			}
		}
	}

	startRecording() {
		let enableResultShow = false; //FIXME: omoguciti tek nakon HOLD STILL prikaza
		let countdown = 13;
		$(this.shadowRoot).find('#photoBtn').addClass('hidden');
		$(this.shadowRoot).find('#counter').addClass('show').find('.counter-number').text(countdown);
		this.frameSendingIntervalId = setInterval(() => {
			this.captureFrame().then(scanInput => {

				console.log('scanINput', scanInput, countdown);

				Microblink.SDK.SendImage(scanInput);

				//Microblink.SDK.SendImage(data); //no progressCallback for frames - only for drag & drop files
			});
		}, 1000);
		let counterIntervalId = setInterval(() => {
			if(countdown > 1) {
				$(this.shadowRoot).find("#counter").find('.counter-number').text(--countdown);
			} else {
				$(this.shadowRoot).find("#counter").find('.counter-number').addClass('hidden');
				$(this.shadowRoot).find("#counter").find('.counter-alt').removeClass('hidden');
				clearInterval(counterIntervalId);
				enableResultShow = true;
				setTimeout(() => {
					this.hideCounter();
				}, 2500);
			}
		}, 1000);
		this.recordingTimeoutId = setTimeout(() => {
			clearTimeout(this.frameSendingIntervalId);
			Microblink.SDK.TerminateRequest();
			this.stopCamera();
			this.restartCounter();
			this.restart();
			//TODO: set timed out error this.toggleError(true, 'TIMED OUT');
		}, 15000);
	}

	captureFrame() {
		let video = $(this.shadowRoot).find('video')[0];
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
				[].forEach.call(arr, (_, index) => arr[index] = binStr.charCodeAt(index));
				let blob = new Blob([arr], { type: "image/jpeg" });
				resolve({ blob, pixelData });
			}
		});
	}

	restart() {
		this.toggleTabs(false);
		this.clearTabs();
		$(this.shadowRoot).find('.root > .container').addClass('hidden').filter('.main').removeClass('hidden');
	}

	restartCounter() {
		clearTimeout(this.frameSendingIntervalId);
		clearTimeout(this.recordingTimeoutId);
		$(this.shadowRoot).find('#photoBtn').removeClass('hidden');
		$(this.shadowRoot).find('#counter').removeClass('show');
		$(this.shadowRoot).find('#counter .counter-number').removeClass('hidden');
		$(this.shadowRoot).find('#counter .counter-alt').addClass('hidden');
	}

	hideCounter() {
		$(this.shadowRoot).find('#counter').removeClass('show');
	}

	fillTabs(response) {
		if (response.sourceBlob) {
			let image = new Image();
			image.src = URL.createObjectURL(response.sourceBlob);
			$(this.shadowRoot).find('.main > .image').append(image);
		}
		this.fillResultTable(response.result);
		this.fillJson(response.result);
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
				innerHtml += `<tr><td>${extractFromCamelCase(key)}</td>
								  <td>${ result[key] instanceof Object ? dateFromObject(result[key]) :  escapeHtml(result[key])}</td>
							  </tr>`;
			});
			innerHtml += '</tbody></table>';
		});
		if (innerHtml) {
			$(this.shadowRoot).find('.container.results')[0].innerHTML = innerHtml;
		} else {
			//here paste No results HTML
		}
	}

	fillJson(json) {
		if(!json || JSON.stringify(json) === '{}' || JSON.stringify(json) === '[]') return;
		let jsonHtml = '';
		iterateJson(null, json, 0);
		jsonHtml = jsonHtml.slice(0, -1);
		$(this.shadowRoot).find('.main > .json > div').html(jsonHtml);

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
		$(this.shadowRoot).find('.main > :not(.intro, .json)').html('');
		$(this.shadowRoot).find('.main > .json > div').html('');
	}

	onScanSuccess(response) {
		// response = {};
		// response.result = {
		// 	"code": "OK",
		// 	"summary": "The results have been successfully retrieved!",
		// 	"data": [
		// 		{
		// 			"recognizer": "MRTD",
		// 			"version": "1.1.0",
		// 			"startTime": "2018-09-27T17:02:00.977Z",
		// 			"finishTime": "2018-09-27T17:02:01.084Z",
		// 			"durationTimeInSeconds": 0.107,
		// 			"taskId": 43,
		// 			"workerId": 1,
		// 			"result": {
		// 				"primaryID": "SPECIMEN",
		// 				"secondaryID": "SPECIMEN",
		// 				"documentCode": "IO",
		// 				"documentNumber": "000000000",
		// 				"documentType": "IDENTITY_CARD",
		// 				"issuer": "HRV",
		// 				"sex": "F",
		// 				"nationality": "HRV",
		// 				"dateOfBirth": {
		// 					"day": 1,
		// 					"month": 1,
		// 					"year": 1977,
		// 					"originalString": "770101"
		// 				},
		// 				"dateOfExpiry": {
		// 					"day": 12,
		// 					"month": 12,
		// 					"year": 2002,
		// 					"originalString": "021212"
		// 				},
		// 				"alienNumber": "",
		// 				"applicationReceiptNumber": "",
		// 				"immigrantCaseNumber": "",
		// 				"mrtdVerified": true,
		// 				"opt1": "<<<<<<<<<<<<<<<",
		// 				"opt2": "<<<<<<<<<<<",
		// 				"rawMRZString": "IOHRV0000000000<<<<<<<<<<<<<<<\n7701018F0212126HRV<<<<<<<<<<<0\nSPECIMEN<<SPECIMEN<<<<<<<<<<<<\n",
		// 				"type": "MRTD"
		// 			}
		// 		},
		// 		{
		// 			"recognizer": "MRTD",
		// 			"version": "1.1.0",
		// 			"startTime": "2018-09-27T17:02:00.977Z",
		// 			"finishTime": "2018-09-27T17:02:01.084Z",
		// 			"durationTimeInSeconds": 0.107,
		// 			"taskId": 43,
		// 			"workerId": 1,
		// 			"result": null
		// 		}

		// 	]
		// };

		console.log('response LOG', response);

		if (!response) return;
		if (this.tabs) this.fillTabs(response);
		this.stopCamera();
		this.restartCounter();
		let event;
		if (typeof CustomEvent === 'function') {
			event = new CustomEvent('resultReady', { detail: { result: response.result }, cancelable: true, bubbles: true });
		} else {
			event = document.createEvent('CustomEvent');
			event.initCustomEvent('resultReady', true, true, { result: response.result });
		}
		this.dispatchEvent(event);
		console.log('onSuccessCallback scan dispatchEvent', event);


		// clearTimeout(this.frameSendingIntervalId);
		// 	Microblink.SDK.TerminateRequest();
		// 	this.stopCamera();
		// 	this.restartCounter();
		// 	this.restart();
	}

	onScanError(errorMsg) {
		this.stopCamera();
		this.restartCounter();
		this.toggleError(true);
		let event;
		if (typeof CustomEvent === 'function') {
			event = new CustomEvent('error', { detail: { errorMsg }, cancelable: true, bubbles: true });
		} else {
			event = document.createEvent('CustomEvent');
			event.initCustomEvent('error', true, true, { errorMsg });

		}
		this.dispatchEvent(event);
	}

	onScanProgress(progressEvent) {
		//progressEvent { lengthComputable, loaded, total }
	}

	permissionDialogPresent() {
		$(this.shadowRoot).find('.permission').addClass('show');
	}

	permissionDialogAbsent(timeoutId) {
		if (timeoutId !== null) clearTimeout(timeoutId);
		else {
			$(this.shadowRoot).find('.permission').removeClass('show');
		}
	}

}
customElements.define('mb-api-widget', WebApi);

$('.web-api-component').append(`
<mb-api-widget tabs>
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
</mb-api-widget>`);


$('body').append(`<template class="web-api-style"><style id="webApiTheme">
	mb-api-widget {
	--mb-widget-font-family: AvenirNextPro;
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
</style></template>`);
// $('mb-api-widget')[0].switchTheme();
// setTimeout(() => {
// 	$('mb-api-widget')[0].toggleTabs(true);
// 	$('mb-api-widget')[0].onScanSuccess();
// }, 1000);
