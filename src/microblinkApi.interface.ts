import { Observable } from 'rxjs/internal/Observable'

export interface IMicroblinkApi {
  Recognize(
    recognizers: string | string[],
    imageBase64: string,
    uploadProgress?: EventListener
  ): Observable<any>

  SetAuthorization(authorizationHeader: string): void
  SetExportImages(isExportImagesEnabled: boolean): void
  SetEndpoint(endpoint: string): void

  TerminateAll(): void
}
