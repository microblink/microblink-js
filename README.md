# Microblink JS

Javascript SDK for integrating with Microblink API

## Demo

<!-- ./sample/demo-at-docs.md -->

App implementation is available on [Codepen](https://codepen.io/microblink/pen/WaYReG/).  

More details about product with demo page are available [here](https://microblink.com/products/blinkid/web-api).

## About

This package includes library for image preparation and HTTP integration with Microblink API publicly hosted on https://api.microblink.com or for self hostend on-premise solution with Microblink API wrapped in Docker image, which is available on [Docker Hub](https://hub.docker.com/r/microblink/api/).   

Also, this package has an Microblink API UI web component available as custom HTML tag `<mb-api-widget></mb-api-widget>` which has native camera management for mobile and desktop devices with WebRTC support and file management solution.

## Microblink API Proxy

To avoid the leaking of your credentials (Microblink API Authorization header = API key + API secret) by your visitors in the frontend Javascript application, your frontend application in the production environment should has an access to the backend proxy application and backend proxy application should append the authorization credentials, and also in this proxy application you could execute your additional business logic.

### Example implementation in Node.js Express application

Minimum proxy implementation which ensure the security for your credentials are available here https://github.com/microblink/microblink-api-proxy-example this example can be easily hosted at Webtask.io service in few minutes. More details about this example are available in this [README.md](https://github.com/microblink/microblink-api-proxy-example/blob/master/README.md)

