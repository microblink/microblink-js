import { Observable } from 'rxjs/internal/Observable'
import { ScanInputFile, ScanInputFrame, ScanListener, ScanOutput } from './microblink.SDK.types'

export interface IMicroblink {
  SendFile(scanInputFile: ScanInputFile, uploadProgress?: EventListener): Observable<ScanOutput>
  SendFrame(scanInputFrame: ScanInputFrame): Observable<ScanOutput>

  RegisterListener(scanListener: ScanListener): void

  SetRecognizers(recognizers: string | string[]): void
  SetAuthorization(authorizationHeader: string): void
  SetEndpoint(endpoint: string): void

  TerminateActiveRequests(): void
}
