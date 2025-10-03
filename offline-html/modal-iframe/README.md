# Map Area Tools demo

## Offline HTML modal iFrame

This sample demonstrates how to use the Map Area Tools with Azure/Google Maps in an Offline HTML solution as a modal iFrame in the Resco Mobile CRM app.

## Prerequisites

- Azure Maps subscription
- Primary shared key from Azure Maps Account on [Azure Portal](https://portal.azure.com)
- Woodford mobile project

## Usage

The distribution is intended to be called from other Offline HTML iFrame which passes several 
```Typescript
/**
* Opens a modal window with Offline HTML iFrame running map area tools
* @param azureSubscriptionKey Azure Maps subscription key (primary shared key)
* @param outerAreaGeoJsonField A logical name of the field containing GeoJSON with outer area polygon
*/
function startMeasurement(azureSubscriptionKey: string, outerAreaGeoJsonField: string, excludedAreasGeoJsonField: string) {
    // This iFrame is placed on entity form - request form details 
    MobileCRM.UI.EntityForm.requestObject(form => {
        const entity = form.entity;
        handleMeasurementResult(true);
        MobileCRM.UI.IFrameForm.showModal(
            "Area Measurement",
            "file://MapAreaFetch/index.html", // Offline HTML URL (we assume that solution reside in MapAreaFetch folder)
            {	// We pass subscription, record reference, and pre-fetched polygons in iFrameForm custom options 
                subscriptionKey: azureSubscriptionKey,
                entity: entity.entityName,
                id: entity.id,
                name: entity.primaryName,
                polygon: entity.properties[outerAreaGeoJsonField], // If the target field already contains GeoJSON, pass it to the iFrame
                innerAreas: entity.properties[excludedAreasGeoJsonField],
            }
        );
    });
}
```

### Dev build
```bash
npm run dev
```
VITE serves the solution on http://localhost:5173

### Production build
```bash
npm run build
```
VITE bundles the project for distribution - this time as an Offline HTML package