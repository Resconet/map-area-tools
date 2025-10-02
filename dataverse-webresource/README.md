# Map Area Tools Demo

## Dataverse web resource

This sample demonstrates how to use Map Area Tools with Azure Maps (or Google Maps) as a Dataverse web resource included on a form in a model-driven app.
It implements Azure/Google Maps window allowing to define / edit outer area and several excluded objects stored into entity fields.
It also saves resulting area value in given area units into numeric field.

## Prerequisites

- Azure Maps subscription
- Primary shared key from Azure Maps Account on [Azure Portal](https://portal.azure.com)
- Alternatively:
    - Google Maps API key from [Google API Console](https://console.cloud.google.com/apis/credentials) - choose no app restrictions and restrict key to "Maps JavaScript API" (optionally "Places API" or other APIs)
    - Google Map ID from [Map Management](https://console.cloud.google.com/google/maps-apis/studio/maps)
- Access to Power Apps form designer
    - Choose target entity (table)
    - Choose or create target fields (columns) that will be dedicated to GeoJSON data (one or two text/file fields with sufficient capacity)
    - Optionally, choose or create a target numeric field for calculated area

## Pre-processing the source code

- Open a project in VS Code or any other development environment
- Open the terminal in this folder and download the dependencies:
``` bash
npm install
```
- Locate the "main.ts" file in a root and change values in the "MapAreaFetchConfig" object.
    - Specify value for "azureSubscriptionKey" - your primary shared key from Azure Maps Account on [Azure Portal](https://portal.azure.com)
    - Alternatively, specify "googleApiKey" and "googleMapId" mentioned above
    - Specify "outerAreaGeoJsonField" - the logical (!) name of the field from the target entity which will obtain the GeoJSON data of your area measurement
    - Optionally, specify also "excludedAreasGeoJsonField" - the logical name of the field from target entity which will obtain the GeoJSON collection of excluded objects
    - Optionally, specify also "resultingAreaField" - the logical name of a numeric field from target entity which will obtain calculated area in specified area units (hectares in this sample)
    - Finally, specify "timestampProperty" and "polygonAreaProperty" - the names of GeoJSON properties containing area/timestamp of area measurement. Required, if "resultingAreaField" is specified

WARNING: We strongly recommend to use a more robust service secrets protection for production builds (Azure KeyVault,...). Including your secrets in plain text directly in a web resource is not acceptable for production.

## Building production bundle

- Save your changes, open the terminal in this folder and run following command:
``` bash
npm run build
```

## Installation in Power Apps

- Open your app in [Power Apps](https://make.powerapps.com)
- Choose "Tables" from site map and select target entity (let's say Accounts)
- In the "Data Experience" section, click "Form" and open the target Account form
- In the "Display" section, add a new "Component" of the type "HTML Web Resource"
- Click "New Web Resource"
- Choose the file "index.html" from "dist" subfolder
- Choose following properties:
    - FileType: web page (HTML)
    - Name: MapAreaTools/index.html
    - Display name: MapAreaTools/index.html
    - Optionally, check "Enable for Mobile" and "Available Offline"
- "Save and Publish" the new web resource and add it to your form
- index.html depends on two other files from dist/assets folder - create web resources also for these files. As "Name", use "MapAreaTools/assets/index.js" and "MapAreaTools/assets/index.css"
- Save and publish the form definition and try it in your Power App

## Updating bundle

The easiest way to update existing web resources is by using the "WebResources Manager" from [XRM Toolbox](https://www.xrmtoolbox.com).
Occasional update is possible also via [Power Apps web interface](https://make.powerapps.com).

### Dev build
```bash
npm run dev
```
VITE serves the solution on http://localhost:5173

Debugging this sample is not possible directly as served web page will miss the Power App context and it can't load/save entity records.
There are several non-trivial mechanisms how to supply the context and redirect traffic to Dataverse but they are out of scope of this sample.

### Production build
```bash
npm run build
```
VITE bundles the project for distribution into the "dist" folder - a bunch of Power Apps web resources
