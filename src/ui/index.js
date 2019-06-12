import { SDK } from '../microblink.SDK';

import templateHtml from './html/component.html';
import ResizeSensor from './ResizeSensor.js';
import ElementQueriesFactory from './ElementQueries.js';
import { FrameHelper } from '../frameHelper'

import {escapeHtml, labelFromCamelCase, dateFromObject, isMobile, hasClass, addClass, removeClass, toggleClass, isRemotePhoneCameraAvailable} from './utils.js';

const Microblink = {
	SDK: SDK
};

// Default for desktop
let CARD_PADDING_FACTOR_TO_THE_COMPONENT = 0.6;
// At mobile it looks much better when it is almost at the edge of the component
if (isMobile()) {
  CARD_PADDING_FACTOR_TO_THE_COMPONENT = 0.9;
}

// Expose it to global window object
if (window) {
	window['Microblink'] = Microblink;
}

const ERR_UNSUPPORTED_TYPE = 'Unsupported file type';
const RESULT_MASKED = 'Please notice that your results are masked due to missing Authorization header';

//insert web components light polyfill for cross-browser compatibility
let script = document.createElement('script');
script.src = '//unpkg.com/@webcomponents/webcomponentsjs/webcomponents-loader.js';
script.addEventListener('load', function() {
  window.WebComponents.waitFor(defineComponent); //to make sure all polyfills are loaded
});
document.head.insertBefore(script, document.head.querySelector('script[src*="microblink."]'));

