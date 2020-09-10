import { IMicroblinkApi } from './microblinkApi.interface'
import { Observable } from 'rxjs/internal/Observable'
import { Observer } from 'rxjs/internal/types'
import { StatusCodes } from './microblink.types'

//const DEFAULT_ENDPOINT = 'https://api.microblink.com'
const DEFAULT_ENDPOINT = 'http://localhost:8081'

/**
 * HTTP layer with Microblink API
 */
export default class MicroblinkApi implements IMicroblinkApi {
  private authorizationHeader = ''
  private exportImages: boolean | string | string[] = false
  private exportFullDocumentImage: boolean = false
  private exportSignatureImage: boolean = false
  private exportFaceImage: boolean = false
  private detectGlare: boolean = false
  private endpoint: string
  private anonymizeCardNumber: boolean = false
  private anonymizeIban: boolean = false
  private anonymizeCvv: boolean = false
  private anonymizeOwner: boolean = false
  private allowBlurFilter: boolean = false
  private anonymizeNetherlandsMrz: boolean = false
  private activeRequests: XMLHttpRequest[] = []
  private userId: string = ''
  private isDataPersistingEnabled = true
  private saasIsActive: boolean = false

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
   * Change which images to export for next request
   * @param exportImages is either a boolean flag which describes whether API should return extracted images in next response or an array of API properties
   */
  SetExportImages(exportImages: boolean | string | string[]): void {
    this.exportImages = exportImages
  }

  /**
   * Change which images to export for next request
   * @param exportFullDocumentImage is a boolean flag which describes whether API should return extracted full document image in next response
   */
  SetExportFullDocumentImage(exportFullDocumentImage: boolean): void {
    this.exportFullDocumentImage = exportFullDocumentImage
  }

  /**
   * Change which images to export for next request
   * @param exportSignatureImage is a boolean flag which describes whether API should return extracted signature image in next response
   */
  SetExportSignatureImage(exportSignatureImage: boolean): void {
    this.exportSignatureImage = exportSignatureImage
  }

  /**
   * Change which images to export for next request
   * @param exportFaceImage is a boolean flag which describes whether API should return extracted face image in next response
   */
  SetExportFaceImage(exportFaceImage: boolean): void {
    this.exportFaceImage = exportFaceImage
  }

  /**
   * Set detect glare option for next request
   * @param detectGlare is a boolean flag which describes whether API should return null for image segments where glare is detected
   */
  SetDetectGlare(detectGlare: boolean): void {
    this.detectGlare = detectGlare
  }

  /**
   * Set allow blur filter option for next request
   * @param allowBlurFilter is a boolean flag which describes whether API should return null for image segments where blur is detected
   */
  SetAllowBlurFilter(allowBlurFilter: boolean): void {
    this.allowBlurFilter = allowBlurFilter
  }

  /**
   * Change API endpoint
   * @param endpoint is API endpoint where Microblink API or Microblink API proxy is available
   */
  SetEndpoint(endpoint: string): void {
    this.endpoint = endpoint
  }

  /**
   * Set anonymize card number (works on BLINK_CARD recognizer) for next request
   * @param anonymizeCardNumber is a boolean flag which describes whether API should return a base64 image of the scanned card with the card number anonymized
   */
  SetAnonymizeCardNumber(anonymizeCardNumber: boolean): void {
    this.anonymizeCardNumber = anonymizeCardNumber
  }

  /**
   * Set anonymize card number (works on BLINK_CARD recognizer) for next request
   * @param anonymizeIbanNumber is a boolean flag which describes whether API should return a base64 image of the scanned card with the card number anonymized
   */
  SetAnonymizeIban(anonymizeIban: boolean): void {
    this.anonymizeIban = anonymizeIban
  }

  /**
   * Set anonymize cvv (works on BLINK_CARD recognizer) for next request
   * @param anonymizeCvv is a boolean flag which describes whether API should return a base64 image of the scanned card with the cvv number anonymized
   */
  SetAnonymizeCvv(anonymizeCvv: boolean): void {
    this.anonymizeCvv = anonymizeCvv
  }

  /**
   * Set anonymize owner (works on BLINK_CARD recognizer) for next request
   * @param anonymizeOwner is a boolean flag which describes whether API should return a base64 image of the scanned card with the owner name anonymized
   */
  SetAnonymizeOwner(anonymizeOwner: boolean): void {
    this.anonymizeOwner = anonymizeOwner
  }

  /**
   * Set user identificator which will be stored with uploaded image
   * @param userId is any string which unique identifies user who use SDK and upload any image to API
   */
  SetUserId(userId: string): void {
    this.userId = userId
  }

