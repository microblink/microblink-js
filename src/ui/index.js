import { SDK } from '../microblink.SDK';

import templateHtml from './html/component.html';
import ResizeSensor from './ResizeSensor.js';
import ElementQueriesFactory from './ElementQueries.js';

import {escapeHtml, labelFromCamelCase, dateFromObject, isMobile, hasClass, addClass, removeClass, toggleClass, isRemotePhoneCameraAvailable} from './utils.js';

const Microblink = {
	SDK: SDK
};

// Expose it to global window object
if (window) {
	window['Microblink'] = Microblink;
}

const ERR_TIMED_OUT = 'Request Timed Out';
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
      return ['tabs', 'autoscroll'];
    }

    get tabs() { return this.hasAttribute('tabs'); }
    set tabs(value) { value === true ? this.setAttribute('tabs', '') : this.removeAttribute('tabs'); }

    get autoscroll() { return this.hasAttribute('autoscroll'); }
    set autoscroll(value) { value === true ? this.setAttribute('autoscroll', '') : this.removeAttribute('autoscroll'); }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.onScanError = this.onScanError.bind(this);
      this.onScanSuccess = this.onScanSuccess.bind(this);
      this.onScanProgress = this.onScanProgress.bind(this);
      this.startRecording = this.startRecording.bind(this);
      this.autoScrollListener = this.autoScrollListener.bind(this);
      this.getLocalization = this.getLocalization.bind(this);
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
      this.shadowRoot.getElementById('cancelBtn').addEventListener('click', () => {
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
      this.handleWebRTCSupport();
      this.adjustComponent(true);
      this.ElementQueries = ElementQueriesFactory(ResizeSensor, this.shadowRoot);
      this.ElementQueries.listen();
      window.addEventListener('resize', this.adjustComponent.bind(this));
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
      let p = errDialog.querySelector('p:not(:first-child)');
      if (p) errDialog.removeChild(p);
      if (show && message) {
        let element = document.createElement('p');
        element.textContent = message;
        errDialog.insertBefore(element, errDialog.querySelector('button'));
        addClass(errDialog.querySelector('p:first-child'), 'hidden');
      } else {
        removeClass(errDialog.querySelector('p:first-child'), 'hidden');
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

      Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('.root > .container'), elem => toggleClass(elem, 'hidden', !hasClass(elem, 'remote-camera')));

      const _shadowRoot = this.shadowRoot;

      _shadowRoot.getElementById('generating-exchange-link').style.setProperty('display', 'block');
      _shadowRoot.getElementById('exchange-link-title').style.setProperty('display', 'none', 'important');
      _shadowRoot.getElementById('exchange-link-notes').style.setProperty('display', 'none', 'important');
      _shadowRoot.querySelector('.remote-camera .loader-img').style.setProperty('display', 'block');
      _shadowRoot.getElementById('exchange-link').innerHTML = '';

      const scan = await Microblink.SDK.CreateScanExchanger();
      scan.onSnapshot(function(scanDoc) { 
        const scanDocData = scanDoc.data();
        if (scanDocData.shortLink) {
          const exchangeLink = scanDocData.shortLink;
          _shadowRoot.getElementById('exchange-link').innerHTML = `<a href="${exchangeLink}" target="_blank" >${exchangeLink}</a>`;
          _shadowRoot.querySelector('.remote-camera .loader-img').style.setProperty('display', 'none', 'important');
          _shadowRoot.getElementById('exchange-link-title').style.setProperty('display', 'block');
          _shadowRoot.getElementById('exchange-link-notes').style.setProperty('display', 'block');
          _shadowRoot.getElementById('generating-exchange-link').style.setProperty('display', 'none', 'important');
        }
      });
    }

    activateLocalCamera() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.shadowRoot.getElementById('cameraLocalBtn').setAttribute('disabled', '');
        let constraints = { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: { ideal: 'environment' } } };
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
        }).catch(error => {
          this.permissionDialogAbsent(permissionTimeoutId);
          this.toggleError(true);
          this.dispatchEvent('error', new Error('Camera error: ' + error.name));
          console.log(error.name); //NotFoundError, NotAllowedError, PermissionDismissedError
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
      this.stopSendingFrames = false;
      let countdown = 3;
      addClass(this.shadowRoot.getElementById('photoBtn'), 'hidden');
      addClass(this.shadowRoot.getElementById('counter'), 'show');
      let numberNode = this.shadowRoot.querySelector('.counter-number');
      numberNode.textContent = String(countdown);
      this.frameSendingIntervalId = setInterval(() => {
        this.captureFrame().then(data => {
          if (this.stopSendingFrames) return;
          Microblink.SDK.SendImage(data);
        });
      }, 200);
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
        this.stopSendingFrames = true;
        clearInterval(this.frameSendingIntervalId);
        Microblink.SDK.TerminateRequest();
        this.stopCamera();
        this.restartCounter();
        this.restart();
        this.toggleError(true, ERR_TIMED_OUT);
        this.dispatchEvent('error', ERR_TIMED_OUT);
      }, 18000);
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
        if (json.summary.search(/Authorization header is missing/gi) !== -1) {
          innerHtml = `<p class="masked-label">${RESULT_MASKED}</p>${innerHtml}`;
        }
        this.shadowRoot.querySelector('.container.results').innerHTML = innerHtml;
      } else {
        this.shadowRoot.querySelector('.container.results').innerHTML = `<span class="no-result">
        Scanning is finished, but we could not extract the data. Please check if you uploaded the right document type
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
      this.stopSendingFrames = true;
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
      this.clearTimers();
      this.toggleLoader(false);
      this.stopCamera();
      this.restartCounter();
      this.toggleError(true, error && error.message);
      this.dispatchEvent('error', (error && error.message) || 'We\'re sorry, but something went wrong. Please try again.' );
    }

    clearTimers() {
      clearInterval(this.frameSendingIntervalId);
      clearTimeout(this.recordingTimeoutId);
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
