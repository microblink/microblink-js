import Microblink from '../src/microblink'

/**
 * Dummy test
 */
describe('Dummy test', () => {
  it('works if true is truthy', () => {
    expect(true).toBeTruthy()
  })

  it('Microblink class is instantiable', () => {
    expect(new Microblink()).toBeInstanceOf(Microblink)
  })

  it('Microblink class has method getData', () => {
    expect(new Microblink().getData).toBeTruthy()
    expect(new Microblink().getData()).toBe(true)
  })

  // it('Microblink class has method init', () => {
  //   expect(new Microblink().init).toBeTruthy()
  // })
})
