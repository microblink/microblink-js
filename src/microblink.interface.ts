import { Observable } from 'rxjs/internal/Observable'
import { ScanInputFile, ScanInputFrame, ScanListener, ScanOutput } from './microblink.types'

export interface IMicroblink {
  ScanFile(scanInputFile: ScanInputFile, uploadProgress?: EventListener): Observable<ScanOutput>

  SendFile(scanInputFile: ScanInputFile, uploadProgress?: EventListener): void
  SendFrame(scanInputFrame: ScanInputFrame): void

  RegisterListener(scanListener: ScanListener): void

  SetRecognizers(recognizers: string | string[]): void
  SetAuthorization(authorizationHeader: string): void
  SetEndpoint(endpoint: string): void

  TerminateActiveRequests(): void
}
