# Microblink JS

Javascript SDK for integrating with Microblink API

## Demo

<!-- ./sample/demo-at-docs.md -->

App implementation is available on [Codepen](https://codepen.io/microblink/pen/WaYReG/).  

More details about product with demo page are available [here](https://microblink.com/products/blinkid/web-api).

## About

This package includes library for image preparation and HTTP integration with Microblink API publicly hosted on https://api.microblink.com or for self hostend on-premise solution with Microblink API wrapped in Docker image, which is available on [Docker Hub](https://hub.docker.com/r/microblink/api/).   

Also, this package has an Microblink API UI web component available as custom HTML tag `<microblink-ui-web></microblink-ui-web>` which has native camera management for mobile and desktop devices with WebRTC support and file management solution.

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

Currently the component supports two additional boolean attributes. These can be set like any other HTML attributes.

**tabs** - this is for enabling results display inside component area after document scan or document file upload. 
Beside initial screen with action buttons, 3 more sections are rendered to which you can navigate via tab menu: 
table view of the results, preview of a JSON response from the server and preview of the frame or image from which the results were extracted.

**autoscroll** - this is a feature for mobile devices intended to improve UX. When scrolling through your page with this option enabled, the vertical positioning of the page will be set to the start of the component when distance of the component's top edge is near to the top edge of the viewport. This could help mobile users to have the whole component placed inside a viewport.

### Localization

If you wish to change textual contents inside a component, we are offering you an easy way to do this without the need for you to do cumbersome additional javascript manipulation. Maybe you want your page in a different language than English or you just don't like our default English labels.  
As for the implementation details of this feature, we are using `<slot>` elements as placeholders in a shadow DOM structure. The slots will be generated automatically. All you need to do is to provide a JSON content via `<template class="localization">` element and place the template as a child of `<microblink-ui-web>`. The template text content should be an URL to external JSON file, or you can insert JSON directly as a template content in which case you should append "json" class to `<template>`.  
To clarify, we are providing an example with all currently customizable labels and their default values:

```json
<microblink-ui-web>
	<template class="localization json">
		{
			"buttons": {
				"browse": "Browse",
				"camera": "Use camera",
				"tryAgain": "TRY AGAIN",
				"takePhoto": "TAKE A PHOTO",
				"copy": "Copy to clipboard"
			},
			"labels": {
				"dragDrop": "Drag and Drop\ndocument here OR",
     			"nativeCamera": "Choose image from \ndevice or camera app:",
				"cameraActivate": "Activate your camera to capture the ID document:",
				"errorMsg": "We're sorry, but something went wrong. Please try again.",
     			"permissionMsg": "Enable camera please",
				"holdStill": "HOLD STILL",
				"table": {
					"keys": "Data field from the ID",
					"values": "Value"
				},
     			"uploading" : "Uploading",
     			"processing" : "Processing",
     			"analyzing" : "Analyzing",
     			"extracting" : "Extracting data",
     			"almostDone" : "Almost done"
			},
			"tabs": {
				"retake": "RETAKE",
				"results": "RESULTS",
				"image": "IMAGE",
				"json": "JSON"
			}
		}
	</template>
</microblink-ui-web>
```

You can use this example as a template and just change JSON values for your purposes.  
There is a work in progress to provide a better support for single page apps and a better input format.

### Theme customization

To avoid leaking css styles inside of a component or outside of it, we are using a shadow DOM for scoping purposes.
This way the component's css is isolated from the rest of the page and there are no unintentional overrides.
However, you probably wish to adjust component style so it can better fit with the rest of your page design.
With this in mind, we provide style hooks in the form of CSS custom properties, also knows as CSS variables. CSS custom properties' values set on the component element have higher priority than those defaults set inside of the shadow DOM (`:host` selector) and for this reason they are able to pierce the barrier of the shadow DOM from the outside.  
We have defined dozens of custom properties so you have plenty of options when creating your own theme for the component. For more advanced styling options, such as creating your own layout, inserting icons at certain places, more labels and so on, you will have to directly manipulate HTML and CSS inside of the component's shadow DOM structure.
Below is the list of all currently available style hooks with their explanations:


| Property | Description |
| :-------------------------------| :----------|
| -\-mb-hem | This is basically CSS rem unit for the component. Default value is set to page's 1rem. If you wish to scale up or down text size of the component, use this property. |
| -\-mb-widget-font-family | Use to define component's font family. Default value: `Helvetica, Tahoma, Verdana, Arial, sans-serif` |
| -\-mb-widget-border-width | Border width of the entire component. Default value: `0` |
| -\-mb-widget-border-color | Border color of the component. Default value: `black` |
| -\-mb-widget-background-color | Background color of the component. Default value: `transparent` |
| -\-mb-alt-font-color | This property is used to set font color of the initial display labels. Default value: `black` |
| -\-mb-btn-font-color | Use to set buttons' font color. Default: `white` |
| -\-mb-btn-background-color | Background color of buttons. Default: `black` |
| -\-mb-btn-background-color-hover | Background color of hovered buttons. Default: `dimgrey` |
| -\-mb-btn-flip-image-color | Color of the camera flip button. Default: `black` |
| -\-mb-btn-border-radius | Set the buttons' border radius. Default values is `5px`  |
| -\-mb-dropzone-hover-color | Background color of drag and drop area when hovered with some dragged document. Default value: `rgba(0, 0, 0, .25)` |
| -\-mb-loader-font-color | Font color of the loader dialog during file upload and processing. If not set, fallback to -\-mb-dialog-font-color. |
| -\-mb-loader-background-color | Background color of the loader dialog. If not set, fallback to -\-mb-dialog-background-color. |
| -\-mb-dialog-font-color | Use to set font color of the permission and error dialogs. Default value: `black` |
| -\-mb-dialog-background-color | Use to set background color of the permission and error dialogs. Default value: `white` |
| -\-mb-counter-font-color | Use to set font color of the counter display, shown when capturing frames. Default value: `white` |
| -\-mb-counter-background-color | Use to set background color of the counter display. Default value: `rgba(0, 0, 0, 0.7)` |  

There are additional properties to style component if you are using 'tabs' option to display results inside a component.  
They are listed below:

| Property | Description |
| :----------------------------------- | :----------|
| -\-mb-tabs-font-color | Font color of tabs. Default value: `white` |
| -\-mb-tabs-background-color | Background color of tabs. Default value: `black` |
| -\-mb-tabs-border-width | Use to set bottom border width for underlined text inside tabs. Default value: `4px` |
| -\-mb-tabs-active-color | Use to set font color of active tab, the one whose corresponding container is displayed. Default value: first fallback to -\-mb-tabs-hover-color, second to `#ddd` |
| -\-mb-tabs-hover-color | Use to set font color of hovered tab. Default value: first fallback to -\-mb-tabs-active-color, second to `#ddd`|
| -\-mb-default-font-color | Use to set the font color of table results display. Default value: `black` |
| -\-mb-table-header-background-color | Use to set the background color of table headers in a results display. Default value: `#f2f2f2` |
| -\-mb-json-color-key | Inside JSON view, use to set font color of the keys. Default value: `#ff0000` |
| -\-mb-json-color-string | Inside JSON view, use to set font color of string values. Default value: `#008000` |
| -\-mb-json-color-number | Inside JSON view, use to set font color of number values. Default value: `#ffc000` |
| -\-mb-json-color-boolean | Inside JSON view, use to set font color of boolean values. Default value: `#0000FF` |
| -\-mb-json-color-null | Inside JSON view, use to set font color of the null values. Default value: `#ff00ff` |


## Development

### Realtime build

`npm start`