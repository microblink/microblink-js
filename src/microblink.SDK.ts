import Microblink from './microblink'
import { Observable } from 'rxjs/internal/Observable'

/**
 * NOTE: This is public SDK API, rename of this functions will produce backward incompatible API!
 */

export namespace SDK {
  const SDK = new Microblink()

  export function Scan(
    recognizers: string | string[],
    blob: Blob,
    uploadProgress?: EventListener
  ): Observable<any> {
    return SDK.Scan(recognizers, blob, uploadProgress)
  }

  export function SetAuthorization(authorizationHeader: string): void {
    SDK.SetAuthorization(authorizationHeader)
  }

  export function SetEndpoint(endpoint: string): void {
    SDK.SetEndpoint(endpoint)
  }
}
