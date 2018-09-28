// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// import "core-js/fn/array.find"
// ...

// import { FrameHelper } from './frameHelper'
import { blobToBase64String } from 'blob-util'
import { IMicroblink } from './microblink.interface'
import { IMicroblinkApi } from './microblinkApi.interface'
import MicroblinkApi from './microblinkApi.service'
import { Observable } from 'rxjs/internal/Observable'
import { Observer } from 'rxjs/internal/types'
import { ScanInputFile, ScanInputFrame, ScanListener, ScanOutput } from './microblink.SDK.types'

export default class Microblink implements IMicroblink {
  private API: IMicroblinkApi
  private recognizers: string | string[] = []
  private listeners: ScanListener[] = []

  constructor() {
    this.API = new MicroblinkApi()
  }

  /**
   * Terminate all active requests (pending responses)
   */
  TerminateActiveRequests(): void {
    this.API.TerminateAll()
  }

  /**
   * Register global success and/or error listener(s)
   */
  RegisterListener(scanListener: ScanListener): void {
    this.listeners.push(scanListener)
  }

  /**
   * Push file to SCAN queue
   */
  SendFile(scanInputFile: ScanInputFile, uploadProgress?: EventListener): Observable<ScanOutput> {
    return this.scan(scanInputFile.blob, uploadProgress)
  }

  /**
   * Push video frame to SCAN queue
   */
  SendFrame(scanInputFrame: ScanInputFrame): Observable<ScanOutput> {
    // TODO: add frame quality estimatior
    return this.scan(scanInputFrame.blob)
  }

  /**
   * Set recognizers which will be used in next SCAN(s)
   */
  SetRecognizers(recognizers: string | string[]): void {
    this.recognizers = recognizers
  }

  /**
   * Set authorization header value to authorize with https://api.microblink.com/recognize
   */
  SetAuthorization(authorizationHeader: string): void {
    this.API.SetAuthorization(authorizationHeader)
  }

  /**
   * Set endpoint for next SCAN(s), by defuault https://api.microblink.com/recognize is using
   */
  SetEndpoint(endpoint: string): void {
    this.API.SetEndpoint(endpoint)
  }

  /**
   * Notify all global listeners when success scan is complete
   */
  private notifyOnSuccessListeners(scanOutput: ScanOutput): void {
    console.log('scanOutput', scanOutput)

    const result = scanOutput.result.data.result

    let isSuccessfulResponse = false

    if (Array.isArray(result)) {
      result.forEach(resultItem => {
        if (resultItem.result) {
          isSuccessfulResponse = true
        }
      })
    } else {
      if (result) {
        isSuccessfulResponse = true
      }
    }

    if (isSuccessfulResponse) {
      this.TerminateActiveRequests()

      this.listeners.forEach(listener => {
        if (listener.onScanSuccess) {
          listener.onScanSuccess(scanOutput)
        }
      })
    }
  }

  /**
   * Notify all global listeners when error happens, HTTP response status code is not equal to 200 or
   * base64 encode failed
   */
  private notifyOnErrorListeners(err: any): void {
    this.TerminateActiveRequests()

    this.listeners.forEach(listener => {
      if (listener.onScanError) {
        listener.onScanError(err)
      }
    })
  }

  /**
   * Execute scan with Microblink API service
   */
  private scan(blob: Blob, uploadProgress?: EventListener): Observable<ScanOutput> {
    return Observable.create((observer: Observer<ScanOutput>) => {
      blobToBase64String(blob)
        .then(blobAsBase64String => {
          this.API.Recognize(this.recognizers, blobAsBase64String, uploadProgress).subscribe(
            result => {
              const output = { sourceBlob: blob, result: result }
              this.notifyOnSuccessListeners(output)
              observer.next(output)
              observer.complete()
            },
            err => {
              this.notifyOnErrorListeners(err)
              observer.error(err)
            }
          )
        })
        .catch(err => {
          this.notifyOnErrorListeners(err)
          observer.error(err)
        })
    })
  }
}
