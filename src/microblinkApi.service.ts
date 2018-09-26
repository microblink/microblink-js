import { IMicroblinkApi } from './microblinkApi.interface'
import { Observable } from 'rxjs/internal/Observable'
import { Observer } from 'rxjs/internal/types'

const DEFAULT_ENDPOINT = 'https://api.microblink.com'

export default class MicroblinkApi implements IMicroblinkApi {
  private authorizationHeader = ''
  private endpoint: string

  constructor() {
    this.endpoint = DEFAULT_ENDPOINT
  }

  SetAuthorization(authorizationHeader: string): void {
    this.authorizationHeader = authorizationHeader
  }

  SetEndpoint(endpoint: string): void {
    this.endpoint = endpoint
  }

  Recognize(
    recognizers: string | string[],
    imageBase64: string,
    uploadProgress?: EventListener
  ): Observable<any> {
    return Observable.create((observer: Observer<any>) => {
      const body: any = {
        imageBase64: imageBase64
      }

      if (typeof recognizers === 'string') {
        body['recognizer'] = recognizers
      } else {
        body['recognizers'] = recognizers
      }

      const data = JSON.stringify(body)

      const xhr = new XMLHttpRequest()
      xhr.withCredentials = true
      xhr.open('POST', this.endpoint + '/recognize/execute')
      xhr.setRequestHeader('Content-Type', 'application/json')
      if (this.isAuthorizationHeaderValid) {
        xhr.setRequestHeader('Authorization', this.authorizationHeader)
      }

      xhr.addEventListener('readystatechange', function() {
        if (this.readyState === 4) {
          let data = null
          try {
            data = JSON.parse(this.responseText)
          } catch (err) {
            data = {
              error: 'Result is not parsable JSON',
              responseText: this.responseText
            }
          }

          observer.next(data)
          observer.complete()
        }
      })

      xhr.onerror = error => {
        observer.error(error)
      }

      if (uploadProgress) {
        xhr.upload.addEventListener('progress', uploadProgress, false)
      }

      xhr.send(data)
    })
  }

  private get isAuthorizationHeaderValid() {
    if (this.authorizationHeader.startsWith('Bearer ')) {
      return true
    }
    return false
  }
}
