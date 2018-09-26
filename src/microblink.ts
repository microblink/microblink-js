// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// import "core-js/fn/array.find"
// ...

import { FrameHelper } from './frameHelper'
import { blobToBase64String } from 'blob-util'
import { IMicroblink } from './microblink.interface'
import { IMicroblinkApi } from './microblinkApi.interface'
import MicroblinkApi from './microblinkApi.service'
import { Observable } from 'rxjs/internal/Observable'
import { Observer } from 'rxjs/internal/types'

export default class Microblink implements IMicroblink {
  private API: IMicroblinkApi

  constructor() {
    this.API = new MicroblinkApi()
  }

  Scan(
    recognizers: string | string[],
    blob: Blob,
    uploadProgress?: EventListener
  ): Observable<any> {
    return Observable.create((observer: Observer<any>) => {
      blobToBase64String(blob)
        .then(base64String => {
          this.API.Recognize(recognizers, base64String, uploadProgress).subscribe(
            result => {
              observer.next(result)
              observer.complete()
            },
            err => {
              observer.error(err)
            }
          )
        })
        .catch(err => {
          observer.error(err)
        })
    })
  }

  SetAuthorization(authorizationHeader: string): void {
    this.API.SetAuthorization(authorizationHeader)
  }
  SetEndpoint(endpoint: string): void {
    this.API.SetEndpoint(endpoint)
  }
}
