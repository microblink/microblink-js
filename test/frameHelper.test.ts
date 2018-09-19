import { FrameHelper } from '../src/frameHelper'

describe('FrameHelper test', () => {
  it('class is instantiable', () => {
    expect(new FrameHelper()).toBeInstanceOf(FrameHelper)
  })

  it('has public static method getFrameQuality', () => {
    expect(FrameHelper.getFrameQuality).toBeTruthy()
  })

  it('has private static method getIntensity', () => {
    expect(FrameHelper['getIntensity']).toBeTruthy()
  })
})
