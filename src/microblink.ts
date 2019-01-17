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
import {
  ScanInputFile,
  ScanInputFrame,
  ScanListener,
  ScanOutput,
  StatusCodes,
  ScanInputFrameWithQuality,
  ScanExchanger
} from './microblink.types'
import { FrameHelper } from './frameHelper'
import { ScanExchangeHelper } from './scanExchangeHelper'

export default class Microblink implements IMicroblink {
  private static fromHowManyFramesQualityCalculateBestFrame = 5

  private API: IMicroblinkApi
  private recognizers: string | string[] = []
  private listeners: ScanListener[] = []
  private scanFrameQueue: ScanInputFrameWithQuality[] = []

  constructor() {
    this.API = new MicroblinkApi()
  }

  /**
   * Terminate all active requests (pending responses)
   */
  TerminateActiveRequests(): void {
    this.API.TerminateAll()
    // Clear scan frame queue if it is not empty
    this.scanFrameQueue = []
  }

  /**
   * Register global success and/or error listener(s)
   */
  RegisterListener(scanListener: ScanListener): void {
    this.listeners.push(scanListener)
  }

  /**
   * Scan file and get result from subscribed observable
   */
  ScanFile(
    scanInputFile: ScanInputFile,
    uploadProgress?: EventListener | undefined
  ): Observable<ScanOutput> {
    return this.scan(scanInputFile.blob, true)
  }

  /**
   * Push file to SCAN queue, global listener(s) will handle the result
   */
  SendFile(scanInputFile: ScanInputFile, uploadProgress?: EventListener): void {
    // Call observable with empty callback because global listener will handle result
    // NOTE: error callback should be defined to handle Uncaught exception
    // tslint:disable-next-line:no-empty
    this.scan(scanInputFile.blob, true, uploadProgress).subscribe(() => {}, () => {})
  }

  /**
   * Push video frame to SCAN queue, global listener(s) will handle the result
   */
  SendFrame(scanInputFrame: ScanInputFrame): void {
    // Get frame quality estimatior
    const frameQuality = FrameHelper.getFrameQuality(scanInputFrame.pixelData)

    // Add the frame with quality to the scan queue
    this.scanFrameQueue.push({ frame: scanInputFrame, quality: frameQuality })

    // Skip finding of best frame if queue is not full with enough number of frames
    if (this.scanFrameQueue.length < Microblink.fromHowManyFramesQualityCalculateBestFrame) {
      return
    }

    // Find video frame with best quality
    let bestQuality = 0
    let bestFrame: ScanInputFrame | undefined
    this.scanFrameQueue.forEach(scanFrame => {
      if (scanFrame.quality > bestQuality) {
        bestQuality = scanFrame.quality
        bestFrame = scanFrame.frame
      }
    })

    // Clear scan frame queue
    this.scanFrameQueue = []

    if (bestFrame !== undefined) {
      // Call observable with empty callback because global listener will handle result
      // NOTE: error callback should be defined to handle Uncaught exception
      // tslint:disable-next-line:no-empty
      this.scan(bestFrame.blob, false).subscribe(() => {}, () => {})
    }
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
   * Change export images flag for next request
   * @param isExportImagesEnabled is flag which describes does API should return extracted images in next response
   */
  SetExportImages(isExportImagesEnabled: boolean): void {
    this.API.SetExportImages(isExportImagesEnabled)
  }

  /**
   * Set endpoint for next SCAN(s)
   * Default value is https://api.microblink.com/recognize
   * Endpoint should be changed when backend proxy which is credentials keeper is using as proxy between
   * Microblink SaaS API and frontend application which uses this library.
   */
  SetEndpoint(endpoint: string): void {
    this.API.SetEndpoint(endpoint)
  }

  /**
   * Set user identificator which will be stored with uploaded image
   * @param userId is any string which unique identifies user who use SDK and upload any image to API
   */
  SetUserId(userId: string): void {
    this.API.SetUserId(userId)
  }

  /**
   * When Authorization is not set it is available to disable persiting of uploaded data, by default it is enabled
   * this should be disabled for every page where GDPR is not implemented and this is ability to disable data persisting
   * on some demo pages
   * @param isEnabled is flag which describes should or should not API persist uploaded data, be default it is enabled
   */
  SetIsDataPersistingEnabled(isEnabled: boolean): void {
    this.API.SetIsDataPersistingEnabled(isEnabled)
  }

  /**
   * Notify all global listeners when success scan is complete
   */
  private notifyOnSuccessListeners(scanOutput: ScanOutput, isFileScan: boolean): void {
    const data: any = scanOutput.result.data
    let isSuccessfulResponse = false

    // check if it is fetched data array of results
    if (Array.isArray(data)) {
      data.forEach(resultItem => {
        if (resultItem.result) {
          isSuccessfulResponse = true
        }
      })
    } else {
      // otherwise it is returned result as object
      const result = data.result
      if (result) {
        isSuccessfulResponse = true
      }
    }

    // when success response is received then terminate active requests and return results
    if (isSuccessfulResponse || isFileScan) {
      // Active requests can only exists if it is video frame scan
      if (!isFileScan) {
        this.TerminateActiveRequests()
      }

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

    // Make silent if JSON is not prasable becaue this error will happen when request is aborted
    if (err.code === StatusCodes.ResultIsNotValidJSON) {
      return
    }

    this.listeners.forEach(listener => {
      if (listener.onScanError) {
        listener.onScanError(err)
      }
    })
  }

  /**
   * Execute scan on Microblink API service
   */
  private scan(
    blob: Blob,
    isFileScan: boolean,
    uploadProgress?: EventListener
  ): Observable<ScanOutput> {
    return Observable.create((observer: Observer<ScanOutput>) => {
      blobToBase64String(blob)
        .then(blobAsBase64String => {
          this.API.Recognize(this.recognizers, blobAsBase64String, uploadProgress).subscribe(
            result => {
              const output = { sourceBlob: blob, result: result }
              this.notifyOnSuccessListeners(output, isFileScan)
              observer.next(output)
              observer.complete()
            },
            err => {
              if (err) {
                this.notifyOnErrorListeners(err)
                observer.error(err)
              }
            }
          )
        })
        .catch(err => {
          this.notifyOnErrorListeners(err)
          observer.error(err)
        })
    })
  }

  /**
   * Create object for exchange data for scan between devices
   * @param data is object with optional data which will be added to the ScanExchanger object
   */
  CreateScanExchanger(data: ScanExchanger): Promise<ScanExchanger> {
    return ScanExchangeHelper.createScanExchanger(data)
  }
}
