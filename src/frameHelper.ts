/**
 * Helper for get detailed information from the frame of the image as RAW pixels array, with defined width and height
 */
export class FrameHelper {
  /**
   * Get frame quality
   * @param pixelData is ImageData from `canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height)`
   */
  public static getFrameQuality(pixelData: ImageData): number {
    return this.calculateFrameQuality(pixelData.data, pixelData.width, pixelData.height)
  }

  /**
   * Calculate frame quality
   * @param rgbaImgData is an RGB array (3n)=>RED, (3n+1)=>GREEN, (3n+2)=>BLUE, where n is pixel index in 2D grid
   * @param width is the frame horizontal dimension in pixels
   * @param height is the frame vertical dimension in pixels
   */
  private static calculateFrameQuality(
    rgbaImgData: Uint8ClampedArray,
    width: number,
    height: number
  ): number {
    const vertScanLineNum = 28
    const horizScanLineNum = 20
    let totalStrength = 0
    let sampleNum = 0

    for (let i = 0; i < vertScanLineNum; i++) {
      const distance = parseInt((width / (vertScanLineNum + 1)).toString(), 10)
      const col = parseInt((distance * i + distance / 2).toString(), 10)

      for (let row = 1; row < height - 1; row++) {
        const curPixel = this.getIntensity(rgbaImgData, row, col, width)
        const prevPixel = this.getIntensity(rgbaImgData, row - 1, col, width)
        const nextPixel = this.getIntensity(rgbaImgData, row + 1, col, width)

        const lastDiff = prevPixel - curPixel
        const currDiff = curPixel - nextPixel
        const secondDiff = currDiff - lastDiff
        sampleNum += 1
        totalStrength += secondDiff * secondDiff
      }
    }

    for (let i = 0; i < horizScanLineNum; i++) {
      const distance = parseInt((height / (horizScanLineNum + 1)).toString(), 10)
      const row = parseInt((distance * i + distance / 2).toString(), 10)

      for (let col = 1; col < width - 1; col++) {
        const curPixel = this.getIntensity(rgbaImgData, row, col, width)
        const prevPixel = this.getIntensity(rgbaImgData, row, col - 1, width)
        const nextPixel = this.getIntensity(rgbaImgData, row, col + 1, width)

        const lastDiff = prevPixel - curPixel
        const currDiff = curPixel - nextPixel
        const secondDiff = currDiff - lastDiff
        sampleNum += 1
        totalStrength += secondDiff * secondDiff
      }
    }

    let res = totalStrength / sampleNum
    let qratio = parseFloat((width * height).toString()) / (640.0 * 480.0)

    if (qratio > 1.0) {
      if (qratio > 10.0) qratio = 10.0
      res /= qratio
    } else {
      res *= qratio
    }

    return res
  }

  /**
   * Get pixel intensity
   * @param rgbaImgData is an RGB array (3n)=>RED, (3n+1)=>GREEN, (3n+2)=>BLUE, where n is pixel index in 2D grid
   * @param row is an row of the pixel in the frame
   * @param col is na column of the pixel in the frame
   * @param width is the frame horizontal dimension in pixels
   */
  private static getIntensity(
    rgbaImgData: Uint8ClampedArray,
    row: number,
    col: number,
    width: number
  ): number {
    const baseIdx = (row * width + col) * 4

    const r = rgbaImgData[baseIdx]
    const g = rgbaImgData[baseIdx + 1]
    const b = rgbaImgData[baseIdx + 2]

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
}
