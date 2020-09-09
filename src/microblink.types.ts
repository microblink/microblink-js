/**
 * Scan input image file
 */
export interface ScanInputFile {
  blob: Blob
}

/**
 * Scan input video frame
 */
export interface ScanInputFrame {
  blob: Blob
  pixelData: ImageData
  frameWidth: number
  frameHeight: number
}

/**
 * Scan input video frame with calculated frame quality
 */
export interface ScanInputFrameWithQuality {
  frame: ScanInputFrame
  quality: number
}

/**
 * Scan output with results from API
 */
export interface ScanOutput {
  sourceBlob: Blob | null
  result: any
}

/**
 * Scan global listener
 */
export interface ScanListener {
  onScanSuccess?: Function
  onScanError?: Function
}

/**
 * Library status codes
 */
export enum StatusCodes {
  Ok = 'OK',
  ResultIsNotValidJSON = 'RESULT_IS_NOT_VALID_JSON',
  TimedOut = 'CONNECTION_TIMED_OUT',
  NotFound = 'URL_NOT_FOUND'
}

/**
 * API boolean properties for extracting document images from document
 */
export enum ExportImageTypes {
  Face = 'exportFaceImage',
  FullDocument = 'exportFullDocumentImage',
  Signature = 'exportSignatureImage'
}

/**
 * Object which is exchanged over network (Firestore) between devices for feature "Desktop to mobile"
 * ("Use remote phone camera")
 */
export interface ScanExchanger {
  status?: string
  scanId?: string
  key?: string
  shortLink?: string
  recognizers?: string | string[]
  authorizationHeader?: string
  exportImages?: boolean | string | string[]
  exportFullDocumentImage?: boolean
  exportSignatureImage?: boolean
  exportFaceImage?: boolean
  detectGlare?: boolean
  allowBlurFilter?: boolean
  anonymizeCardNumber?: boolean
  anonymizeIban?: boolean
  anonymizeCvv?: boolean
  anonymizeOwner?: boolean
  endpoint?: string
  anonymizeNetherlandsMrz?: boolean
  saasIsActive?: boolean
}

export enum ScanExchangerCodes {
  Step01_RemoteCameraIsRequested = 'STEP_1_REMOTE_CAMERA_IS_REQUESTED',
  Step02_ExchangeLinkIsGenerated = 'STEP_2_EXCHANGE_LINK_IS_GENERATED',
  Step03_RemoteCameraIsPending = 'STEP_3_REMOTE_CAMERA_IS_PENDING',
  Step04_RemoteCameraIsOpen = 'STEP_4_REMOTE_CAMERA_IS_OPEN',
  Step05_ImageIsUploading = 'STEP_5_IMAGE_IS_UPLOADING',
  Step06_ImageIsProcessing = 'STEP_6_IMAGE_IS_PROCESSING',
  Step07_ResultIsAvailable = 'STEP_7_RESULT_IS_AVAILABLE',

  ErrorHappened = 'ERROR_HAPPENED'
}
