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
  sourceBlob: Blob
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
  TimedOut = 'CONNECTION_TIMED_OUT'
}

/**
 * Object which is exchanged over network (Firestore) between devices for feature "Desktop to mobile"
 * ("Use remote phone camera")
 */
export interface ScanExchanger {
  scanId?: string
  key?: string
  shortLink?: string
}
