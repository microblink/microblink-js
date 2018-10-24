Test Microblink UI web component with your passport or US drivers license. Only `MRTD` and `USDL` recognizers are enabled for this demo.  

NOTE: all results are masked and uploaded data is not persisting on the API when Authorization is not provided. If you want to get unmasked results then you should provide Authorization (API key and API secret) which you can generate at the [Microblink's dashboard](https://microblink.com/customer/api).

<style>
.demo-resp-iframe {
    width: 100%;
    border: 0;
    min-height: 545px;
    margin: 0;
    box-sizing: border-box;
    overflow: hidden;
}
</style>

<iframe class="demo-resp-iframe" src="demo.html" gesture="media" allow="encrypted-media" allowfullscreen></iframe>

```
<script>
  // #1
  //Microblink.SDK.SetEndpoint('https://api.microblink.com');

  // #2
  //Microblink.SDK.SetAuthorization('Bearer ...');

  // #3
  Microblink.SDK.SetRecognizers(['MRTD', 'USDL']);

  // #4
  Microblink.SDK.SetIsDataPersistingEnabled(false);
</script>
```

**&#35;1**  
This is the default value and it is able to access Microblink endpoint directly (recommended only for development) but in the production this should be proxied with your backend application.

**&#35;2**  
Please generate your API key and secret here: https://microblink.com/customer/api

**&#35;3**  
You can set array of available recognizers: 'MRTD', 'USDL', 'PDF417', 'CODE128', 'CODE39', 'AZTEC', 'DATA_MATRIX', 'EAN13', 'EAN8', 'ITF', 'QR', 'UPCA', 'UPCE', 'UAE_ID_FRONT', 'UAE_ID_BACK', 'UAE_DL_FRONT', 'VIN', 'SIM', 'CYP_ID_FRONT', 'CYP_ID_BACK', 'CRO_ID_FRONT', 'CRO_ID_BACK', 'KWT_ID_FRONT', 'KWT_ID_BACK', 'ESP_DL_FRONT'  
NOTE: providing more recognizers extends waiting time from the API because OCR engine will execute recognize process on more recognizers, please provide only these recognizers for which kind you are uploading documents.

**&#35;4**  
This demo app is GDPR complained and it does not store any data on the API backend service when Authorization is not provided.
