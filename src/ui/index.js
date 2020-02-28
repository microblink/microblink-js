import { SDK } from '../microblink.SDK';

import templateHtml from './html/component.html';
import ResizeSensor from './ResizeSensor.js';
import ElementQueriesFactory from './ElementQueries.js';
import { FrameHelper } from '../frameHelper'
import screenfull from 'screenfull';
import copy from 'copy-to-clipboard';
import {
  escapeHtml, labelFromCamelCase, dateFromObject, isMobile, isFirefox, isSafari, hasClass, addClass,
  removeClass, toggleClass, isRemotePhoneCameraAvailable, getImageTypeFromBase64, adjustScreenFull
} from './utils.js';
import { cameraManager } from './../cameraManagement';

const Microblink = {
	SDK: SDK
};

// Expose it to global window object
if (window) {
	window['Microblink'] = Microblink;
}

//insert web components light polyfill for cross-browser compatibility
let script = document.createElement('script');
script.src = '//unpkg.com/@webcomponents/webcomponentsjs/webcomponents-loader.js';
script.addEventListener('load', () => {
  window.WebComponents.waitFor(() => { //to make sure all polyfills are loaded
    if (!window.customElements) {
      let fullPolyFillScript = ddocument.createElement('script');
      fullPolyFillScript.src = '//unpkg.com/@webcomponents/webcomponentsjs/bundles/webcomponents-sd-ce-pf.js';
      fullPolyFillScript.addEventListener('load', () => {
        window.WebComponents.waitFor(defineComponent); //fallback in case of unloaded pollyfills (fixes strange bug)
      });
      document.head.insertBefore(fullPolyFillScript, document.head.querySelector('script[src*="microblink."]'));
    } else {
      defineComponent();
    }
  });
});
document.head.insertBefore(script, document.head.querySelector('script[src*="microblink."]'));

if (screenfull && screenfull.isEnabled) adjustScreenFull(screenfull);

