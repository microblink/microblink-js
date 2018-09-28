export interface ScanInputFile {
  blob: Blob
}

export interface ScanInputFrame {
  blob: Blob
  pixelData: ImageData
}

export interface ScanOutput {
  sourceBlob: Blob
  result: any
}

export interface ScanListener {
  onScanSuccess?: Function
  onScanError?: Function
}
