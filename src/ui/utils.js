export function escapeHtml(txt) {
  return typeof txt === "string" ? txt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/\n/g, '\\n') : txt;
}

export function labelFromCamelCase(value) {
  return value.replace(/([A-Z]+)/g, " $1").replace(/([A-Z][a-z])/g, " $1");
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
