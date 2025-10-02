# Map Area Visualization Demo

This sample demonstrates how to get and set area GeoJSON from either a text field or a file field,
and display the areas in a generated SVG image. It also contains a simple area units selector displaying areas
in chosen units.
The bottom button starts a new measurement or edits existing areas in a new window as modal iFrame (see modal-iframe sample), passing existing areas and map credentials as custom iFrameForm options.

## Offline HTML (Mobile CRM app) environment

This sample is intended as an Offline HTML solution in the Resco Mobile CRM app.

## Prerequisites

- Woodford app project
- Primary shared key from Azure Maps Account on [Azure Portal](https://portal.azure.com)
- Alternatively:
    - Google Maps API key from [Google API Console](https://console.cloud.google.com/apis/credentials) - choose no app restrictions and restrict key to "Maps JavaScript API" (optionally "Places API" or other APIs)
    - Google Map ID from [Map Management](https://console.cloud.google.com/google/maps-apis/studio/maps)

## Installation

Before using this solution, several steps are required in Woodford mobile project customization.

- Edit the GeoPolygonFetchConfig object in the main.ts file and enter the credentials from prerequisites 
- Enter the logical names of fields containing area GeoJSONs - one text field for outer area GeoJSON and the second (optional) field for storing the resulting GeoJSON collection of excluded objects.
- Prepare a production build
- Upload the build from the "dist" folder into Woodford app project, section Offline HTML. Keep the folder structure map-area-tools/modal-iframe/index.html
- Save all changes and publish the app project

## Usage

The distribution is intended to be called from other Offline HTML iFrame which can be inserted into several places - as a Home item, as an iFrame on entity form (see area-visualization sample), or even as a hidden iFrame behind other business logical.
The "modal-iframe" distribution can be opened as file URL passed to "IFrameForm.showModal" method:

```Typescript
/**
* Opens a modal window with an Offline HTML iFrame running map area tools
* @param azureSubscriptionKey Azure Maps subscription key (primary shared key)
* @param outerAreaGeoJsonField A logical name of the field containing GeoJSON with outer area polygon
* @param excludedAreasGeoJsonField A logical name of the field containing GeoJSON collection with excluded areas
*/
function startMeasurement(azureSubscriptionKey: string, outerAreaGeoJsonField: string, excludedAreasGeoJsonField: string) {
    // This iFrame is placed on entity form - request form details
    MobileCRM.UI.EntityForm.requestObject(form => {
        const entity = form.entity;
        handleMeasurementResult(true);
        MobileCRM.UI.IFrameForm.showModal(
            "Area Measurement",
            "file://map-area-tools/modal-iframe/index.html", // Offline HTML URL - it must respect your folder structure in Woodford / Offline HTML
            {	// We pass subscription, record reference, and pre-fetched polygons in iFrameForm custom options
                subscriptionKey: azureSubscriptionKey,
                entity: entity.entityName,
                id: entity.id,
                name: entity.primaryName,
                polygon: entity.properties[outerAreaGeoJsonField], // If the target field already contains GeoJSON, pass it to iFrame
                innerAreas: entity.properties[excludedAreasGeoJsonField],
            }
        );
    });
}
```

### Production build
```bash
npm run build
```
VITE bundles the project for distribution - this time as an Offline HTML package

### Dev build
```bash
npm run dev
```
VITE serves the solution on http://localhost:5173

### Remote Development build
```bash
npm run remote
```
In addition to localhost, VITE serves the solution also for remote devices (on the same LAN). You can use this URL in Woodford directing the iFrame to your local development.