function defineComponent() {

  let template = document.createElement('template');
  template.innerHTML = templateHtml;

  class WebApi extends HTMLElement {

    static get observedAttributes() {
      return ['tabs', 'autoscroll', 'webcam'];
    }

    get tabs() { return this.hasAttribute('tabs'); }
    set tabs(value) { value === true ? this.setAttribute('tabs', '') : this.removeAttribute('tabs'); }

    get autoscroll() { return this.hasAttribute('autoscroll'); }
    set autoscroll(value) { value === true ? this.setAttribute('autoscroll', '') : this.removeAttribute('autoscroll'); }

    get webcam() { return this.getAttribute('webcam'); }
    set webcam(value) { value === false ? this.setAttribute('webcam', 'false') : this.removeAttribute('webcam'); }

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

      document.addEventListener('DOMContentLoaded', this.getLocalization);
      Microblink.SDK.RegisterListener(this);
    }

    connectedCallback() {
      if(this.shadowRoot.innerHTML) this.shadowRoot.innerHTML = '';
      this.shadowRoot.appendChild(template.content.cloneNode(true));
      this.shadowRoot.getElementById('fileBtn').addEventListener('click', () => this.shadowRoot.getElementById('file').click());
      this.shadowRoot.getElementById('file').addEventListener('click', function() { this.value = ''; });
      this.shadowRoot.getElementById('file').addEventListener('touchstart', function() { this.value = ''; });
      this.shadowRoot.getElementById('file').addEventListener('change', this.fileChosen.bind(this));
      this.shadowRoot.getElementById('againBtn').addEventListener('click', () => {
        this.restart();
        this.stopCamera();
        this.toggleError();
      });
      this.shadowRoot.getElementById('cancelBtnLocalCamera').addEventListener('click', () => {
        this.stopCamera();
      });
      this.shadowRoot.getElementById('cancelBtnRemoteCamera').addEventListener('click', () => {
        this.stopCamera();
      });
      document.addEventListener('keydown', (evt) => {
        evt = evt || window.event;
        if (evt.key === 'Escape') {
          this.stopCamera();
        }
      });
      this.shadowRoot.querySelector('.dropzone').addEventListener('dragover', event => event.preventDefault());
      this.shadowRoot.querySelector('.dropzone').addEventListener('drop', this.onDrop.bind(this));
      this.shadowRoot.querySelector('.dropzone').addEventListener('dragenter', this.onDragEnter.bind(this));
      this.shadowRoot.querySelector('.dropzone').addEventListener('dragleave', this.onDragLeave.bind(this));
      this.shadowRoot.getElementById('cameraLocalBtn').addEventListener('click', this.activateLocalCamera.bind(this));
      this.shadowRoot.getElementById('cameraRemoteBtn').addEventListener('click', this.activateRemoteCamera.bind(this));
      this.shadowRoot.querySelector('video').addEventListener('loadedmetadata', function() { this.play(); });
      this.shadowRoot.getElementById('photoBtn').addEventListener('click', () => this.startRecording());
      this.shadowRoot.getElementById('flipBtn').addEventListener('click', this.flipCamera.bind(this));
      let video = this.shadowRoot.getElementById('video');
      video.addEventListener('loadedmetadata', function() { this.controls = false; });
      video.addEventListener('play', () => {
        removeClass(this.shadowRoot.getElementById('photoBtn'), 'hidden');
      });

      Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.tab'), elem => {
        elem.addEventListener('click', () => {
          let tabId = elem.id;
          Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.tab'), elem => toggleClass(elem, 'active', tabId === elem.id));
          Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.main > .container'), elem => {
            toggleClass(elem, 'active', hasClass(elem, tabId.substring(0, tabId.length - 3)));
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
      this.checkWebRTCSupport();
      this.checkRemoteCameraSupport();
      this.adjustComponent(true);
      this.ElementQueries = ElementQueriesFactory(ResizeSensor, this.shadowRoot);
      this.ElementQueries.listen();
      window.addEventListener('resize', this.adjustComponent.bind(this));

      this.shadowRoot.getElementById('webcamConfirmBtn').addEventListener('click', () => {
        Microblink.SDK.SendImage(this.webcamImage, this.onScanProgress);
        this.toggleLoader(true);
        this.restart();
        this.stopCamera();
        removeClass(this.shadowRoot.querySelector('.confirm-image'), 'show');
      });
      this.shadowRoot.getElementById('webcamRetakeBtn').addEventListener('click', () => {
        this.activateLocalCamera();
        removeClass(this.shadowRoot.querySelector('.confirm-image'), 'show');
      });
      this.shadowRoot.querySelector('slot[name="loader-image"]').addEventListener('slotchange', event => {
        let loaderElements = event.target.assignedElements();
        let loaderSlots = Array.prototype.map.call(this.shadowRoot.querySelectorAll('slot[name="loader-image"]'), el => el);
        loaderSlots.shift();
        if (loaderSlots.length) {
          loaderSlots.forEach(slot => {
              slot.innerHTML = '';
              loaderElements.forEach(element => {
                slot.appendChild(element.cloneNode(true));
              });
          });
        }
      });
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if(name === 'autoscroll') {
        window[(newValue !== null ? 'add' : 'remove') + 'EventListener']('scroll', this.autoScrollListener)
      }
    }

    adjustComponent(initial) {
      if (isMobile()) {
        this.style.height = `${window.innerHeight}px`;
        if(parseInt(getComputedStyle(this.parentNode).height) < window.innerHeight) {
          this.style.height = getComputedStyle(this.parentNode).height;
        }
        if (initial === true) {
          this.shadowRoot.getElementById('flipBtn').style.setProperty('display', 'none', 'important');
          this.shadowRoot.getElementById('cameraRemoteBtn').style.setProperty('display', 'none', 'important');
          this.shadowRoot.getElementById('cameraBtnSeparator').style.setProperty('display', 'none', 'important');
          this.shadowRoot.getElementById('cameraLocalBtn').innerHTML = this.shadowRoot.getElementById('cameraLocalBtn').innerHTML.replace('desktop', '').replace('web', '');
          Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('#flipBtn, .video video'), elem => toggleClass(elem, 'flipped'));
          Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.dropzone .intro-label'), elem => toggleClass(elem, 'hidden'));
        }
      }

      if (!isRemotePhoneCameraAvailable()) {
        this.shadowRoot.getElementById('cameraRemoteBtn').style.setProperty('display', 'none', 'important');
        this.shadowRoot.getElementById('cameraBtnSeparator').style.setProperty('display', 'none', 'important');
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

    checkWebRTCSupport() {
      if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
        let cameraLocalBtn = this.shadowRoot.getElementById('cameraLocalBtn');
        cameraLocalBtn.parentNode.removeChild(cameraLocalBtn);
        this.shadowRoot.getElementById('cameraBtnSeparator').style.setProperty('display', 'none', 'important');
      }
    }

    checkRemoteCameraSupport() {
      Microblink.SDK.IsDesktopToMobileAvailable().then(isAvailable => {
        if (!isAvailable) {
          this.shadowRoot.getElementById('cameraRemoteBtn').style.setProperty('display', 'none', 'important');
          this.shadowRoot.getElementById('cameraBtnSeparator').style.setProperty('display', 'none', 'important');
          if (!this.shadowRoot.getElementById('cameraLocalBtn')) {
            let cameraPart = this.shadowRoot.querySelector('.container.intro .inline + .inline');
            cameraPart.parentNode.removeChild(cameraPart);
          }
        }
      });
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

    /*switchLocale() {
      let slotTargets =  this.querySelectorAll('[slot*=labels]'); //not live nodelist so it will work
      if (slotTargets && slotTargets.length) {
        Array.prototype.forEach.call(slotTargets, target => target.parentNode.removeChild(target));
      } else {
        this.getLocalization();
      }
    }
    */

    toggleLoader(show) {
      let loader = this.shadowRoot.querySelector('.pending-container');
      if(show) {
        this.shadowRoot.querySelector('.progress-bar-value').textContent = '0%';
        Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.pending-container h2'), elem => toggleClass(elem, 'hidden', !elem.matches(':first-of-type')));
        this.toggleTabs(false);
      }
      toggleClass(loader, 'show', show);
    }

    toggleError(show, message) {
      let errDialog = this.shadowRoot.querySelector('.error-container');
      Array.prototype.forEach.call(errDialog.querySelectorAll('p'), el => errDialog.removeChild(el));
      let element = document.createElement('p');
      if (show && message) {
        element.textContent = message;
      } else {
        element.textContent = errDialog.querySelector('slot[name="labels.errorMsg"]').textContent;
      }
      errDialog.insertBefore(element, errDialog.querySelector('button'));
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
        if (file.type && (file.type.indexOf('image') !== -1)) {
          this.setFile(file);
        } else {
          this.toggleError(true, ERR_UNSUPPORTED_TYPE);
          this.dispatchEvent('error', new Error(ERR_UNSUPPORTED_TYPE));
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
      if (file.size > 15 * 1024 * 1024) {
        this.toggleError(true, 'Maximum file size is 15 MB');
        this.dispatchEvent('error', 'Maximum file size is 15 MB');
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

      this.toggleTabs(false);
      this.clearTabs();
      Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.root > .container'), elem => toggleClass(elem, 'hidden', !hasClass(elem, 'remote-camera')));

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

    activateLocalCamera() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.shadowRoot.getElementById('cameraLocalBtn').setAttribute('disabled', '');
        let constraints = { video: { width: { ideal: 3840 }, height: { ideal: 2160 }, facingMode: { ideal: 'environment' } } };
        let permissionTimeoutId = setTimeout(() => { permissionTimeoutId = null; this.permissionDialogPresent(); }, 1500); //this is "event" in case of browser's camera allow/block dialog
        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
          this.permissionDialogAbsent(permissionTimeoutId);
          let video = this.shadowRoot.getElementById('video');
          video.controls = true;
          if ('srcObject' in video) {
            video.srcObject = stream;
          } else {
            video.src = URL.createObjectURL(stream);
          }
          setTimeout(() => {
            video.play().catch(() => {
              addClass(this.shadowRoot.getElementById('photoBtn'), 'hidden');
            });
          }, 0);

          this.toggleTabs(false);
          this.clearTabs();
          Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.root > .container'), elem => toggleClass(elem, 'hidden', !hasClass(elem, 'video')));

          // Rescale card-layout-rectangle and it's background to the component size
          // Get current values
          var componentWidth = this.shadowRoot.getElementById('rootContainer').offsetWidth;
          var componentHeight = this.shadowRoot.getElementById('rootContainer').offsetHeight;
          var cardLayoutRectangleWidth = this.shadowRoot.getElementById('card-layout-rectangle').offsetWidth;
          var cardLayoutRectangleHeight = this.shadowRoot.getElementById('card-layout-rectangle').offsetHeight;

          // Try to scale depends on the component's width
          var paddingFactor = CARD_PADDING_FACTOR_TO_THE_COMPONENT;
          var scaleFactor = (componentWidth / cardLayoutRectangleWidth) * paddingFactor;
          // Fallback to scale depends on the component height if card border is out of the component
          if ((cardLayoutRectangleHeight * scaleFactor) > (componentHeight * paddingFactor)) {
            scaleFactor = (componentHeight / cardLayoutRectangleHeight) * paddingFactor;
          }

          // Update UI
          this.shadowRoot.getElementById('card-layout-rectangle').style.zoom = scaleFactor;
          this.shadowRoot.getElementById('card-layout-rectangle-background').style.zoom = scaleFactor;

        }).catch(error => {
          this.permissionDialogAbsent(permissionTimeoutId);

          let errorMessage;
          switch(error.name) {
            case 'NotFoundError':
              errorMessage = this.shadowRoot.querySelector('slot[name="labels.notFoundErrorMsg"]').textContent;
              break;
            case 'NotAllowedError':
              errorMessage = this.shadowRoot.querySelector('slot[name="labels.notAllowedErrorMsg"]').textContent;
              break;
          }

          this.toggleError(true, errorMessage);
          this.dispatchEvent('error', new Error('Camera error: ' + error.name));
          console.log(error.name); //NotFoundError, NotAllowedError
        }).then(() => this.shadowRoot.getElementById('cameraLocalBtn').removeAttribute('disabled'));

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
      removeClass(numberNode, 'hidden');
      numberNode.textContent = String(countdown);
      let frames = [];
      let counterIntervalId = setInterval(() => {
        numberNode.textContent = String(--countdown);
        if (countdown === 1) {
          this.frameSendingIntervalId = setInterval(() => {
            this.captureFrameAndAddToArray(frames);
          }, 200);
        }
        if (countdown === 0) {
          clearInterval(counterIntervalId);
          clearInterval(this.frameSendingIntervalId);
          this.hideCounter();
          this.enableResultShow = true;

          // So that even the picture on 0 countdown mark would be included
          this.captureFrameAndAddToArray(frames).then(() => {
            let bestFrame = frames.reduce((prev, current) => (prev.frameQuality > current.frameQuality) ? prev : current);
            this.userImageConfirmation(bestFrame.data);
          });
        }
      }, 1000);
    }

    userImageConfirmation(scanInputFile) {
      this.webcamImage = scanInputFile;
      let image = new Image();
      image.src = URL.createObjectURL(scanInputFile.blob);
      let imageContainerNode = this.shadowRoot.querySelector('.confirm-image .image-container');
      imageContainerNode.innerHTML = '';
      imageContainerNode.appendChild(image);
      addClass(this.shadowRoot.querySelector('.confirm-image'), 'show');
    }

    captureFrameAndAddToArray(frames) {
      return new Promise(resolve => {
        this.captureFrame().then(data => {
          let frameQuality = FrameHelper.getFrameQuality(data.pixelData);
          delete data.pixelData; // So Microblink.SDK.SendImage will recognize it as ScanInputFile instead of ScanInputFrame
          frames.push({data, frameQuality});
          resolve();
        });
      });
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
          canvas.toBlob(blob => resolve({ blob, pixelData }), "image/jpeg", 0.95);
        } else {
          let binStr = atob(canvas.toDataURL("image/jpeg", 0.95).split(',')[1]), len = binStr.length, arr = new Uint8Array(len);
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
    }

    hideCounter() {
      removeClass(this.shadowRoot.getElementById('counter'), 'show');
    }

    fillTabs(response) {
      const imageTabElement = this.shadowRoot.getElementById('imageTab');

      if (response.sourceBlob) {
        let image = new Image();
        image.src = URL.createObjectURL(response.sourceBlob);
        this.shadowRoot.querySelector('.main > .image').appendChild(image);
        imageTabElement.style.setProperty('display', 'block');
      } else {
        imageTabElement.style.setProperty('display', 'none', 'important');
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
        if (json.summary.search(/Authorization header is missing/gi) !== -1) {
          innerHtml = `<p class="masked-label">${RESULT_MASKED}</p>${innerHtml}`;
        }
        this.shadowRoot.querySelector('.container.results').innerHTML = innerHtml;
      } else {
        this.shadowRoot.querySelector('.container.results').innerHTML = `<span class="no-result">
        Scanning is finished, but we could not extract the data. Please check if you uploaded the right document type.
      </span>`;
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
      this.dispatchEvent('error', (error && error.message) || 'We\'re sorry, but something went wrong. Please try again.' );
    }

    clearTimers() {
      clearInterval(this.frameSendingIntervalId);
      clearTimeout(this.messageTimeoutId);
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

    permissionDialogPresent() {
      addClass(this.shadowRoot.querySelector('.permission'), 'show');
    }

    permissionDialogAbsent(timeoutId) {
      timeoutId !== null ? clearTimeout(timeoutId) : removeClass(this.shadowRoot.querySelector('.permission'), 'show');
    }
  }
  customElements.define('microblink-ui-web', WebApi);
}
