# Microblink JS

Javascript SDK for integrating with Microblink API

[![npm version](https://badge.fury.io/js/microblink.svg)](https://badge.fury.io/js/microblink)

[![NPM](https://nodei.co/npm/microblink.png?compact=true)](https://nodei.co/npm/microblink/)

## Demo

<!-- ./sample/demo-at-docs.md -->

Demo app. implementation is available on [Codepen](https://codepen.io/microblink/pen/WaYReG/).  

More details about product with demo page are available [here](https://microblink.com/products/blinkid/web-api).

## About

This package includes library for image preparation and HTTP integration with Microblink API publicly hosted on https://api.microblink.com or for self hostend on-premise solution with Microblink API wrapped in Docker image, which is available on [Docker Hub](https://hub.docker.com/r/microblink/api/).   

Also, this package has an Microblink API UI web component available as custom HTML tag `<microblink-ui-web></microblink-ui-web>` which has native camera management for mobile and desktop devices with WebRTC support and file management solution.

### Browser compatibility

![Chrome](https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![IE](https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png) | ![Safari](https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png)
--- | --- | --- | --- |
Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ |

## How to use

### Install package

```
npm install microblink
```

### Using CDN

You can also link the scripts from unpkg: https://unpkg.com/microblink/dist/

If you wish to use only SDK without UI component, use minified version [microblink.sdk.min.js](https://unpkg.com/microblink/dist/microblink.sdk.min.js)

For the whole thing, we recommend using [es6 version](https://unpkg.com/microblink/dist/microblink.min.js) for better performance. 
If you really want es5, you can find minified version [here](https://unpkg.com/microblink/dist/microblink.es5.min.js). 


## Microblink API Proxy

To avoid the leaking of your credentials (Microblink API Authorization header = API key + API secret) by your visitors in the frontend Javascript application, your frontend application in the production environment should has an access to the backend proxy application and backend proxy application should append the authorization credentials, and also in this proxy application you could execute your additional business logic.

### Example implementation in Node.js Express application

Minimum proxy implementation which ensure the security for your credentials are available here https://github.com/microblink/microblink-api-proxy-example this example can be easily hosted at Webtask.io service in few minutes. More details about this example are available in this [README.md](https://github.com/microblink/microblink-api-proxy-example/blob/master/README.md)

## Using web component

To skip developing your own front-end UI solution, we have included our web component in the package to provide you quick and easy integration, theme customization and labels translation.
Under the hood we are using [WebComponents](https://www.webcomponents.org/) technology, custom elements and shadow DOM.
Just insert our custom html element `<microblink-ui-web></microblink-ui-web>` into your page and the component will be rendered with initial setup.

### Javascript events

As we have developed our UI solution as a custom html element, we have also implemented it to dispatch additional HTML DOM events which can easily be accessed with javascript.  
Component fires two kind of events which are important for interacting with the rest of the page. Adding event listeners is the way to communicate with the component. 

**resultReady**  
This event is fired after successful image upload or scan and the results are available on the client side. By listening to this event you are able for example to fill out your web form with the extracted data.  
Plain javascript code example:

```javascript
document.querySelector('microblink-ui-web').addEventListener('resultReady', function(/*CustomEvent*/ event) {
  var result = event.detail.result;
  /* do something with the result */
});
```

**error**  
This event is fired in case of any kind of error during component use. More information can be extracted from `ErrorEvent` argument such as error message. By listening to this event you can for example notify user of a failed scan, upload, connection error and so on.  
Plain javascript code example:

```javascript
document.querySelector('microblink-ui-web').addEventListener('error', function(/*ErrorEvent*/ event) {
  var error = event.error, message = event.message;
  /* do something with the error */
});
```

### Setting component dimensions

The component will initially stretch to the size of it's container. To control component's width and height, we recommend wrapping it inside a single `<div>` and setting css dimension properties on wrapper `<div>` element.  
For better UX, when viewing your page from a mobile browser, the component's height is set to 100% height of the viewport, but not more than a container's height. This gives you an option to control component's height inside viewport height range.

### Attributes

Currently the component supports four additional boolean attributes. These can be set like any other HTML attributes.

**tabs** - this is for enabling results display inside component area after document scan or document file upload. 
Beside initial screen with action buttons, 2 more sections are rendered to which you can navigate via tab menu: 
table view of the results and preview of a JSON response from the server.

**autoscroll** - this is a feature for mobile devices intended to improve UX. When scrolling through your page with this option enabled, the vertical positioning of the page will be set to the start of the component when distance of the component's top edge is near to the top edge of the viewport. This could help mobile users to have the whole component placed inside a viewport.

**webcam** - this is for enabling or disabling the option to use web camera. To disable the use of webcam set the `webcam` attribute to "off".

**upload** - this is for enabling or disabling the option to use upload image. To disable the use of upload image set the `upload` attribute to "off".

**fullscreen** - this is for enabling or disabling the option to open web camera video stream fullscreen. To disable the use of fullscreen camera video stream set the `fullscreen` attribute to "off".

### Localization

If you wish to change textual contents inside component, we are offering you an easy way to do this without the need for you to do cumbersome additional javascript manipulation. Maybe you want your page in a different language or you just don't want our default English labels.  
As for the implementation details of this feature, we are using `<slot>` elements as placeholders in a shadow DOM structure. The slots will be generated automatically.

`<microblink-ui-web>` has a method `setLocalization` which can receive JSON string or javascript object as parameter, containing translated or adjusted text for component's labels. This is the recommended way.
Calling this method will reset current localization texts and place new ones.
To clarify, we are providing an example with all currently customizable labels and their default values:

```javascript
document.querySelector('microblink-ui-web').setLocalization({
  "buttons" : {
    "browseDesktop": "Upload image",
    "browseMobile": "Take or upload photo",
    "cameraRemote": "Use mobile camera",
    "cameraLocalDesktop": "Use web camera",
    "cameraLocalMobile": "Use camera",
    "dropFiles": "Drop files to upload",
    "tryAgain": "TRY AGAIN",
    "takePhoto": "Take a photo",
    "copy": "Copy to clipboard",
    "confirm": "USE PHOTO",
    "retake": "RETAKE"
  },
  "labels" : {
    "chooseInputMethod": "Choose input method",
    "generatingExchangeLink": "Generating exchange link...",
    "exchangeLinkTitle": "Exchange link is",
    "openLinkAtSmartphone": "Please open exchange link at the smartphone with OR reader",
    "remoteCameraIsPending": "Remote camera is pending...",
    "remoteCameraIsOpen": "Remote camera is open...",
    "imageIsUploading": "Image is uploading...",
    "imageIsProcessing": "Image is processing...",
    "videoTagUnsupported": "Your browser does not support video tag",
    "uploading" : "Uploading",
    "processing" : "Processing",
    "analyzing" : "Analyzing",
    "extracting" : "Extracting data",
    "almostDone" : "Almost done",
    "errorMsg": "We're sorry, but something went wrong. Please try again.",
    "permissionMsg": "Enable camera please",
    "notFoundErrorMsg": "No camera was found on your device",
    "notAllowedErrorMsg": "You have denied camera access permission",
    "scanningFinishedNoDataTitle": "Document not recognized",
    "scanningFinishedNoDataMessage": "Please try again with a supported document or select a different recognizer",
    "unsupportedFileType": "Unsupported file type",
    "selectRecognizers": "Please select one or more recognizers to start scanning",
    "noRecognizersSelected": "No recognizers selected",
    "webRtcUnsupported": "WebRTC not supported by your browser"
  },
  "tabs" : {
    "back": "Back",
    "results": "Results",
    "json": "JSON"
  }
});
```

To retain compatibility, we are supporting old, now discouraged way of interpolating json directly into html:

You can provide JSON content via `<template class="localization">` element and place the template as a child of `<microblink-ui-web>`. The template text content should be an URL to external JSON file, or you can insert JSON directly as a template content in which case you should append "json" class to `<template>`.  
Here is an example with all currently customizable labels:

```json
<microblink-ui-web>
	<template class="localization json">
		{
			"buttons" : {
				"browseDesktop": "Upload image",
        "browseMobile": "Take or upload photo",
				"cameraRemote": "Use mobile camera",
				"cameraLocalDesktop": "Use web camera",
				"cameraLocalMobile": "Use camera",
				"dropFiles": "Drop files to upload",
				"tryAgain": "TRY AGAIN",
				"takePhoto": "Take a photo",
				"copy": "Copy to clipboard",
				"confirm": "USE PHOTO",
				"retake": "RETAKE"
			},
			"labels" : {
				"chooseInputMethod": "Choose input method",
				"generatingExchangeLink": "Generating exchange link...",
				"exchangeLinkTitle": "Exchange link is",
				"openLinkAtSmartphone": "Please open exchange link at the smartphone with OR reader",
				"remoteCameraIsPending": "Remote camera is pending...",
				"remoteCameraIsOpen": "Remote camera is open...",
				"imageIsUploading": "Image is uploading...",
				"imageIsProcessing": "Image is processing...",
				"videoTagUnsupported": "Your browser does not support video tag",
				"uploading" : "Uploading",
				"processing" : "Processing",
				"analyzing" : "Analyzing",
				"extracting" : "Extracting data",
				"almostDone" : "Almost done",
				"errorMsg": "We're sorry, but something went wrong. Please try again.",
				"permissionMsg": "Enable camera please",
				"notFoundErrorMsg": "No camera was found on your device",
				"notAllowedErrorMsg": "You have denied camera access permission",
				"scanningFinishedNoDataTitle": "Document not recognized",
				"scanningFinishedNoDataMessage": "Please try again with a supported document or select a different recognizer",
				"unsupportedFileType": "Unsupported file type",
				"selectRecognizers": "Please select one or more recognizers to start scanning",
				"noRecognizersSelected": "No recognizers selected",
				"webRtcUnsupported": "WebRTC not supported by your browser"
			},
			"tabs" : {
				"back": "Back",
				"results": "Results",
				"json": "JSON"
			}
		}
	</template>
</microblink-ui-web>
```

You can use this example as a template and just change JSON values for your purposes.

### Theme customization

To avoid leaking css styles inside of a component or outside of it, we are using a shadow DOM for scoping purposes.
This way the component's css is isolated from the rest of the page and there are no unintentional overrides.
However, you probably wish to adjust component style so it can better fit with the rest of your page design.
With this in mind, we provide style hooks in the form of CSS custom properties, also knows as CSS variables. CSS custom properties' values set on the component element have higher priority than those defaults set inside of the shadow DOM (`:host` selector) and for this reason they are able to pierce the barrier of the shadow DOM from the outside.  
We have defined dozens of custom properties so you have plenty of options when creating your own theme for the component. For more advanced styling options, such as creating your own layout, inserting icons at certain places, more labels and so on, you will have to directly manipulate HTML and CSS inside of the component's shadow DOM structure.
Below is the list of all currently available style hooks with their explanations:


| Property | Description |
| :-------------------------------| :----------|
| -\-mb-hem | This is basically CSS rem unit for the component. Default value is set to page's 1rem. If you wish to scale up or down text size of the component, use this property. Default: `1rem` |
| -\-mb-widget-font-family | Use to define component's font family. Default: `Helvetica, Tahoma, Verdana, Arial, sans-serif` |
| -\-mb-widget-border-width | Border width of the entire component. Default: `0` |
| -\-mb-widget-border-color | Border color of the component. Default: `black` |
| -\-mb-widget-background-color | Background color of the component. Default: `white` |
| -\-mb-default-font-color | Font color of the choose input label and results display. Default: `black` |
| -\-mb-alt-font-color | Font color of the initial display labels. Default: `#575757` |
| -\-mb-btn-font-color | Buttons' font color. Default: `white` |
| -\-mb-btn-background-color | Background color of buttons. Default: `#48b2e8` |
| -\-mb-btn-background-color-hover | Background color of hovered buttons. Default: `#26a4e4` |
| -\-mb-btn-alt-font-color | Font color of the webcam retake button. Default: `black` |
| -\-mb-btn-alt-background-color | Background color of the webcam retake button. Default: `white` |
| -\-mb-btn-border-radius | Set the buttons' border radius. Default: `0` |
| -\-mb-btn-intro-stroke-color | Stroke color of choose input screen icons. Default: `black` |
| -\-mb-btn-intro-stroke-color-hover | Stroke color of choose input screen icons on hover. Default: `white` |
| -\-mb-btn-intro-circle-color | Background color of choose input screen icons. Default: `#f2f2f2` |
| -\-mb-btn-intro-circle-color-hover | Background color of choose input screen icons on hover. Default: `#48b2e8` |
| -\-mb-btn-container-border-color | Border color of footer on webcam image confirmation screen. Default: `lightgrey` |
| -\-mb-spinner-border-width | Border width of the mobile camera status spinner.  Default: `6px` |
| -\-mb-capture-icons-color | Icon color of the flip image and close buttons. Default: `white` |
| -\-mb-dropzone-hover-color | Background color of drag and drop area when hovered with some dragged document. Default: `rgba(72, 178, 232, 0.2)` |
| -\-mb-dropzone-circle-color | Background color of drag and drop circle indicator. Default: `#48b2e8` |
| -\-mb-dropzone-icon-color | Color of drag and drop indicator icon. Default: `black` |
| -\-mb-loader-font-color | Font color of the loader dialog during file upload and processing. Default: `black` |
| -\-mb-loader-background-color | Background color of the loader dialog. Default: `#48b2e8` |
| -\-mb-card-layout-border-color | Border color of the card overlay. Default: `black` |
| -\-mb-dialog-title-color | Font color of the permission and error dialogs title. Default: `black` |
| -\-mb-dialog-message-color | Font color of the permission and error dialogs message. Default: `#575757` |
| -\-mb-photo-icon-primary | Background color of webcam photo button and counter. Default: `white` |
| -\-mb-photo-icon-accent | Accent color of webcam photo button and counter text. Default: `#48b2e8` |

There are additional properties to style component if you are using 'tabs' option to display results inside a component.  
They are listed below:

| Property | Description |
| :----------------------------------- | :----------|
| -\-mb-tabs-background-color | Background color of tabs. Default: `black` |
| -\-mb-tabs-font-color | Font color of tabs. Default: `white` |
| -\-mb-tabs-border-width | Bottom border width for underlined text inside tabs. Default: `4px` |
| -\-mb-tabs-hover-color | Font color of hovered tab. Default: `#26a4e4` |
| -\-mb-tabs-active-color | Font color of active tab, the one whose corresponding container is displayed. Default: `#48b2e8` |
| -\-mb-json-color-key | Inside JSON view, font color of the keys. Default value: `black` |
| -\-mb-json-color-string | Inside JSON view, font color of string values. Default value: `#48b2e8` |
| -\-mb-json-color-boolean | Inside JSON view, font color of boolean values. Default value: `#26a4e4` |
| -\-mb-json-color-number | Inside JSON view, font color of number values. Default value: `black` |
| -\-mb-json-color-null | Inside JSON view, font color of the null values. Default value: `#26a4e4` |
| -\-mb-results-border-color | Border color of results table. Default: `#dee2e6` |
| -\-mb-results-image-border-radius | Border radius of results table extracted images. Default: `6px` |
| -\-mb-results-image-background-color | Background color of results table extracted images when results are masked. Default: `#f2f2f2` |

### Feature: desktop-to-mobile

With this feature component is able to starts at the browser on the desktop computer and use remote camera on the smartphone to capture document, call API and returns results to the desktop where component was initially started.  

All data by default is exchanged over Firebase project through Firestore collection, this can be replaced by modifying the component and Microblink SDK internaly. 

#### Source

Microblink Scan Web is a standalone Angular application available as GIT submodule at [scan](https://github.com/microblink/microblink-scan-web) directory.

#### How it works

1. component is loaded at the browser on desktop
2. user requests feature by click to the button `Use mobile camera`
3. component at the desktop generate exchange link with QR code and secret key for AES encryption
4. user at smartphone should open generated exchange link (link contains scan identificator and AES secret key for encryption), recommended way is to scan QR code with QR reader integrated in native camera app on the iOS and Android or with custom QR reader
5. at mobile user takes document with native camera
6. component loaded at smartphone calls Microblink API, encrypt result and store it to the exchanged object at `Firebase.Firestore`
7. component loaded at desktop is subscribed for the changes, reads encrypted results stored in `Firebase.Firestore`, decrypts it and display it to the user

#### Firebase project setup

Look at the [sample/index.html](./sample/index.html) and replace Firebase app configuration with your project's credentials. To exchange data through database which you are the owner.

## Development

`npm install`

### Realtime watch & build

`npm start`

### Build release

`npm build` and fetch files from `dist` directory


