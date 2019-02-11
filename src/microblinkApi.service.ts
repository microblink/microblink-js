import { IMicroblinkApi } from './microblinkApi.interface'
import { Observable } from 'rxjs/internal/Observable'
import { Observer } from 'rxjs/internal/types'
import { StatusCodes } from './microblink.types'

const DEFAULT_ENDPOINT = 'https://api.microblink.com'

/**
 * HTTP layer with Microblink API
 */
export default class MicroblinkApi implements IMicroblinkApi {
  private authorizationHeader = ''
  private isExportImagesEnabled = false
  private endpoint: string
  private activeRequests: XMLHttpRequest[] = []
  private userId: string = ''
  private isDataPersistingEnabled = true

  constructor() {
    this.endpoint = DEFAULT_ENDPOINT
  }

  /**
   * Terminate request session with aborting all pending responses
   */
  TerminateAll(): void {
    this.activeRequests.forEach(activeRequest => {
      activeRequest.abort()
    })
    // Clear array of all active requests when every request is terminated (aborted)
    this.activeRequests = []
  }

  /**
   * Change authorization header value
   */
  SetAuthorization(authorizationHeader: string): void {
    this.authorizationHeader = authorizationHeader
  }

  /**
   * Change export images flag for next request
   * @param isExportImagesEnabled is flag which describes does API should return extracted images in next response
   */
  SetExportImages(isExportImagesEnabled: boolean): void {
    this.isExportImagesEnabled = isExportImagesEnabled
  }

  /**
   * Change API endpoint
   * @param endpoint is API endpoint where Microblink API or Microblink API proxy is available
   */
  SetEndpoint(endpoint: string): void {
    this.endpoint = endpoint
  }

  /**
   * Set user identificator which will be stored with uploaded image
   * @param userId is any string which unique identifies user who use SDK and upload any image to API
   */
  SetUserId(userId: string): void {
    this.userId = userId
  }

  /**
   * When Authorization is not set it is available to disable persiting of uploaded data, by default it is enabled
   * this should be disabled for every page where GDPR is not implemented and this is ability to disable data persisting
   * on some demo pages
   * @param isEnabled is flag which describes should or should not API persist uploaded data, be default it is enabled
   */
  SetIsDataPersistingEnabled(isEnabled: boolean): void {
    this.isDataPersistingEnabled = isEnabled
  }

  /**
   * Execute remote recognition
   * @param recognizers is string or array of strings on which image will be processed
   * @param imageBase64 is Base64 encoded image which should contain document for processing
   * @param uploadProgress (optional) is XHR event listener for image upload to show upload progress bar on UI
   */
  Recognize(
    recognizers: string | string[],
    imageBase64: string,
    uploadProgress?: EventListener
  ): Observable<any> {
    return Observable.create((observer: Observer<any>) => {
      // Image should be as Base64 encoded file
      const body: any = {
        imageBase64: imageBase64
      }

      // Recognizers could be one defined as string or multiple defined as string array
      if (typeof recognizers === 'string') {
        body['recognizer'] = recognizers
      } else {
        body['recognizers'] = recognizers
      }

      // Export images flag set if it is enabled
      if (this.isExportImagesEnabled) {
        body['exportImages'] = true
      }

      // Set userId if it is defined
      if (this.userId) {
        body['userId'] = this.userId
      }

      // If it is set to FALSE then set disable data persisting flag
      if (this.isDataPersistingEnabled === false) {
        body['disableDataPersisting'] = true
      }

      // Body data should be send as stringified JSON and as Content-type=application/json
      const data = JSON.stringify(body)

      const xhr = new XMLHttpRequest()

      xhr.withCredentials = true
      if (uploadProgress) {
        // set timeout for file uploading
        xhr.timeout = 40000
      }
      xhr.open('POST', this.endpoint + '/recognize/execute')
      xhr.setRequestHeader('Content-Type', 'application/json')

      // When Authorization header is not set results will be masked on server-side
      if (this.isAuthorizationHeaderValid) {
        xhr.setRequestHeader('Authorization', this.authorizationHeader)
      }

      xhr.addEventListener('readystatechange', function() {
        if (this.readyState === 4) {
          let responseBody = null
          try {
            // Return result as parsed JSON object
            responseBody = JSON.parse(this.responseText)

            // OCR result will be available ony on status 200 OK, otherwise some problem is with backend or api key
            if (this.status === 200) {
              observer.next(responseBody)
              observer.complete()
            } else {
              observer.error(responseBody)
            }
          } catch (err) {
            if (uploadProgress && this.status === 0) {
              responseBody = {
                code: StatusCodes.TimedOut,
                message: 'Connection timed out. Please try again.'
              }
            } else {
              responseBody = {
                error: 'Result is not valid JSON',
                code: StatusCodes.ResultIsNotValidJSON,
                responseText: this.responseText
              }
            }
            observer.error(responseBody)
          }
        }
      })

      xhr.onerror = error => {
        observer.error(error)
      }

      if (uploadProgress) {
        xhr.upload.addEventListener('progress', uploadProgress, false)
      }

      xhr.send(data)

      // append the request to active stack
      this.activeRequests.push(xhr)
    })
  }

  /**
   * Authorization header offline validator, just check for Authorization header format before sending it to the API
   */
  private get isAuthorizationHeaderValid() {
    if (
      this.authorizationHeader.startsWith('Bearer ') ||
      this.authorizationHeader.startsWith('bearer ') ||
      this.authorizationHeader.startsWith('Basic ') ||
      this.authorizationHeader.startsWith('basic ')
    ) {
      return true
    }
    return false
  }
}
