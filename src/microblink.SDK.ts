import Microblink from './microblink'
import { Observable } from 'rxjs/internal/Observable'
import {
  ScanListener,
  ScanOutput,
  ScanInputFile,
  ScanInputFrame,
  StatusCodes as statusCodes
} from './microblink.SDK.types'
import { IMicroblink } from './microblink.interface'

/**
 * Helper for detecting ScanInputFrame type
 */
function IsScanInputFrame(scanInput: ScanInputFile | ScanInputFrame): boolean {
  return !!(scanInput as ScanInputFrame).pixelData
}

/**
 * NOTE: This is public SDK API, rename of this functions will produce backward incompatible API!
 */

export namespace SDK {
  const SDK: IMicroblink = new Microblink()

  /**
   * Scan image and get result from subscribed observable
   */
  export function ScanImage(
    scanInput: ScanInputFile,
    uploadProgress?: EventListener
  ): Observable<ScanOutput> {
    return SDK.ScanFile(scanInput, uploadProgress)
  }

  /**
   * Register global listener success and/or error callback
   */
  export function RegisterListener(scanListener: ScanListener): void {
    SDK.RegisterListener(scanListener)
  }

  /**
   * Push image (file or video frame) to scanning queue, results will be handled by global listener(s)
   */
  export function SendImage(
    scanInput: ScanInputFile | ScanInputFrame,
    uploadProgress?: EventListener
  ): void {
    if (IsScanInputFrame(scanInput)) {
      return SDK.SendFrame(scanInput as ScanInputFrame)
    } else {
      return SDK.SendFile(scanInput as ScanInputFile, uploadProgress)
    }
  }

  /**
   * Set recognizers which will be used in next request
   */
  export function SetRecognizers(recognizers: string | string[]): void {
    SDK.SetRecognizers(recognizers)
  }

  /**
   * Set authorization header which will be used in next request
   */
  export function SetAuthorization(authorizationHeader: string): void {
    SDK.SetAuthorization(authorizationHeader)
  }

  /**
   * Set HTTP API endpoint for next request
   */
  export function SetEndpoint(endpoint: string): void {
    SDK.SetEndpoint(endpoint)
  }

  /**
   * Terminate all queued HTTP requests.
   * This is useful when images are sending from camera video stream in ms time periods and when successful
   * result is received then all pending requests could be terminated, this should be primary used for application
   * performance improvements, to break all HTTP connections which will return redundant results
   */
  export function TerminateRequest(): void {
    SDK.TerminateActiveRequests()
  }

  /**
   * Get all SDK status codes
   */
  export const StatusCodes = statusCodes
}
