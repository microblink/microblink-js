Test [Microblink UI web component](https://github.com/microblink/microblink-js) with your passport or US drivers license. Only `MRTD` and `USDL` recognizers are enabled in this demo.  

To enable more recognizers open component's debugging console (mouse right click on component and select `Inspect element`, then select `Console` tab) and set recognizers with `Microblink.SDK.SetRecognizers([])`  

Up to date list of available recognizers are available here: [https://api.microblink.com/recognize/info](https://api.microblink.com/recognize/info)  

NOTE: all results are masked and uploaded data is not persisting on the API when `Authorization` header is not provided. If you want to get unmasked results then you should provide `Authorization` header (API key and API secret) which you can generate at the [Microblink's dashboard](https://microblink.com/customer/api).  

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
This is the default value and it is able to access Microblink API endpoint directly (recommended only for development) but in the production this should be [proxied](https://github.com/microblink/microblink-js#microblink-api-proxy) with your backend application.

**&#35;2**  
Please generate your API key and secret here: https://microblink.com/customer/api

**&#35;3**  
You can set array of available recognizers: `'FACE', 'BLINK_ID', 'MRTD', 'PASSPORT', 'USDL', 'PDF417', 'CODE128', 'CODE39', 'AZTEC', 'DATA_MATRIX', 'EAN13', 'EAN8', 'ITF', 'QR', 'UPCA', 'UPCE', 'UAE_ID_FRONT', 'UAE_ID_BACK', 'UAE_DL_FRONT', 'VIN', 'SIM', 'CYP_ID_FRONT', 'CYP_ID_BACK', 'CRO_ID_FRONT', 'CRO_ID_BACK', 'KWT_ID_FRONT', 'KWT_ID_BACK', 'ESP_DL_FRONT', 'UK_DL_FRONT', 'MYKAD_FRONT', 'MYKAD_BACK', 'MYTENTERA_FRONT', 'MYPR_FRONT', 'MYKAS_FRONT', 'MYS_DL_FRONT', 'IKAD_FRONT', Ï'INDONESIA_ID_FRONT', 'SGP_ID_FRONT', 'SGP_ID_BACK', 'SGP_DL_FRONT', 'IRL_DL_FRONT', 'HKG_ID_FRONT', 'BLINK_CARD_FRONT', 'AUT_DL_FRONT', 'BRN_ID_FRONT', 'BRN_ID_BACK', 'BRN_RES_PERMIT_FRONT', 'BRN_RES_PERMIT_BACK', 'BRN_TEMP_RES_PERMIT_FRONT', 'BRN_TEMP_RES_PERMIT_BACK', 'BRN_MILITARY_ID_FRONT', 'BRN_MILITARY_ID_BACK', 'COL_DL_FRONT', 'DEU_DL_FRONT', 'ITA_DL_FRONT', 'MEX_VOTER_ID_FRONT', 'NZL_DL_FRONT', 'NIGERIA_VOTER_ID_BACK'`  
NOTE: providing more recognizers extends waiting time from the API because OCR engine will execute recognize process on more recognizers, please provide only these recognizers of which kind you are uploading documents.

**&#35;4**  
This demo app is <b>GDPR complained</b> and it does not store any data on the API backend service when `Authorization` header is not provided.