function defineComponent() {

  let template = document.createElement('template');
  template.innerHTML = templateHtml;

  // Use polyfill only in browsers that lack native Shadow DOM
  window.ShadyCSS && ShadyCSS.prepareTemplate(template, 'microblink-ui-web');

  class WebApi extends HTMLElement {

    static get observedAttributes() {
      return ['tabs', 'autoscroll', 'webcam', 'fullscreen', 'upload'];
    }

    get tabs() { return this.hasAttribute('tabs'); }
    set tabs(value) { value === true ? this.setAttribute('tabs', '') : this.removeAttribute('tabs'); }

    get autoscroll() { return this.hasAttribute('autoscroll'); }
    set autoscroll(value) { value === true ? this.setAttribute('autoscroll', '') : this.removeAttribute('autoscroll'); }

    get webcam() { return this.getAttribute('webcam') !== 'off'; }
    set webcam(value) { value === false ? this.setAttribute('webcam', 'off') : this.removeAttribute('webcam'); }

    get upload() { return this.getAttribute('upload') !== 'off'; }
    set upload(value) { value === false ? this.setAttribute('upload', 'off') : this.removeAttribute('upload'); }

    get fullscreen() { return this.getAttribute('fullscreen') !== 'off'; }
    set fullscreen(value) { value === false ? this.setAttribute('fullscreen', 'false') : this.removeAttribute('fullscreen'); }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.onScanError = this.onScanError.bind(this);
      this.onScanSuccess = this.onScanSuccess.bind(this);
      this.onScanProgress = this.onScanProgress.bind(this);
      this.startRecording = this.startRecording.bind(this);
      this.autoScrollListener = this.autoScrollListener.bind(this);
      this.getLocalization = this.getLocalization.bind(this);
      // Current active crypto key for scan protection
      this.currentScanSecretKey = null;
      // Subscription to the exchange object changes
      this.unsubscribeFromScanExchangerChanges = null;
      // For copy to clipboard functionality
      this.executionResult = null;

      Microblink.SDK.RegisterListener(this);
    }

    connectedCallback() {
      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
      if (this.shadowRoot.innerHTML) this.shadowRoot.innerHTML = '';
      this.shadowRoot.appendChild(template.content.cloneNode(true));
      this.getLocalization();
      this.shadowRoot.getElementById('fileBtn').addEventListener('click', () => this.shadowRoot.getElementById('file').click());
      this.shadowRoot.getElementById('file').addEventListener('click', function() { this.value = ''; });
      this.shadowRoot.getElementById('file').addEventListener('touchstart', function() { this.value = ''; });
      this.shadowRoot.getElementById('file').addEventListener('change', this.fileChosen.bind(this));
      this.shadowRoot.getElementById('cancelBtnLocalCamera').addEventListener('click', () => {
        this.clearTimers();
        this.stopCamera();
      });
      this.shadowRoot.getElementById('cancelBtnRemoteCamera').addEventListener('click', () => {
        this.stopCamera();
      });
      this.shadowRoot.querySelector('.dropzone').addEventListener('dragover', event => event.preventDefault());
      this.shadowRoot.querySelector('.dropzone').addEventListener('drop', this.onDrop.bind(this));
      this.shadowRoot.querySelector('.dropzone').addEventListener('dragenter', this.onDragEnter.bind(this));
      this.shadowRoot.querySelector('.dropzone').addEventListener('dragleave', this.onDragLeave.bind(this));
      this.shadowRoot.getElementById('cameraLocalBtn').addEventListener('click', () => {
        if (isFirefox()) {
          this.openFullscreen().finally(() => this.activateLocalCamera());
        } else if (isSafari()) {
          if (this.cameraPermitted) this.openFullscreen();
          this.activateLocalCamera();
        } else {
          this.openFullscreen();
          this.activateLocalCamera();
        }
      });
      this.shadowRoot.getElementById('cameraRemoteBtn').addEventListener('click', this.activateRemoteCamera.bind(this));
      this.shadowRoot.querySelector('video').addEventListener('loadedmetadata', function() { this.play(); this.controls = false; });
      this.shadowRoot.querySelector('video').addEventListener('play', () => {
        removeClass(this.shadowRoot.getElementById('photoBtn'), 'hidden');
        removeClass(this.shadowRoot.getElementById('cardPlacer'), 'hidden');
      });
      this.shadowRoot.getElementById('photoBtn').addEventListener('click', () => this.startRecording());
      this.shadowRoot.getElementById('flipBtn').addEventListener('click', this.flipCamera.bind(this));

      Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.tab'), elem => {
        elem.addEventListener('click', () => {
          let tabId = elem.id;
          if (tabId === 'introTab') {
            this.toggleTabs(false);
          }
          Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.tab'), elem => toggleClass(elem, 'active', tabId === elem.id));
          Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.main > .container'), elem => {
            toggleClass(elem, 'active', hasClass(elem, tabId.substring(0, tabId.length - 3)));
          });
        });
      });
      this.shadowRoot.getElementById('copyBtn').addEventListener('click', () => {
        copy(JSON.stringify(this.executionResult, null, 2));
      });

      this.checkRecognizers();
      this.checkWebRTCSupport();
      this.checkRemoteCameraSupport();
      this.checkForSafariCamera();
      this.adjustComponent(true);
      this.ElementQueries = ElementQueriesFactory(ResizeSensor, this.shadowRoot);
      this.ElementQueries.listen();
      window.addEventListener('resize', this.adjustComponent.bind(this, false));

      this.shadowRoot.getElementById('webcamConfirmBtn').addEventListener('click', () => {
        Microblink.SDK.SendImage(this.webcamImage, this.onScanProgress);
        this.enableResultShow = true;
        this.toggleLoader(true);
        this.restart();
        this.stopCamera();
        this.clearConfirmImage();
      });
      this.shadowRoot.getElementById('webcamRetakeBtn').addEventListener('click', () => {
        this.clearConfirmImage();
      });
      this.shadowRoot.getElementById('cancelBtnConfirmImage').addEventListener('click', () => {
        this.stopCamera();
        this.clearConfirmImage();
      });

      document.addEventListener('keydown', (evt) => {
        evt = evt || window.event;
        if (evt.key === 'Escape') {
          this.clearTimers();
          this.stopCamera();
        }
      });
      document.addEventListener('recognizersUpdated', () => {
        if (this.checkRecognizers()) {
          removeClass(this.shadowRoot.querySelector('.error-container'), 'show');
        }
      });
      this.shadowRoot.querySelector('slot[name="loader-image"]').addEventListener('slotchange', event => {
        let loaderElements = event.target.assignedElements();
        if (loaderElements.length === 0) return;
        let loaderSlots = Array.prototype.map.call(this.shadowRoot.querySelectorAll('slot[name="loader-image"]'), el => el);
        loaderSlots.shift();
        loaderSlots.forEach(slot => {
          slot.innerHTML = '';
          loaderElements.forEach(element => slot.appendChild(element.cloneNode(true)));
        });
      });
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if(name === 'autoscroll') {
        window[(newValue !== null ? 'add' : 'remove') + 'EventListener']('scroll', this.autoScrollListener)
      }
    }

    adjustComponent(initial) {
      if (isMobile()) {
        let isFullScreen = screenfull && screenfull.isFullscreen;
        if (!isFullScreen) {
          if (parseInt(getComputedStyle(this.parentNode).height) < window.innerHeight) {
            this.style.height = getComputedStyle(this.parentNode).height;
          } else this.style.height = `${window.innerHeight}px`;
        } else {
          screenfull.onChangeHandler({ target: this }); //dispatch event
        }
        if (initial) {
          this.shadowRoot.getElementById('flipBtn').style.setProperty('display', 'none', 'important');
          let remoteCamera = this.shadowRoot.getElementById('cameraRemoteBtn');
          if (remoteCamera) {
            let localCameraBtnIcon = this.shadowRoot.querySelector('#cameraLocalBtn .circle');
            if (localCameraBtnIcon) {
              localCameraBtnIcon.innerHTML = this.shadowRoot.querySelector('#cameraRemoteBtn .circle').innerHTML;
            } else this.removeChooseLabel();
            remoteCamera.parentNode.removeChild(remoteCamera);
          }
          Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.cameraLocalLabel, .browseLabel'), elem => toggleClass(elem, 'hidden'));
          Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('#flipBtn, .video video'), elem => toggleClass(elem, 'flipped'));
        }
      }
      this.adjustCardPlacer(isMobile());
    }

    adjustCardPlacer(isMobile) {
      let { offsetWidth: width, offsetHeight: height } = this.shadowRoot.querySelector('.root');
      let placerToContainerRatio = isMobile && window.innerHeight > window.innerWidth? 0.85 : 0.6;
      const ASPECT_RATIO = 1.585772508336421;

      let placerWidth = (width / height) > ASPECT_RATIO ? width : height * ASPECT_RATIO;
      let placerHeight = placerWidth / ASPECT_RATIO;
      let borderRightLeft = ((1 - placerToContainerRatio) * width + (placerWidth - width)) / 2;
      let borderTopBottom = borderRightLeft / ASPECT_RATIO;

      let cardPlacer = this.shadowRoot.getElementById('cardPlacer');
      cardPlacer.style.width = `${placerWidth}px`;
      cardPlacer.style.height = `${placerHeight}px`;
      cardPlacer.style.borderWidth = `${borderTopBottom}px ${borderRightLeft}px`;
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
            // event.preventDefault(); // sometimes causing problems on mobile browser
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

    getSlotText(name) {
      if (this.querySelector('span[slot="' + name + '"]')) {
        return this.querySelector('span[slot="' + name + '"]').textContent;
      }
      return this.shadowRoot.querySelector(`slot[name="${name}"]`).textContent;
    }

    checkRecognizers() {
      if (!Microblink.SDK.IsRecognizerArraySet()) {
        this.toggleError(true, this.getSlotText('labels.selectDocumentType'), this.getSlotText('labels.noDocumentType'), true);
        return false;
      }
      return true;
    }

    checkWebRTCSupport() {
      if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
        let cameraLocalBtn = this.shadowRoot.getElementById('cameraLocalBtn');
        cameraLocalBtn.parentNode.removeChild(cameraLocalBtn);
      }
    }

    checkRemoteCameraSupport() {
      Microblink.SDK.IsDesktopToMobileAvailable().then(isAvailable => {
        if (!isAvailable || !isRemotePhoneCameraAvailable()) {
          let cameraRemoteBtn = this.shadowRoot.getElementById('cameraRemoteBtn');
          if (cameraRemoteBtn) cameraRemoteBtn.style.setProperty('display', 'none', 'important');
          if (!this.shadowRoot.getElementById('cameraLocalBtn')) this.removeChooseLabel();
        }
      });
    }

    removeChooseLabel() {
      let inputMethodLabels = Array.prototype.map.call(this.shadowRoot.querySelectorAll('.container.intro .intro-label'), el => el);
      inputMethodLabels.forEach(el => el.parentNode.removeChild(el));
    }

    getLocalization() {
      let template = this.getElementsByClassName('localization')[0];
      if (template) {
        return new Promise(resolve => {
          let isJson = /\sjson\s/.test(` ${template.className} `);
          if (isJson) {
            try {
              this.handleJson(JSON.parse(template.content.textContent.trim().replace(/\\n/g, '<br/>')));
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
                  this.handleJson(JSON.parse(xhr.responseText.trim().replace(/\\n/g, '<br/>')));
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
          else templateHtml += `<span class="translate-label" slot="${name ? (name + '.' + key) : key}">${jsonTree[key]}</span>`;
        });
      }
    }

    setLocalization(localization) {
      if (!localization || (!['string', 'object'].includes(typeof localization))) return false;
      if (typeof localization === 'string') {
        try {
          localization = JSON.parse(localization);
        } catch(e) {
          return false;
        }
      }
      Array.prototype.forEach.call(this.querySelectorAll('.translate-label'), label => label.parentNode.removeChild(label));
      this.handleJson(localization);
      return true;
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

    toggleLoader(show) {
      let loader = this.shadowRoot.querySelector('.pending-container');
      if(show) {
        this.shadowRoot.querySelector('.progress-bar-value').textContent = '0%';
        Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.pending-container h2'), elem => toggleClass(elem, 'hidden', !elem.matches(':first-of-type')));
        this.toggleTabs(false);
      }
      toggleClass(loader, 'show', show);
    }

    toggleError(show, message, title, hideTryAgainButton) {
      let errDialog = this.shadowRoot.querySelector('.error-container');
      errDialog.innerHTML = '';
      if (title) {
        let titleElement = document.createElement('div');
        titleElement.textContent = title;
        addClass(titleElement, 'title');
        errDialog.appendChild(titleElement);
      }
      let messageElement = document.createElement('div');
      addClass(messageElement, 'message');
      messageElement.textContent = message || this.getSlotText('labels.errorMsg');
      errDialog.appendChild(messageElement);

      if (!hideTryAgainButton) {
        let againButton = document.createElement('button');
        againButton.textContent = this.getSlotText('buttons.tryAgain');
        againButton.addEventListener('click', () => {
          this.restart();
          this.stopCamera();
          this.toggleError();
        });
        errDialog.appendChild(againButton);
      }
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
        let supportedImageTypes = this.shadowRoot.getElementById('file').getAttribute('accept').split(',');
        if (file.type && supportedImageTypes.find(type => type === file.type)) {
          this.setFile(file);
        } else {
          let message = this.getSlotText('labels.unsupportedFileType');
          this.toggleError(true, message);
          this.dispatchEvent('error', new Error(message));
        }
      }
    }

    onDragEnter() {
      addClass(this.shadowRoot.querySelector('.dropzone'), 'draghover');
    }

    onDragLeave() {
      removeClass(this.shadowRoot.querySelector('.dropzone'), 'draghover');
    }

    fileChosen(event) {
      let file = event.target.files && event.target.files[0];
      if (file) this.setFile(file);
    }

    setFile(file) {
      if (file.size > 15 * 1024 * 1024) {
        let message = this.getSlotText('labels.fileSizeLimitExceeded');
        this.toggleError(true, message);
        this.dispatchEvent('error', new Error(message));
        return;
      }
      this.toggleLoader(true);
      this.restart();
      Microblink.SDK.SendImage({ blob: file }, this.onScanProgress);
      this.enableResultShow = true;
    }

    async activateRemoteCamera() {

      if (this.unsubscribeFromScanExchangerChanges) {
        // On every new Remote Camera activation, unsubscribe from the previous listener if it is subscribed
        this.unsubscribeFromScanExchangerChanges();
      }

      const _shadowRoot = this.shadowRoot;
      const _enableResultShow = () => this.enableResultShow = true;

      _shadowRoot.getElementById('generating-exchange-link').style.setProperty('display', 'block');
      _shadowRoot.getElementById('exchange-link-title').style.setProperty('display', 'none', 'important');
      _shadowRoot.getElementById('exchange-link-notes').style.setProperty('display', 'none', 'important');
      _shadowRoot.getElementById('exchange-link-remote-camera-is-pending').style.setProperty('display', 'none', 'important');
      _shadowRoot.getElementById('exchange-link-remote-camera-is-open').style.setProperty('display', 'none', 'important');
      _shadowRoot.getElementById('exchange-link-image-is-uploading').style.setProperty('display', 'none', 'important');
      _shadowRoot.getElementById('exchange-link-image-is-processing').style.setProperty('display', 'none', 'important');
      _shadowRoot.querySelector('.remote-camera .loader-img').style.setProperty('display', 'block');
      _shadowRoot.getElementById('exchange-link').innerHTML = '';
      _shadowRoot.getElementById('exchange-link-as-QR').innerHTML = '';

      // Create Scan exchanger data object
      try {

        this.unsubscribeFromScanExchangerChanges = await Microblink.SDK.CreateScanExchanger({}, (scanDocData) => {
          this.toggleTabs(false);
          this.clearTabs();
          Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.root > .container, .permission, .confirm-image'),
              elem => toggleClass(toggleClass(elem, 'hidden', !hasClass(elem, 'remote-camera')), 'show', hasClass(elem, 'remote-camera')));

          // Listen for the changes on Scan exchanger object
          // console.log('scanDocData', scanDocData);

          // 1. Step01_RemoteCameraIsRequested
          // secret key is generated and store as plain string inside of the library

          // 2. get short link after create
          if (
            scanDocData.status === Microblink.SDK.ScanExchangerCodes.Step02_ExchangeLinkIsGenerated
            && scanDocData.shortLink
          ) {
            const exchangeLink = scanDocData.shortLink;
            _shadowRoot.getElementById('exchange-link').innerHTML = `<a href="${exchangeLink}" target="_blank" >${exchangeLink}</a>`;
            _shadowRoot.querySelector('.remote-camera .loader-img').style.setProperty('display', 'none', 'important');
            _shadowRoot.getElementById('exchange-link-title').style.setProperty('display', 'block');
            _shadowRoot.getElementById('exchange-link-notes').style.setProperty('display', 'block');
            _shadowRoot.getElementById('generating-exchange-link').style.setProperty('display', 'none', 'important');
            if (scanDocData.qrCodeAsBase64) {
              _shadowRoot.getElementById('exchange-link-as-QR').innerHTML = '<img src="' + scanDocData.qrCodeAsBase64 + '" />';
            }
          } else {
            _shadowRoot.getElementById('exchange-link-as-QR').innerHTML = '';
          }

          // 3. Remote camera page is prepared - waiting for user to open camera
          if (scanDocData.status === Microblink.SDK.ScanExchangerCodes.Step03_RemoteCameraIsPending) {
            _shadowRoot.getElementById('exchange-link').innerHTML = '';
            _shadowRoot.getElementById('exchange-link-title').style.setProperty('display', 'none', 'important');
            _shadowRoot.getElementById('exchange-link-notes').style.setProperty('display', 'none', 'important');
            _shadowRoot.getElementById('exchange-link-remote-camera-is-pending').style.setProperty('display', 'block');
          } else {
            _shadowRoot.getElementById('exchange-link-remote-camera-is-pending').style.setProperty('display', 'none', 'important');
          }

          // 4. Remote camera is open by user - waiting for shot
          if (scanDocData.status === Microblink.SDK.ScanExchangerCodes.Step04_RemoteCameraIsOpen) {
            _shadowRoot.getElementById('exchange-link-remote-camera-is-open').style.setProperty('display', 'block');
          } else {
            _shadowRoot.getElementById('exchange-link-remote-camera-is-open').style.setProperty('display', 'none', 'important');
          }

          // 5. Remote camera - shot is done and device is uploading image and server is processing image
          if (scanDocData.status === Microblink.SDK.ScanExchangerCodes.Step05_ImageIsUploading) {
            _shadowRoot.getElementById('exchange-link-image-is-uploading').style.setProperty('display', 'block');
            _shadowRoot.querySelector('.remote-camera .loader-img').style.setProperty('display', 'block');
          } else {
            _shadowRoot.getElementById('exchange-link-image-is-uploading').style.setProperty('display', 'none', 'important');
          }

          // 6. Remote camera - upload is done and waiting for the server to process image
          if (scanDocData.status === Microblink.SDK.ScanExchangerCodes.Step06_ImageIsProcessing) {
            _shadowRoot.getElementById('exchange-link-image-is-processing').style.setProperty('display', 'block');
            _shadowRoot.querySelector('.remote-camera .loader-img').style.setProperty('display', 'block');
          } else {
            _shadowRoot.getElementById('exchange-link-image-is-processing').style.setProperty('display', 'none', 'important');
          }

          // 7. Get result from exchabge object, result taken from Microblink API set by remote camera
          if (
            scanDocData.status === Microblink.SDK.ScanExchangerCodes.Step07_ResultIsAvailable &&
            scanDocData.result
          ) {
            _shadowRoot.querySelector('.remote-camera .loader-img').style.setProperty('display', 'none', 'important');
            _enableResultShow();
          }
        });
      } catch (e) {
        console.error('Microblink.SDK.CreateScanExchanger.error', e);
      }
    }

    openFullscreen() {
      let root = this.shadowRoot.querySelector('.root'); //for now remove fullscreen option for firefox mobile
      return this.fullscreen && screenfull && screenfull.isEnabled && !(isMobile() && isFirefox()) ? screenfull.request(root) : Promise.resolve(false);
    }

    closeFullscreen() {
      return this.fullscreen && screenfull && screenfull.isEnabled && !(isMobile() && isFirefox()) ? screenfull.exit() : Promise.resolve(false);
    }

    // Old way without camera manager
    /*
    activateLocalCamera() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.shadowRoot.getElementById('cameraLocalBtn').setAttribute('disabled', '');
        let constraints = { video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: { ideal: 'environment' } } };
        this.permissionTimeoutId = setTimeout(() => { this.permissionTimeoutId = null; this.onCameraPermissionDialog(); }, 1500); //this is "event" in case of browser's camera allow/block dialog
        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
          this.onCameraPermissionResolve(true);
          let video = this.shadowRoot.getElementById('video');
          video.controls = true;
          if ('srcObject' in video) {
            video.srcObject = stream;
          } else {
            video.src = URL.createObjectURL(stream);
          }

          console.log(video);
          
          video.load();
          setTimeout(() => {
            video.play().catch(() => {
              addClass(this.shadowRoot.getElementById('photoBtn'), 'hidden');
              addClass(this.shadowRoot.getElementById('cardPlacer'), 'hidden');
            });
          }, 0);
          this.toggleTabs(false);
          this.clearTabs();
          Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.root > .container, .permission, .confirm-image'),
            elem => toggleClass(toggleClass(elem, 'hidden', !hasClass(elem, 'video')), 'show', hasClass(elem, 'video')));
        }).catch(error => {
          this.closeFullscreen();
          this.onCameraPermissionResolve(false);

          let errorMessage;
          switch(error.name) {
            case 'NotFoundError':
              errorMessage = this.getSlotText('labels.notFoundErrorMsg');
              break;
            case 'NotAllowedError':
              errorMessage = this.getSlotText('labels.notAllowedErrorMsg');
          }

          this.toggleError(true, errorMessage);
          this.dispatchEvent('error', new Error('Camera error: ' + error.name));
          console.log(error.name + ': ' + error.message); //NotFoundError, NotAllowedError
        }).then(() => this.shadowRoot.getElementById('cameraLocalBtn').removeAttribute('disabled'));
      } else {
        this.toggleError(true, this.getSlotText('labels.webRtcUnsupported')); //should we fallback to flash?
      }
    }
    */

    // New way with camera manager
    async activateLocalCamera() {
      let video = this.shadowRoot.getElementById('video');
      await cameraManager(video)
        .then(cameraFeed => {
          this.shadowRoot.getElementById('cameraLocalBtn').setAttribute('disabled', '');

          cameraFeed.controls = true;
          video.load();

          setTimeout(() => {
            video.play().catch(() => {
              addClass(this.shadowRoot.getElementById('photoBtn'), 'hidden');
              addClass(this.shadowRoot.getElementById('cardPlacer'), 'hidden');
            });
          }, 0);

          this.toggleTabs(false);
          this.clearTabs();

          Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.root > .container, .permission, .confirm-image'),
            elem => toggleClass(toggleClass(elem, 'hidden', !hasClass(elem, 'video')), 'show', hasClass(elem, 'video')));
        })
        .catch(error => {
          this.closeFullscreen();
          this.onCameraPermissionResolve(false);

          let errorMessage;
          switch(error.reason) {
            case 'CameraNotFound':
              errorMessage = this.getSlotText('labels.notFoundErrorMsg');
              break;
            case 'CameraNotAllowed':
              errorMessage = this.getSlotText('labels.notAllowedErrorMsg');
              break;
            case 'CameraNotAvailable':
              errorMessage = this.getSlotText('labels.cameraNotAvailableErrorMsg');
              break;
            case 'CameraInUse':
              errorMessage = this.getSlotText('labels.cameraInUseErrorMsg');
              break;
            case 'MediaDevicesNotSupported':
              errorMessage = this.getSlotText('labels.webRtcUnsupported');
              break;
          }

          this.toggleError(true, errorMessage);
          this.dispatchEvent('error', new Error('Camera error: ' + error.reason));
          console.log(error.name + ': ' + error.message);
        })
        .finally(() => this.shadowRoot.getElementById('cameraLocalBtn').removeAttribute('disabled'));
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
        if (video.captureStream || video.mozCaptureStream) {
          (video.captureStream || video.mozCaptureStream)().getTracks()[0].stop();
          URL.revokeObjectURL(video.src);
          video.src = null;
        }
      }
      Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.root > .container, .permission, .confirm-image'),
          elem => toggleClass(toggleClass(elem, 'hidden', !hasClass(elem, 'main')), 'show', hasClass(elem, 'main')));
      this.closeFullscreen();
      this.checkForSafariCamera();
    }

    checkForSafariCamera() {
      if (isSafari() && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices().then(devices => {
          this.cameraPermitted = !!(devices || []).filter(({ kind: k, label: l }) => k === "videoinput" && !!l).length
        });
      }
    }

    startRecording() {
      this.enableResultShow = false;
      this.frame = null;
      this.canvas = null;
      let countdown = 3;
      addClass(this.shadowRoot.getElementById('photoBtn'), 'hidden');
      addClass(this.shadowRoot.getElementById('counter'), 'show');
      let numberNode = this.shadowRoot.getElementById('counter-number');
      numberNode.textContent = String(countdown);
      this.counterIntervalId = setInterval(() => {
        numberNode.textContent = String(--countdown);
        if (countdown === 1) {
          this.frameSendingIntervalId = setInterval(async() => {
            if (countdown === 0) {
              removeClass(this.shadowRoot.getElementById('counter'), 'show');
              clearInterval(this.frameSendingIntervalId);
              this.frame = await this.getNextBestFrame();
              this.showConfirmDialog(this.frame);
            } else {
              this.frame = await this.getNextBestFrame();
            }
          }, 200);
        }
        if (countdown === 0) {
          clearInterval(this.counterIntervalId);
        }
      }, 1000);
    }

    getNextBestFrame() {
      return new Promise(resolve => {
        this.captureFrame().then(({ blob, pixelData }) => {
          let quality = FrameHelper.getFrameQuality(pixelData);
          resolve(!this.frame || quality > this.frame.quality ? { blob, quality } : this.frame);
        });
      });
    }

    captureFrame() {
      let video = this.shadowRoot.getElementById('video');
      let canvas = this.canvas = this.canvas || document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      let pixelData = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
      return new Promise(resolve => {
        if (canvas.toBlob) {
          canvas.toBlob(blob => resolve({ blob, pixelData }), "image/jpeg", 0.95);
        } else {
          let binStr = atob(canvas.toDataURL("image/jpeg", 0.95).split(',')[1]), len = binStr.length, arr = new Uint8Array(len);
          Array.prototype.forEach.call(arr, (_, index) => arr[index] = binStr.charCodeAt(index));
          let blob = new Blob([arr], { type: "image/jpeg" });
          resolve({ blob, pixelData });
        }
      });
    }

    showConfirmDialog({ blob }) {
      this.webcamImage = { blob };
      let image = new Image();
      image.src = URL.createObjectURL(blob);
      let imageContainerNode = this.shadowRoot.querySelector('.confirm-image .image-container');
      imageContainerNode.innerHTML = '';
      imageContainerNode.appendChild(image);
      addClass(this.shadowRoot.querySelector('.confirm-image'), 'show');
      this.restartCounter();
    }

    clearConfirmImage() {
      removeClass(this.shadowRoot.querySelector('.confirm-image'), 'show');
      let imageContainerNode = this.shadowRoot.querySelector('.confirm-image .image-container');
      let image = imageContainerNode.querySelector('img');
      if (image) URL.revokeObjectURL(image.src);
      imageContainerNode.innerHTML = '';
    }

    restart() {
      this.toggleTabs(false);
      this.clearTabs();
      Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.root > .container, .permission, .confirm-image'),
          elem => toggleClass(toggleClass(elem, 'hidden', !hasClass(elem, 'main')), 'show', hasClass(elem, 'main')));
    }

    restartCounter() {
      removeClass(this.shadowRoot.getElementById('photoBtn'), 'hidden');
      removeClass(this.shadowRoot.getElementById('counter'), 'show');
    }

    fillTabs(response) {
      this.fillResultTable(response.result);
      this.fillJson(response.result);
      this.toggleTabs(true);
    }

    fillResultTable(json) {
      if (!json || !json.data) return;
      removeClass(this.shadowRoot.querySelector('.error-container'), 'show');
      let data = json.data instanceof Array ? json.data : [json.data];
      let innerHtml = '';
      let resultsMasked = json.summary.search(/Authorization header is missing/gi) !== -1;
      data.forEach(({ recognizer, result }) => {
        if (!result) return;

        let faceImageElement = '';
        if (result.faceImageBase64 !== undefined) {
          if (resultsMasked) {
            faceImageElement = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAQAAADa613fAAAAa0lEQVR42u3PMREAAAgEIL9/WwtoBHcPGpCeeiEiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIpcFKjbCiZfrjTwAAAAASUVORK5CYII="/>';
          } else {
            faceImageElement = `<img src="data:image/${getImageTypeFromBase64(result.faceImageBase64)};base64,${result.faceImageBase64}"/>`;
          }
        }

        let fullName;
        if (result.lastName !== undefined && result.firstName !== undefined) {
          fullName = result.lastName + ' ' + result.firstName;
        } else if (result.primaryID !== undefined && result.secondaryID !== undefined) {
          fullName = result.primaryID + ' ' + result.secondaryID;
        } else {
          fullName = '';
        }

        innerHtml += `<div class="resultTable">
              <div class="row heading">
                <div class="faceImage">${faceImageElement}</div>
                <div class="headingText">
                  <div class="fullName">${fullName}</div>
                  <div class="recognizerType">${recognizer}</div>
                </div>
              </div>`;

        Object.keys(result).forEach(key => {
          if (!key.includes('Base64')) {
            innerHtml += `<div class="row"><div class="label">${labelFromCamelCase(key)}</div>
                    <div class="content">${result[key] instanceof Object ? dateFromObject(result[key]) : escapeHtml(result[key])}</div>
                  </div>`;
          }
        });

        if (result.signatureImageBase64 !== undefined) {
          if (resultsMasked) {
            innerHtml += `<div class="row"><div class="label">Signature</div><div class="content signature"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAAA8CAQAAADydv/WAAAAbElEQVR42u3RAQEAAAQDMO/fVgF6sFVYeorDIlgwghGMYAQjGMGCEYxgBCMYwQgWjGAEIxjBCEYwggUjGMEIRjCCESwYwQhGMIIRjGDBCEYwghGMYAQjWDCCEYxgBCMYwYIRjGAEIxjBCP5uAQrmdLkka2HAAAAAAElFTkSuQmCC"></div></div>`;
          } else {
            innerHtml += `<div class="row"><div class="label">Signature</div>
                <div class="content signature"><img src="data:image/${getImageTypeFromBase64(result.signatureImageBase64)};base64,${result.signatureImageBase64}"/></div>
              </div>`;
          }
        }
        if (result.fullDocumentImageBase64 !== undefined) {
          if (resultsMasked) {
            innerHtml += `<div class="row"><div class="label"></div><div class="content fullDocument"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAjAAAAFUCAQAAACQdc41AAADO0lEQVR42u3UMQEAAAjDMObfLQZABReJhB5NTwGciMEABgMYDIDBAAYDGAyAwQAGAxgMgMEABgMYDIDBAAYDGAyAwQAGAxgMgMEABgMYDIDBAAYDGAyAwQAGAxgMgMEABgNgMIDBAAYDYDCAwQAGA2AwgMEABgNgMIDBAAYDYDCAwQAGA2AwgMEABgNgMIDBAAYDYDCAwQAGA2AwgMEABgNgMIDBABgMYDCAwQAYDGAwgMEAGAxgMIDBABgMYDCAwQAYDGAwgMEAGAxgMIDBABgMYDCAwQAYDGAwgMEAGAxgMIDBABgMYDAABgMYDGAwAAYDGAxgMAAGAxgMYDAABgMYDGAwAAYDGAxgMAAGAxgMYDAABgMYDGAwAAYDGAxgMAAGAxgMYDAABgMYDIDBAAYDGAyAwQAGAxgMgMEABgMYDIDBAAYDGAyAwQAGAxgMgMEABgMYDIDBAAYDGAyAwQAGAxgMgMEABgMYDIDBAAYDYDCAwQAGA2AwgMEABgNgMIDBAAYDYDCAwQAGA2AwgMEABgNgMIDBAAYDYDCAwQAGA2AwgMEABgNgMIDBAAYDYDCAwQAYDGAwgMEAGAxgMIDBABgMYDCAwQAYDGAwgMEAGAxgMIDBABgMYDCAwQAYDGAwgMEAGAxgMIDBABgMYDCAwYgAGAxgMAAGAxgMYDAABgMYDGAwAAYDGAxgMAAGAxgMYDAABgMYDGAwAAYDGAxgMAAGAxgMYDAABgMYDGAwAAYDGAxgMAYDGAxgMAAGAxgMYDAABgMYDGAwAAYDGAxgMAAGAxgMYDAABgMYDGAwAAYDGAxgMAAGAxgMYDAABgMYDGAwAAYDGAxgMAYDGAxgMAAGAxgMYDAABgMYDGAwAAYDGAxgMAAGAxgMYDAABgMYDGAwAAYDGAxgMAAGAxgMYDAABgMYDGAwAAYDGAyAwQAGAxgMgMEABgMYDIDBAAYDGAyAwQAGAxgMgMEABgMYDIDBAAYDGAyAwQAGAxgMgMEABgMYDIDBAAYDGAyAwQAGA2AwgMEABgNgMIDBAAYDYDCAwQAGA2AwgMEABgNgMIDBAAYDYDCAwQAGA2AwgMEABgNgMIDBAP8sMiWVh63j1TAAAAAASUVORK5CYII="/></div></div>`;
          } else {
            innerHtml += `<div class="row"><div class="label"></div>
                    <div class="content fullDocument"><img src="data:image/${getImageTypeFromBase64(result.fullDocumentImageBase64)};base64,${result.fullDocumentImageBase64}"/></div>
                  </div>`;
          }
        }
        innerHtml += '</div>';
      });
      if (innerHtml) {
        this.shadowRoot.querySelector('.container.results').innerHTML = innerHtml;
      } else {
        this.toggleError(true, this.getSlotText('labels.scanningFinishedNoDataMessage'), this.getSlotText('labels.scanningFinishedNoDataTitle'), false);
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
            if (key && key.includes('Base64')) {
              value = value.substring(0, 50) + '...';
            }
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
      this.executionResult = response.result;
      this.clearTimers();
      let showIntervalId = setInterval(() => {
        if (this.enableResultShow) {
          clearInterval(showIntervalId);
          this.toggleLoader(false);
          this.stopCamera();
          this.restartCounter();
          if (this.tabs) this.fillTabs(response);
          this.dispatchEvent('resultReady', response);
        }
      }, 200);
    }

    onScanError(error) {

      if (this.unsubscribeFromScanExchangerChanges) {
        // If error happened then unsubscribe from the exchange object,
        // this will force user to create new exchange object
        this.unsubscribeFromScanExchangerChanges();
      }

      this.clearTimers();
      this.toggleLoader(false);
      this.stopCamera();
      this.restartCounter();
      this.toggleError(true, error && error.message);
      this.dispatchEvent('error', new Error((error && error.message) || this.getSlotText('labels.errorMsg')));
    }

    clearTimers() {
      clearInterval(this.frameSendingIntervalId);
      clearInterval(this.counterIntervalId);
      clearTimeout(this.messageTimeoutId);
      removeClass(this.shadowRoot.getElementById('counter'), 'show');
    }

    dispatchEvent(type, input) {
      input = input || {};
      let event;
      switch(type) {
        case 'resultReady':
          if (typeof CustomEvent === 'function') {
            event = new CustomEvent('resultReady', { detail: { result: input.result }, cancelable: true, bubbles: true });
          } else {
            event = document.createEvent('CustomEvent');
            event.initCustomEvent('resultReady', true, true, { result: input.result });
          }
          break;
        case 'error':
          if (typeof ErrorEvent === 'function') {
            event = new ErrorEvent('error', { cancelable: true, bubbles: true, message: input.message, error: input });
          } else {
            event = document.createEvent('ErrorEvent');
            event.initErrorEvent('error', true, true, input.message, null, null);
          }
          break;
        default: return;
      }
      super.dispatchEvent(event);
    }

    onScanProgress(progressEvent) {
      let { loaded, total, lengthComputable } = progressEvent;
      let progressBar = this.shadowRoot.querySelector('.progress-bar-value');
      let isUploadBarHidden = hasClass(progressBar, 'hidden');
      if (lengthComputable) {
        if (isUploadBarHidden) {
          removeClass(progressBar, 'hidden');
        }
        progressBar.textContent = `${ Math.round((loaded/total) * 100) }%`;
        if (loaded === total) {
          setTimeout(() => this.changeLoaderMessage(), 200);
        }
      }
      else if(!isUploadBarHidden) {
        addClass(progressBar, 'hidden');
      }
    }

    changeLoaderMessage(cnt = 0) {
      let messages = this.shadowRoot.querySelectorAll('.pending-container h2');
      if (messages.length <= 1) return;
      Array.prototype.forEach.call(messages, elem => toggleClass(elem, 'hidden', !elem.matches(`:nth-of-type(${(cnt % (messages.length - 1)) + 2})`)));
      this.messageTimeoutId = setTimeout(() => this.changeLoaderMessage(++cnt), 1000 + Math.round(Math.random() * 3000));
    }

    onCameraPermissionDialog() {
      addClass(this.shadowRoot.querySelector('.permission'), 'show');
    }

    onCameraPermissionResolve(status) {
      this.permissionTimeoutId !== null ? clearTimeout(this.permissionTimeoutId) : removeClass(this.shadowRoot.querySelector('.permission'), 'show');
      this.streamStatus = status;
    }
  }
  customElements.define('microblink-ui-web', WebApi);
}
