import { ScanExchanger } from './microblink.types'
import { CryptoHelper } from './cryptoHelper'

declare var window: any
declare var firebase: any

let firestore: any

// This should be in try/catch block because firebase could not be configured
// this is helper only for optional feature "Desktop to mobile"
try {
  firestore = firebase.firestore()
  const settings = { timestampsInSnapshots: true }
  firestore.settings(settings)
} catch (e) {}

export class ScanExchangeHelper {
  public static async createScanExchanger(data: ScanExchanger = {}): Promise<ScanExchanger> {
    // Get reference to the Firestore document
    const scan = firestore.collection(`scan`).doc()
    // Define default status
    data.status = 'STEP_1_REMOTE_CAMERA_IS_REQUESTED'
    // Generate random 32 long string
    data.key = CryptoHelper.randomString(32)
    // For easier scanId fetching append it tot the document
    const scanId = scan.id
    data.scanId = scanId
    // Encrypt authorizationHeader
    data.authorizationHeader = CryptoHelper.encrypt(data.authorizationHeader, data.key)
    // Wait until data is set
    await scan.set(data)
    // Return promise
    return scan
  }
}
