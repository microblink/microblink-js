import Microblink from './microblink'
import { Observable } from 'rxjs/internal/Observable'
import {
  ScanListener,
  ScanOutput,
  ScanInputFile,
  ScanInputFrame,
  StatusCodes as statusCodes,
  ScanExchanger,
  ScanExchangerCodes as scanExchangerCodes,
  ExportImageTypes as exportImageTypes
} from './microblink.SDK.types'
import { IMicroblink } from './microblink.interface'
import { CryptoHelper } from './cryptoHelper'

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
   * Get recognizers which are defined in the SDK
   */
  // export function GetRecognizers(): string | string[] {
  //   return SDK.GetRecognizers()
  // }

  /**
   * Set authorization header which will be used in next request
   * @param authorizationHeader is authorization header with apiKey and apiSecret which should be generated
   * here: https://microblink.com/customer/api
   */
  export function SetAuthorization(authorizationHeader: string): void {
    SDK.SetAuthorization(authorizationHeader)
  }

  /**
   * Get authorization header which is defined in the SDK
   */
  export function GetAuthorization(): string {
    return SDK.GetAuthorization()
  }

  /**
   * Change which images to export for next request
   * @param exportImages is either a boolean flag which describes whether API should return extracted images in next response or an array of API properties
   */
  export function SetExportImages(exportImages: boolean | string | string[]): void {
    SDK.SetExportImages(exportImages)
  }

  /**
   * Change which images to export for next request
   * @param exportFullDocumentImage is a boolean flag which describes whether API should return extracted full document image in next response
   */
  export function SetExportFullDocumentImage(exportFullDocumentImage: boolean): void {
    SDK.SetExportFullDocumentImage(exportFullDocumentImage)
  }

  /**
   * Change which images to export for next request
   * @param exportSignatureImage is a boolean flag which describes whether API should return extracted signature image in next response
   */
  export function SetExportSignatureImage(exportSignatureImage: boolean): void {
    SDK.SetExportSignatureImage(exportSignatureImage)
  }

  /**
   * Change which images to export for next request
   * @param exportFaceImage is a boolean flag which describes whether API should return extracted face image in next response
   */
  export function SetExportFaceImage(exportFaceImage: boolean): void {
    SDK.SetExportFaceImage(exportFaceImage)
  }

  /**
   * Set detect glare option for next request
   * @param detectGlare is a boolean flag which describes whether API should return null for image segments where glare is detected
   */
  export function SetDetectGlare(detectGlare: boolean): void {
    SDK.SetDetectGlare(detectGlare)
  }

  /**
   * Set allow blur filter option for next request
   * @param allowBlurFilter is a boolean flag which describes whether API should return null for image segments where blur is detected
   */
  export function SetAllowBlurFilter(allowBlurFilter: boolean): void {
    SDK.SetAllowBlurFilter(allowBlurFilter)
  }

  /**
   * Set HTTP API endpoint for next request
   */
  export function SetEndpoint(endpoint: string): void {
    SDK.SetEndpoint(endpoint)
  }

  /**
   * Set anonymize card number (works on BLINK_CARD recognizer) for next request
   * @param anonymizeCardNumber is a boolean flag which describes whether API should return a base64 image of the scanned card with the card number anonymized
   */
  export function SetAnonymizeCardNumber(anonymizeCardNumber: boolean): void {
    SDK.SetAnonymizeCardNumber(anonymizeCardNumber)
  }

  /**
   * Set anonymize IBAN (works on BLINK_CARD recognizer) for next request
   * @param anonymizeIbanNumber is a boolean flag which describes whether API should return a base64 image of the scanned card with the card number anonymized
   */
  export function SetAnonymizeIban(anonymizeIban: boolean): void {
    SDK.SetAnonymizeIban(anonymizeIban)
  }

  /**
   * Set anonymize cvv (works on BLINK_CARD recognizer) for next request
   * @param anonymizeCvv is a boolean flag which describes whether API should return a base64 image of the scanned card with the cvv number anonymized
   */
  export function SetAnonymizeCvv(anonymizeCvv: boolean): void {
    SDK.SetAnonymizeCvv(anonymizeCvv)
  }

  /**
   * Set anonymize owner (works on BLINK_CARD recognizer) for next request
   * @param anonymizeOwner is a boolean flag which describes whether API should return a base64 image of the scanned card with the owner name anonymized
   */
  export function SetAnonymizeOwner(anonymizeOwner: boolean): void {
    SDK.SetAnonymizeOwner(anonymizeOwner)
  }

  /**
   * Set anonymize netherlandsMrz (works on BLINK_CARD recognizer) for next request
   * @param anonymizeNetherlandsMrz is a boolean flag which describes whether API should return a base64 image of the scanned card with the netherlands MRZ anonymized
   */
  export function SetAnonymizeNetherlandsMrz(anonymizeNetherlandsMrz: boolean): void {
    SDK.SetAnonymizeNetherlandsMrz(anonymizeNetherlandsMrz)
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
   * Set unique user ID which will be stored with uploaded image to associate image with user who uploaded the image
   * @param userId is string user identificator, recommended it to be an user's email because when delete request is sent by this email, all images associated with this email will be permanentally removed if it is stored on upload, not every image will be stored, this depends on other API key options
   */
  export function SetUserId(userId: string): void {
    SDK.SetUserId(userId)
  }

  /**
   * When Authorization is not set it is available to disable persiting of uploaded data, by default it is enabled
   * this should be disabled for every page where GDPR is not implemented and this is ability to disable data persisting
   * on some demo pages
   * @param isEnabled is flag which describes should or should not API persist uploaded data, be default it is enabled
   */
  export function SetIsDataPersistingEnabled(isEnabled: boolean): void {
    SDK.SetIsDataPersistingEnabled(isEnabled)
  }

  /**
   * Get all SDK status codes
   */
  export const StatusCodes = statusCodes

  /**
   * Create object to exchange data between devices
   * @param data is object with ScanExchanger structure
   */
  export function CreateScanExchanger(
    data: ScanExchanger = {},
    onUpdate: (data: ScanExchanger) => void
  ): any {
    return SDK.CreateScanExchanger(data, onUpdate)
  }

  /**
   * Get all Scan exchanger status codes
   */
  export const ScanExchangerCodes = scanExchangerCodes

  /**
   * Get all export image types
   */
  export const ExportImageTypes = exportImageTypes

  /**
   * Decrypt protected object
   * @param dataEncrypted is encrypted object as string
   * @param key is secret key with which data will be decrypted
   */
  export function Decrypt(dataEncrypted: string, key: string) {
    return CryptoHelper.decrypt(dataEncrypted, key)
  }

  /**
   * Protect plain object
   * @param data is plain object
   * @param key us secret key with which data will be encrypted
   */
  export function Encrypt(data: any, key: string) {
    return CryptoHelper.encrypt(data, key)
  }

  /**
   * Check if all requirements for desktop-to-mobile feature are available
   */
  export async function IsDesktopToMobileAvailable(): Promise<boolean> {
    return SDK.IsDesktopToMobileAvailable()
  }

  /**
   * Check if any recognizer is set in the recognizers array
   */
  export function IsRecognizerArraySet(): boolean {
    return SDK.IsRecognizerArraySet()
  }

  /**
   * Manually activate Cloud API feature from outside
   */
  export function UseCloudAPI(): void {
    SDK.ActivateSaaS(true)
  }

  /**
   * Set up complete request for specific recognizer
   */
  export function SetupRecognizerRequest(recognizer: string, useDemo?: string): void {
    const baseURL =
      useDemo && useDemo === 'demo'
        ? 'https://demoapi.microblink.com/v1/recognizers'
        : 'https://api.microblink.com/v1/recognizers'
    let endpoint = ''

    switch (recognizer) {
      case 'BLINK_ID':
        endpoint = baseURL + '/blinkid'
        break
      case 'ID_BARCODE':
        endpoint = baseURL + '/id-barcode'
        break
      case 'MRTD':
        endpoint = baseURL + '/mrtd'
        break
      case 'PASSPORT':
        endpoint = baseURL + '/passport'
        break
      case 'VISA':
        endpoint = baseURL + '/visa'
        break
      case 'MRZ_ID':
        endpoint = baseURL + '/mrz-id'
        break
    }

    SDK.SetRecognizers(recognizer)
    SDK.SetEndpoint(endpoint)
    SDK.ActivateSaaS(true)
  }
}
