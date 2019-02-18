import { ScanExchanger, ScanExchangerCodes } from './microblink.types'

declare var firebase: any
declare var QRCode: any

const FIRESTORE_COLLECTION_ID = 'scans'

// This should be in try/catch block because firebase could not be configured
// this is helper only for optional feature "Desktop to mobile"
try {
  // NOTE: avoid use of shortcut `firestore` instead of `firebase.firestore()` beacause this produce error in
  // Codepen and jsFiddle environment!
  const settings = { timestampsInSnapshots: true }
  firebase.firestore().settings(settings)
} catch (e) {
  /* tslint:disable:no-empty */
}

export class ScanExchangeHelper {
  /**
   * Create Firestore object for scan data exchanging
   * @param data is optional object with data which will be added to the created Firestore object
   */
  public static async createScanExchanger(data: ScanExchanger = {}): Promise<ScanExchanger> {
    // Get reference to the Firestore document
    const scan = firebase
      .firestore()
      .collection(FIRESTORE_COLLECTION_ID)
      .doc()
    // Define default status STEP_01...
    data.status = ScanExchangerCodes.Step01_RemoteCameraIsRequested
    // For easier scanId fetching append it to the document
    data.scanId = scan.id
    // Wait until data is set
    await scan.set(data)
    // Return promise
    return scan
  }

  /**
   * Generate QR code as base64 image for specific URL
   * @param url is string
   */
  public static async generateQRCode(url: string): Promise<string> {
    let qrCodeAsBase64 = null

    // Dependency to https://github.com/soldair/node-qrcode is required!
    // If `QRCode` is not available or any error happened then skip creating of QRCode
    try {
      qrCodeAsBase64 = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 1024,
        margin: 4
      })
    } catch (err) {
      /* tslint:disable:no-empty */
    }

    return qrCodeAsBase64
  }
}
