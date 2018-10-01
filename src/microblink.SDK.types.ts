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
  ResultIsNotValidJSON = 'RESULT_IS_NOT_VALID_JSON'
}

/**
 * Helper for detecting ScanInputFrame type
 */
export function IsScanInputFrame(scanInput: ScanInputFile | ScanInputFrame): boolean {
  return (scanInput as ScanInputFrame).pixelData !== undefined
}
