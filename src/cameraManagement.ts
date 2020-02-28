/**
 * Preferred type of camera to be used when opening the camera feed.
 */
export enum PreferredCameraType {
  /** Prefer back facing camera */
  BackFacingCamera,
  /** Prefer front facing camera */
  FrontFacingCamera
}

/**
 * Explanation why VideoRecognizer has failed to open the camera feed.
 */
export enum NotSupportedReason {
  /** navigator.mediaDevices.getUserMedia is not supported by current browser for current context. */
  MediaDevicesNotSupported = 'MediaDevicesNotSupported',
  /** Camera with requested features is not available on current device. */
  CameraNotFound = 'CameraNotFound',
  /** Camera access was not granted by the user. */
  CameraNotAllowed = 'CameraNotAllowed',
  /** Unable to start playing because camera is already in use. */
  CameraInUse = 'CameraInUse',
  /** Camera is currently not available due to a OS or hardware error. */
  CameraNotAvailable = 'CameraNotAvailable'
}

/**
 * The error object thrown when VideoRecognizer fails to open the camera feed.
 */
export class CameraManagerError extends Error {
  /** The reason why opening the camera failed. */
  readonly reason: NotSupportedReason

  constructor(reason: NotSupportedReason, ...params: any[]) {
    super(...params)
    this.reason = reason
    this.name = 'CameraManagerError'
  }
}

/**
 * Creates a new VideoRecognizer by opening a camera stream and attaching it to given HTMLVideoElement. If camera cannot be accessed,
 * the returned promise will be rejected.
 * @param cameraFeed HTMLVideoELement to which camera stream should be attached
 * @param preferredCameraType Whether back facing or front facing camera is preferred. Obeyed only if there is a choice (i.e. if device has only front-facing camera, the opened camera will be a front-facing camera, regardless of preference)
 */
export async function cameraManager(
  cameraFeed: HTMLVideoElement,
  preferredCameraType: PreferredCameraType = PreferredCameraType.BackFacingCamera
): Promise<HTMLVideoElement> {
  return new Promise<HTMLVideoElement>(async (resolve: any, reject: any) => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const selectedCamera = await selectCamera(preferredCameraType)

        if (selectedCamera == null) {
          reject(new CameraManagerError(NotSupportedReason.CameraNotFound))

          return
        }

        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            width: {
              min: 640,
              ideal: 1920,
              max: 1920
            },
            height: {
              min: 480,
              ideal: 1080,
              max: 1080
            }
          }
        }

        if (selectedCamera.deviceId === '') {
          ;(constraints.video as MediaTrackConstraints).facingMode = {
            ideal:
              preferredCameraType === PreferredCameraType.BackFacingCamera ? 'environment' : 'user'
          }
        } else {
          ;(constraints.video as MediaTrackConstraints).deviceId = {
            exact: selectedCamera.deviceId
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        cameraFeed.controls = false
        cameraFeed.srcObject = stream

        resolve(cameraFeed)
      } catch (error) {
        let errorReason = NotSupportedReason.CameraInUse
        switch (error.name) {
          case 'NotFoundError':
          case 'OverconstrainedError':
            errorReason = NotSupportedReason.CameraNotFound
            break
          case 'NotAllowedError':
          case 'SecurityError':
            errorReason = NotSupportedReason.CameraNotAllowed
            break
          case 'AbortError':
          case 'NotReadableError':
            errorReason = NotSupportedReason.CameraNotAvailable
            break
          case 'TypeError':
            throw error
        }

        reject(new CameraManagerError(errorReason, error.message))
      }
    } else {
      reject(new CameraManagerError(NotSupportedReason.MediaDevicesNotSupported))
    }
  })
}

// inspired by https://unpkg.com/browse/scandit-sdk@4.6.1/src/lib/cameraAccess.ts
const backCameraKeywords: string[] = [
  'rear',
  'back',
  'rück',
  'arrière',
  'trasera',
  'trás',
  'traseira',
  'posteriore',
  '后面',
  '後面',
  '背面',
  '后置', // alternative
  '後置', // alternative
  '背置', // alternative
  'задней',
  'الخلفية',
  '후',
  'arka',
  'achterzijde',
  'หลัง',
  'baksidan',
  'bagside',
  'sau',
  'bak',
  'tylny',
  'takakamera',
  'belakang',
  'אחורית',
  'πίσω',
  'spate',
  'hátsó',
  'zadní',
  'darrere',
  'zadná',
  'задня',
  'stražnja',
  'belakang',
  'बैक'
]

function isBackCameraLabel(label: string): boolean {
  const lowercaseLabel = label.toLowerCase()

  return backCameraKeywords.some(keyword => lowercaseLabel.includes(keyword))
}

async function selectCamera(
  preferredCameraType: PreferredCameraType
): Promise<MediaDeviceInfo | null> {
  let frontCameras: MediaDeviceInfo[] = []
  let backCameras: MediaDeviceInfo[] = []

  {
    let devices = await navigator.mediaDevices.enumerateDevices()
    // if permission is not given, label of video devices will be empty string
    if (
      devices.filter(device => device.kind === 'videoinput').every(device => device.label === '')
    ) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      })

      // enumerate devices again - now the label field should be non-empty, as we have a stream active (even if we didn't get persistent permission for camera)
      devices = await navigator.mediaDevices.enumerateDevices()

      // close the stream, as we don't need it anymore
      stream.getTracks().forEach(track => track.stop())
    }

    const cameras = devices.filter(device => device.kind === 'videoinput')
    for (let i in cameras) {
      const camera = cameras[i]

      if (isBackCameraLabel(camera.label)) {
        backCameras.push(camera)
      } else {
        frontCameras.push(camera)
      }
    }
  }

  if (frontCameras.length > 0 || backCameras.length > 0) {
    // decide from which array the camera will be selected
    let cameraPool: MediaDeviceInfo[] = backCameras.length > 0 ? backCameras : frontCameras

    // if there is at least one back facing camera and user prefers back facing camera, use that as a selection pool
    if (preferredCameraType === PreferredCameraType.BackFacingCamera && backCameras.length > 0) {
      cameraPool = backCameras
    }

    // if there is at least one front facing camera and user prefers front facing camera, use that as a selection pool
    if (preferredCameraType === PreferredCameraType.FrontFacingCamera && frontCameras.length > 0) {
      cameraPool = frontCameras
    }

    // otherwise use whichever pool is non-empty
    // sort camera pool by label
    cameraPool = cameraPool.sort((camera1, camera2) => camera1.label.localeCompare(camera2.label))

    // Check if cameras are labeled with resolution information, take the higher-resolution one in that case
    // Otherwise pick the first camera
    {
      let selectedCameraIndex = 0
      const cameraResolutions: number[] = cameraPool.map(camera => {
        const match = camera.label.match(/\b([0-9]+)MP?\b/i)
        if (match != null) {
          return parseInt(match[1], 10)
        } else {
          return NaN
        }
      })

      if (!cameraResolutions.some(cameraResolution => isNaN(cameraResolution))) {
        selectedCameraIndex = cameraResolutions.lastIndexOf(Math.max(...cameraResolutions))
      }

      return cameraPool[selectedCameraIndex]
    }
  } else {
    // no cameras available on the device
    return null
  }
}
