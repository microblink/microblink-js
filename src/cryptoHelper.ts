import { AES, enc } from 'crypto-ts'

export class CryptoHelper {
  public static encrypt(data: any, secretKey: string): string {
    const originalText = JSON.stringify(data)
    const cipherText = AES.encrypt(originalText, secretKey).toString()
    return cipherText
  }

  public static decrypt(cipherText: string, secretKey: string): any {
    const bytes = AES.decrypt(cipherText, secretKey)
    const originalText = bytes.toString(enc.Utf8)
    const data = JSON.parse(originalText)
    return data
  }

  public static randomString(stringLength?: number): string {
    if (!stringLength) {
      stringLength = 128
    }
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'
    let randomString = ''
    for (let i = 0; i < stringLength; i++) {
      let rnum = Math.floor(Math.random() * chars.length)
      randomString += chars.substring(rnum, rnum + 1)
    }
    return randomString
  }
}
