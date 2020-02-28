import { Observable } from 'rxjs/internal/Observable'

export interface IMicroblinkApi {
  Recognize(
    recognizers: string | string[],
    imageBase64: string,
    uploadProgress?: EventListener
  ): Observable<any>

  SetAuthorization(authorizationHeader: string): void
  SetExportImages(exportImages: boolean | string | string[]): void
  SetExportFullDocumentImage(exportFullDocumentImage: boolean): void
  SetExportSignatureImage(exportSignatureImage: boolean): void
  SetExportFaceImage(exportFaceImage: boolean): void
  SetDetectGlare(detectGlare: boolean): void
  SetEndpoint(endpoint: string): void

  SetAnonymizeCardNumber(anonymizeCardNumber: boolean): void
  SetAnonymizeIban(anonymizeIban: boolean): void
  SetAnonymizeCvv(anonymizeCvv: boolean): void
  SetAnonymizeOwner(anonymizeOwner: boolean): void

  TerminateAll(): void

  SetUserId(userId: string): void
  SetIsDataPersistingEnabled(isEnabled: boolean): void
  SetAllowBlurFilter(allowBlurFilter: boolean): void

  SetAnonymizeNetherlandsMrz(anonymizeNetherlandsMrz: boolean): void
}
