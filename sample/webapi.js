class WebApi extends HTMLElement {

	static get observedAttributes() {
		return ['author'];
	}

	get author() { return this.getAttribute('author'); }
	set author(value) { this.setAttribute('author', value) }

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.onError = this.onError.bind(this);
		this.onResult = this.onResult.bind(this);
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
					--btn-font-color: #000;
					--intro-font-color: #575757;
					--btn-background-color: #ffc107;
					--btn-background-color-hover: #C58F08;
					--btn-flip-image-url : url("data:image/svg+xml,%3Csvg width='44' height='35' viewBox='0 0 44 35' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M22 7V35' stroke='%2348B2E8' stroke-width='1.38744' stroke-miterlimit='3.8637' stroke-dasharray='1.39 2.77'/%3E%3Cpath d='M38.8375 11.5471L27.2239 20.9999L38.8375 30.4527L38.8375 11.5471Z' stroke='%2348B2E8' stroke-width='1.38744'/%3E%3Cpath d='M5.16247 11.5471L16.7761 20.9999L5.16247 30.4527L5.16247 11.5471Z' fill='%2348B2E8' stroke='%2348B2E8' stroke-width='1.38744'/%3E%3Cpath d='M21.4447 1.75C23.851 1.75 26.2572 2.975 28.1082 5.075L26.0721 7H31.625V1.75L29.4038 3.85C27.1827 1.4 24.4063 0 21.4447 0C17.9279 0 14.7812 1.75 12.375 5.075L13.8558 6.125C15.8918 3.325 18.4832 1.75 21.4447 1.75Z' fill='%2348B2E8'/%3E%3C/svg%3E%0A");
					font-size: inherit;
					font-family: AvenirNextPro;
				} 
				.container { height:100%; width:100%; margin:auto;}
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
    				color: var(--btn-font-color);
    				background-color: var(--btn-background-color);
    				transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out;
    				width: 7.5rem;
				}
				button:hover, .button:hover {
					background-color: var(--btn-background-color-hover);
				}
				button#flipBtn {
					background: transparent no-repeat center;
					background-image: var(--btn-flip-image-url);
					background-size: auto;
					position: absolute;
					bottom: 1rem;
					right: 1rem;
					margin: 0;
					padding: 0;
					width: 50px;
					height: 50px;
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
				.tabs .container {
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
					color: var(--intro-font-color);
				}
				.intro .inline p { margin-bottom: 2.5rem; }
				.intro .inline + .inline {
					border-left: 1px solid;
					border-image: linear-gradient(to bottom, transparent 15%, #bdbdbd 1.8rem, #bdbdbd 85%, transparent 85%) 0 100% ;
				}
				.dropzone {
					border: 1px dashed;
					border-color: var(--intro-font-folor);
					padding: 2rem 1.4rem;
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
				.loader, .error-container {
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
				.loader.show {
					display: flex;
					align-items: center;
					justify-content: center;
				}
				.loader-img {
					display: block;
    				position: relative;
    				margin: 0;
				}
				.error-container { 
					background-color: #000; 
					color: white;
					font-weight: 500;
					font-size: 1.4rem;
					text-align: center;
				}
				.error-container.show {
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
				}
				.error-container p { margin: 2.5rem 0; }
				.container.hidden {
					display: none;
				}
				.hidden {
					display: none;
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
				}
				.tab label {
					display: inline-block;
					margin: auto;
					padding: 0 1.25rem;
					box-sizing: border-box;
					border-bottom: 4px solid transparent;
					height: 56px;
				}
				.tab label:hover, .tab label.active {
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
					<div class="tab"><label><slot name="tabs.retake">RETAKE</slot></label></div>
					<div class="tab"><label><slot name="tabs.results">RESULTS</slot></label></div>
					<div class="tab"><label><slot name="tabs.image">IMAGE</slot></label></div>
					<div class="tab"><label><slot name="tabs.json">JSON</slot></label></div>
				</div>
				<div class="container intro font-0">
					<div class="inline font-1">
						<div class="flex-center">
							<div class="dropzone">
								<p class="intro-label"><slot name="labels.dragDrop">Drag and Drop<br/>document here OR</slot></p>
								<button type="button" id="fileBtn"><slot name="buttons.browse">Browse</slot></button>
								<input type="file" accept="application/pdf,image/*" id="file" />
							</div>
						</div>
					</div>
					<div class="inline font-1">
						<div class="flex-center">
							<p class="intro-label"><slot name="labels.cameraActivate">Activate your camera to capture the ID document:</slot></p>
							<button type="button" id="cameraBtn"><slot name="buttons.camera">Use camera</slot></button>	
						</div>
					</div>
				</div>
				<div class="container video hidden">
					<video>Your browser does not support video tag.</video>
					<button type="button" id="photoBtn"><slot name="buttons.takePhoto">TAKE A PHOTO</slot></button>
					<button type="button" id="flipBtn"></button>
					<div id="counter">
						<p class="counter-number"></p>
						<p class="counter-alt hidden"><slot name="labels.holdStill">HOLD STILL</slot></p>
					</div>r
				</div>
				<div class="loader">
					<img class="loader-img" src="/bundles/microblinkmicroblink/images/loading-animation-on-blue.gif" />
				</div>
				<div class="error-container">
					<p><slot name="labels.errorMsg">We're sorry, but something went wrong. Please try again.</slot></p>
					<button type="button" id="againBtn"><slot name="buttons.tryAgain">TRY AGAIN</slot></button>
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
				this.restartCounter();
				this.stopCamera();
				this.toggleError();
			});
			$(this.shadowRoot).find('.dropzone').on('dragover', this.onDragOver.bind(this));
			$(this.shadowRoot).find('.dropzone')[0].addEventListener('drop', this.onDrop.bind(this));
			$(this.shadowRoot).find('#cameraBtn').on('click', this.activateCamera.bind(this));
			$(this.shadowRoot).find('video').on('loadedmetadata', function() { $(this)[0].play(); });
			//$(this.shadowRoot).find('#photoBtn').on('click', () => (this.stopCamera(), this.restart()));
			$(this.shadowRoot).find('#photoBtn').on('click', () => this.startRecording());
			$(this.shadowRoot).find('#flipBtn').on('click', this.flipCamera.bind(this));
			$(this).on('resultReady', event => console.log(event));
		});
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== null) {
			$(this.shadowRoot).find(`.${name}`).text(newValue);
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
		this.toggleDialog(loader, show);

	}

	toggleError(show) {
		let errDialog = $(this.shadowRoot).find('.error-container');
		this.toggleDialog(errDialog, show);
	}

	toggleTabs(show) {
		$(this.shadowRoot).find('.container.root').toggleClass('tabs');
	}

	toggleDialog(dialog, show) {
		if (show === undefined) {
			dialog.toggleClass('show');
		} else if (show) {
			dialog.addClass('show');
		} else {
			dialog.removeClass('show');
		}
	}

	onDragOver(event) {
		event.preventDefault();
	}

	onDrop(event) {
		event.preventDefault();
		let file;
		if (event.dataTransfer.items && event.dataTransfer.items[0]) {
			file = event.dataTransfer.items[0].getAsFile();
		} else {
			file = event.dataTransfer.files && event.dataTransfer.files[0];
		}
		if (file) {
			if (file.type && (file.type.indexOf('image') !== -1 || file.type.indexOf('pdf') !== -1)) {
				this.setFile(file)
			}
		}
	}

	fileChosen(event) {
		let file = event.target.files && event.target.files[0];
		if (file) this.setFile(file);
	}

	setFile(file) {
		this.toggleLoader(true); setTimeout(() => this.toggleLoader(false), 1500);
		//here call webapibackground.js
	}

	activateCamera() {
		$(this.shadowRoot).find('#cameraBtn')[0].setAttribute('disabled', '');
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			let constraints = { video: { width: { ideal: 1280 }, height: { ideal: 720 } } };
			navigator.mediaDevices.getUserMedia(constraints).then(stream => {
				let video = $(this.shadowRoot).find('.video video')[0];
				//video.onloadedmetadata = () => video.play();
				if ('srcObject' in video) {
					video.srcObject = stream;
				} else {
					video.src = URL.createObjectURL(stream);
				}
				$(this.shadowRoot).find('.container .container').addClass('hidden').filter('.video').removeClass('hidden');
			}).catch(alert);
		} else {
			alert('not supported by your browser');
		}
		$(this.shadowRoot).find('#cameraBtn')[0].removeAttribute('disabled');
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
			if(video.captureStream && video.captureStream()) {
				(video.captureStream() || video.mozCaptureStream()).getTracks()[0].stop();
				video.src = null;
			}
		}
	}

	startRecording() {
    console.log('startRecording');
		let enableResultShow = false;
		let countdown = 3;
		$(this.shadowRoot).find('#photoBtn').addClass('hidden');
		$(this.shadowRoot).find('#counter').addClass('show').find('.counter-number').text(countdown);
		this.captureFrame().then(blob => {
      //TODO: slati blob Matiji
			console.log('startRecording.captureFrame');
			var uploadProgress = function (event) {
				console.log('uploadProgress from captureFrame', event);
			}

			Microblink.SDK.Scan('MRTD', blob, uploadProgress).subscribe((result) => {
				console.log('rezultati RADI', result);
			}, (err) => {
				console.log('greska NE RADI', err);
			});
		});
		let imageProcessInterval = setInterval(() => {
			this.captureFrame().then(blob => {
        /*TODO: slati blob Matiji*/
        console.log('imageProcessInterval.captureFrame');


      });
		}, 1000);
		let counterInterval = setInterval(() => {
			if(countdown > 1) {
				$(this.shadowRoot).find("#counter").find('.counter-number').text(--countdown);
			} else {
				$(this.shadowRoot).find("#counter").find('.counter-number').addClass('hidden');
				$(this.shadowRoot).find("#counter").find('.counter-alt').removeClass('hidden');
				clearInterval(counterInterval);
				setTimeout(() => {
					this.hideCounter();
				}, 2500);
			}
		}, 1000);
		let recordingInterval = this.recordingInterval = setTimeout(() => {
			clearTimeout(recordingInterval);
			clearTimeout(imageProcessInterval);
			this.stopCamera();
			this.restartCounter();
			this.restart();
		}, 12000);
	}

	captureFrame() {
		let video = $(this.shadowRoot).find('video')[0];
		let canvas = document.createElement('canvas');
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
		//let pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
		return new Promise(resolve => {
			if (canvas.toBlob) {
				canvas.toBlob(blob => resolve(blob), "image/jpeg");
			} else {
				var binStr = atob(canvas.toDataURL("image/jpeg").split(',')[1]), len = binStr.length, arr = new Uint8Array(len);
				[].forEach.call(arr, (_, index) => arr[index] = binStr.charCodeAt(index));
				resolve(new Blob([arr], { type: "image/jpeg" }));
			}
		});
	}

	restart() {
		$(this.shadowRoot).find('.container .container').addClass('hidden').filter('.intro').removeClass('hidden');
	}

	restartCounter() {
		clearInterval(this.recordingInterval);
		$(this.shadowRoot).find('#photoBtn').removeClass('hidden');
		$(this.shadowRoot).find('#counter').removeClass('show');
		$(this.shadowRoot).find('#counter .counter-number').removeClass('hidden');
		$(this.shadowRoot).find('#counter .counter-alt').addClass('hidden');
	}

	hideCounter() {
		$(this.shadowRoot).find('#counter').removeClass('show');
	}


	/** Ove dvije metode poziva Matijina skripta */
	onResult(json) {
		this.stopCamera();
		this.restartCounter();
		this.restart();
		let event;
		if (typeof CustomEvent === 'function') {
			event = new CustomEvent('resultReady', { detail: { result: json }, cancelable: true, bubbles: true });
		} else {
			event = document.createEvent('CustomEvent');
			event.initCustomEvent('resultReady', true, true, { result: json });

		}
		this.dispatchEvent(event);
	}

	onError(errorMsg) {
		this.stopCamera();
		this.toggleError(true);
		this.restartCounter();
		let event;
		if (typeof CustomEvent === 'function') {
			event = new CustomEvent('error', { detail: { errorMsg }, cancelable: true, bubbles: true });
		} else {
			event = document.createEvent('CustomEvent');
			event.initCustomEvent('error', true, true, { errorMsg });

		}
		this.dispatchEvent(event);
	}

}
customElements.define('mb-api-widget', WebApi);