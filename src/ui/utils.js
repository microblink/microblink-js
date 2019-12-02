export function escapeHtml(txt) {
  return typeof txt === "string" ? txt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/\n/g, '\\n') : txt;
}

export function labelFromCamelCase(value) {
  return value.replace(/([A-Z]+)/g, " $1").replace(/^\w/, c => c.toUpperCase());
}

export function dateFromObject(object) {
  let { day, month, year } = object;
  if (day === null && month === null && year === null) return null;
  const number = "number";
  if (typeof day !== number || typeof month !== number || typeof year !== number) return object;
  let date = new Date(year, month - 1, day);
  // If day is 0 then this could be result from BLINK_CARD_FRONT for field validThru
  if (day === 0) {
    date = new Date(year, month, day);
  }
  let language = navigator.userLanguage || navigator.language || (navigator.languages && navigator.languages[0]);
  return date.toLocaleDateString(language ? language : undefined);
}

export function isMobile() {
  return /Mobi|Android/.test(navigator.userAgent);
}

export function isSafari() {
  return /Version\//.test(navigator.userAgent) && /Safari\//.test(navigator.userAgent) && !/(Chrome|Chromium)\//.test(navigator.userAgent);
}

export function isFirefox() {
  return /Firefox\//.test(navigator.userAgent) && !/Seamonkey\//.test(navigator.userAgent);
}

function isFirebaseAppConfigured() {
  try {
    firebase.app();
    return true;
  } catch (e) {
    return false;
  }
}

export function isRemotePhoneCameraAvailable() {
  return isFirebaseAppConfigured();
}

export function hasClass(elem, className) {
  return new RegExp(`(^|\\s)${String(className).trim()}($|\\s)`).test(elem.className);
}

export function addClass(elem, className) {
  if (!hasClass(elem, className)) {
    elem.className += ` ${className}`;
    elem.className = elem.className.trim();
  }
  return elem;
}

export function removeClass(elem, className) {
  elem.className = elem.className.replace(new RegExp(`(\\s|^)${String(className).split(' ').join('|')}(\\s|$)`, 'g'), ' ').trim();
  return elem;
}

export function toggleClass(elem, className, add) {
  if (add === true) return addClass(elem, className);
  if (add === false) return removeClass(elem, className);
  return hasClass(elem, className) ? removeClass(elem, className) : addClass(elem, className);
}

export function getImageTypeFromBase64(base64Image) {
  if (!base64Image) return;
  switch (base64Image.charAt(0)) {
    case '/':
      return 'jpg';
    case 'R':
      return 'gif';
    case 'U':
      return 'webp';
    case 'i':
    default:
      return 'png';
  }
}

export function adjustScreenFull(screenFull) {
  screenFull.request = element => {
    return new Promise((resolve, reject) => {
      let onFullScreenEntered = () => {
        screenFull.off('change', onFullScreenEntered);
        resolve();
      };
      screenFull.on('change', onFullScreenEntered);
      element = element || document.documentElement;
      Promise.resolve(element[screenFull.raw.requestFullscreen]({ navigationUI: 'hide' })).catch(reject);
    });
  };
  let onChangeHandler = ({ target: webApi }) => { //TODO try matchMedia
    let root = webApi.shadowRoot.querySelector('.root');
    setTimeout(() => {
      if (screenFull.isFullscreen && isMobile()) { //remember to reset when some values for orientationchange (maybe just erase style or class)
        if (isFirefox()) { //fix for firefox fullscreen bug where navigation is rendered over the component
          if (window.outerHeight > window.outerWidth) { //portrait mode
            if (root.clientHeight !== screen.availHeight) { //this is where bug exists
              //improve in next version
            }
          } else { //landscape
            if (root.clientWidth !== screen.availWidth) { //bug in landscape mode

            }
          }
        }
      }
    }, 200); //onchange is fired before elements are resized for fullscreen mode and there is no clear post render event in this case
  };
  screenFull.on('change', onChangeHandler);
  screenFull.onChangeHandler = onChangeHandler;
}
