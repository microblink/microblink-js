const microblinkSDKListener = {
  onScanSuccess: (scanOutput) => {
    console.log('onScanSuccess callback', scanOutput);
  },
  onScanError: (err) => {
    console.error('onScanError callback', err);
  }
};

Microblink.SDK.RegisterListener(microblinkSDKListener);

Microblink.SDK.SetRecognizers(['MRTD', 'QR', 'VIN']);



Microblink.SDK.SendImage(scanInput, uploadProgress);