  /**
   * When Authorization is not set it is available to disable persisting of uploaded data, by default it is enabled
   * this should be disabled for every page where GDPR is not implemented and this is ability to disable data persisting
   * on some demo pages
   * @param isEnabled is flag which describes should or should not API persist uploaded data, be default it is enabled
   */
  SetIsDataPersistingEnabled(isEnabled: boolean): void {
    this.isDataPersistingEnabled = isEnabled
  }

  /**
   * Set anonymize netherlandsMrz (works on BLINK_CARD recognizer) for next request
   * @param anonymizeNetherlandsMrz is a boolean flag which describes whether API should return a base64 image of the scanned card with the netherlands MRZ anonymized
   */
  SetAnonymizeNetherlandsMrz(anonymizeNetherlandsMrz: boolean): void {
    this.anonymizeNetherlandsMrz = anonymizeNetherlandsMrz
  }

  ActivateSaaS(activateSaaS: boolean): void {
    this.saasIsActive = activateSaaS
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
    return new Observable((observer: Observer<any>) => {
      // Image should be as Base64 encoded file
      let body: any = {}
      if (this.saasIsActive) {
        body = { imageSource: imageBase64 }
      } else {
        body = { imageBase64: imageBase64 }
      }

      // Recognizers could be one defined as string or multiple defined as string array
      if (typeof recognizers === 'string') {
        body['recognizer'] = recognizers
      } else {
        body['recognizers'] = recognizers
      }

      // Export images flag set if it is enabled
      if (this.exportImages) {
        body['exportImages'] = this.exportImages
      }

      // Export full document image flag set if it is enabled
      if (this.exportFullDocumentImage) {
        body['exportFullDocumentImage'] = true
      }

      // Export signature image flag set if it is enabled
      if (this.exportSignatureImage) {
        body['exportSignatureImage'] = true
      }

      // Export face image flag set if it is enabled
      if (this.exportFaceImage) {
        body['exportFaceImage'] = true
      }

      // Detect glare flag set if it is enabled
      if (this.detectGlare) {
        body['detectGlare'] = true
      }

      // Detect blur flag set if it is enabled
      if (this.allowBlurFilter) {
        body['allowBlurFilter'] = true
      }

      // Anonymize card number flag set if it is enabled
      if (this.anonymizeCardNumber) {
        body['anonymizeCardNumber'] = true
      }

      // Anonymize IBAN number flag set if it is enabled
      if (this.anonymizeIban) {
        body['anonymizeIban'] = true
      }

      // Anonymize cvv flag set if it is enabled
      if (this.anonymizeCvv) {
        body['anonymizeCvv'] = true
      }

      // Anonymize owner set if it is enabled
      if (this.anonymizeOwner) {
        body['anonymizeOwner'] = true
      }

      // Set userId if it is defined
      if (this.userId) {
        body['userId'] = this.userId
      }

      // If it is set to FALSE then set disable data persisting flag
      if (this.isDataPersistingEnabled === false) {
        body['disableDataPersisting'] = true
      }

      // If it is set to FALSE then set disable data persisting flag
      if (this.anonymizeNetherlandsMrz) {
        body['anonymizeNetherlandsMrz'] = true
      }

      // Body data should be send as stringified JSON and as Content-type=application/json
      const data = JSON.stringify(body)

      const xhr = new XMLHttpRequest()

      xhr.withCredentials = true
      if (uploadProgress) {
        // FIX: timeout should not be set, because some client can have really slow uplink
        // set timeout for file uploading
        xhr.timeout = 40000
      }

      if (this.saasIsActive) {
        let route = ''
        switch (recognizers) {
          case 'BLINK_ID':
            route = '/blinkid'
            break
          case 'ID_BARCODE':
            route = '/id-barcode'
            break
          case 'MRTD':
            route = '/mrtd'
            break
          case 'PASSPORT':
            route = '/passport'
            break
          case 'VISA':
            route = '/visa'
            break
          case 'MRZ_ID':
            route = '/mrz-id'
            break
          default:
            observer.error(
              'Selected recognizer not recognized. Please make sure that recognizer is still available and is passed as string argument.'
            )
        }

        xhr.open('POST', this.endpoint + '/v1/recognizers' + route)
      } else {
        xhr.open('POST', this.endpoint + '/recognize/execute')
      }

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
            if (this.status === 0) {
              responseBody = {
                code: StatusCodes.NotFound,
                message:
                  'Please first check your endpoint URL and try again. If using our Cloud API check if SDK setup is correct. Also check our Codepen example.'
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

      xhr.ontimeout = () => {
        let responseBody = null
        responseBody = {
          code: StatusCodes.TimedOut,
          message: 'Connection timed out. Please try again.'
        }
        observer.error(responseBody)
      }

      if (uploadProgress) {
        xhr.upload.addEventListener('progress', uploadProgress, false)
        xhr.upload.addEventListener('load', uploadProgress, false)
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
