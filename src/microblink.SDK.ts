import Microblink from './microblink'
import { Observable } from 'rxjs/internal/Observable'
import { ScanListener, ScanOutput, ScanInputFile, ScanInputFrame } from './microblink.SDK.types'
import { IMicroblink } from './microblink.interface'

/**
 * NOTE: This is public SDK API, rename of this functions will produce backward incompatible API!
 */

export namespace SDK {
  const SDK: IMicroblink = new Microblink()

  export function RegisterListener(scanListener: ScanListener): void {
    SDK.RegisterListener(scanListener)
  }

  export function SendImage(
    scanInput: ScanInputFile | ScanInputFrame,
    uploadProgress?: EventListener
  ): Observable<ScanOutput> {
    if (isScanInputFrame(scanInput)) {
      return SDK.SendFrame(scanInput as ScanInputFrame)
    } else {
      return SDK.SendFile(scanInput as ScanInputFile, uploadProgress)
    }
  }

  export function SetRecognizers(recognizers: string | string[]): void {
    SDK.SetRecognizers(recognizers)
  }

  export function SetAuthorization(authorizationHeader: string): void {
    SDK.SetAuthorization(authorizationHeader)
  }

  export function SetEndpoint(endpoint: string): void {
    SDK.SetEndpoint(endpoint)
  }

  export function TerminateRequest(): void {
    SDK.TerminateActiveRequests()
  }

  function isScanInputFrame(scanInput: ScanInputFile | ScanInputFrame) {
    return (scanInput as ScanInputFrame).pixelData !== undefined
  }
}
