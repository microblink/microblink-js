import { Observable } from 'rxjs/internal/Observable'

export interface IMicroblink {
  Scan(recognizers: string | string[], blob: Blob, uploadProgress?: EventListener): Observable<any>
  SetAuthorization(authorizationHeader: string): void
  SetEndpoint(endpoint: string): void
}
