// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// import "core-js/fn/array.find"
// ...

import { FrameHelper } from './frameHelper'

export default class Microblink {
  public init() {
    FrameHelper.getFrameQuality(new Array(), 1, 2)
  }
}
