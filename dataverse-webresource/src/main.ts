import { createAzureMapView } from "@resconet/azure-maps";
// Alternatively: import { createGoogleMapView } from "@resconet/google-maps";
import { createMapAreaFetch } from "@resconet/map-area-tools";
import '../../common/ios-drawer.js'
import { AreaUnits, GeoJsonFeature, GeoJsonFeatureCollection } from "@resconet/map-interface";
/// <reference types="xrm" />

const MapAreaFetchConfig = {
	// For Azure Maps, specify:
	azureSubscriptionKey: "", // primary shared key from Azure Maps Account on Azure Portal
	// For Google Maps, specify:
	googleApiKey: "",
	googleMapId: "",
	// Dataverse field mapping
	outerAreaGeoJsonField: "new_outerarea", //the logical (!) name of the field from target entity which will obtain the GeoJSON data of your area measurement
	excludedAreasGeoJsonField: "new_excludedobjects", //the logical name of the field from target entity which will obtain the GeoJSON collection of excluded objects
	resultingAreaField: "new_totalarea", // the logical name of numeric field from target entity which will obtain calculated area in specified area units (hectares in this sample)
	// GeoJSON custom properties
	timestampProperty: "event_date",	// Optional custom GeoJSON property which will obtain the ISO date string in form YYYY-MM-DD
	polygonAreaProperty: "declared_area", // Optional Custom GeoJSON property which will obtain the polygon area in specified units
	areaUnits: <AreaUnits>"Hectares",
};

const mapElement = document.getElementById("map") as HTMLElement;
const buttonContainerElement = document.getElementById("drawerCommands") as HTMLElement;
const errorSpan = <HTMLElement>document.getElementById("error-text");

function showError(text?: string) {
	if (text) {
		errorSpan.textContent = text;
		errorSpan.classList.add("visible");
		mapElement.classList.add("hidden");
	} else {
		errorSpan.textContent = "";
		errorSpan.classList.remove("visible");
		mapElement.classList.remove("hidden");
	}
}
function onSaveArea(entity: string, recordId: string, polygon?: GeoJsonFeature, innerAreas?: GeoJsonFeatureCollection) {
	const data: { [key: string]: string | number | null } = {};
	data[MapAreaFetchConfig.outerAreaGeoJsonField] = polygon ? JSON.stringify(polygon) : null;
	data[MapAreaFetchConfig.excludedAreasGeoJsonField] = innerAreas ? JSON.stringify(innerAreas) : null;

	const geoJsonProps = polygon?.properties as any;
	if (geoJsonProps && geoJsonProps[MapAreaFetchConfig.polygonAreaProperty]) {
		let resultingArea = geoJsonProps[MapAreaFetchConfig.polygonAreaProperty] as number;
		innerAreas?.features?.forEach(excludedPolygon => {
			const geoJsonProps = excludedPolygon?.properties as any;
			if (geoJsonProps && geoJsonProps[MapAreaFetchConfig.polygonAreaProperty]) {
				resultingArea -= geoJsonProps[MapAreaFetchConfig.polygonAreaProperty] as number;
			}
		});

		data[MapAreaFetchConfig.resultingAreaField] = resultingArea;
	}
	Xrm.WebApi.updateRecord(entity, recordId, data)
		.then(() => alert("Polygon saved successfully."))
		.catch(error => alert(`Error saving polygon: ${error?.message || error}`));
}

if (typeof Xrm !== "undefined") {
	/* Scenario 1: This document is running on model-driven entity form and setting outer area and excluded objects as GeoJSON in two separate fields  */
	const context = Xrm.Utility.getPageContext().input as Xrm.EntityFormPageContext;
	const entity = context.entityName;
	const recordId = context.entityId;

	if (entity && recordId) {
		Xrm.WebApi.retrieveRecord(entity, recordId, `?$select=${MapAreaFetchConfig.outerAreaGeoJsonField},${MapAreaFetchConfig.excludedAreasGeoJsonField}`)
			.then(record => {
				createAzureMapView(mapElement, { subscriptionKey: MapAreaFetchConfig.azureSubscriptionKey, })
					// Alternatively: createGoogleMapView(mapElement, { apiKey: options.apiKey, mapId: options.mapId })
					.then(mapView => {
						createMapAreaFetch(mapView, buttonContainerElement, result => onSaveArea(entity, recordId, result?.polygon, result?.innerAreas), {
							timestampProperty: MapAreaFetchConfig.timestampProperty,	// Enables custom GeoJSON property which will obtain the ISO date string in form YYYY-MM-DD
							polygonAreaProperty: MapAreaFetchConfig.polygonAreaProperty, // Enables custom GeoJSON property which will obtain the polygon area in specified units
							additionalProperties: { name: record.name, id: recordId }, // Set reference or other custom GeoJSON properties
							areaUnits: MapAreaFetchConfig.areaUnits,
							areaCalculationMode: "Default", // Use TurfJS for more precise area calculation
						})
							.then(areaFetch => {
								// Optionally, set own button texts here if needed, e.g.:
								// areaFetch.overrideButtonText(MapAreaButton.MeasureArea, "Measure Field");

								const polygon = record[MapAreaFetchConfig.outerAreaGeoJsonField];
								if (polygon) {
									const innerAreas = record[MapAreaFetchConfig.excludedAreasGeoJsonField];
									areaFetch.initialize(JSON.parse(polygon), innerAreas ? JSON.parse(innerAreas) : undefined)
										.catch(error => alert(`Error setting polygon GeoJson: ${error?.message || error}`));
								} else {
									// Set default map position and zoom if no polygon is given and current location unknown.
									mapView.setCenter(40.78, -73.97, 11);
								}
							})
							.catch(error => showError(`Error creating the map area tools: ${error?.message || error}`));
					})
					.catch(error => showError(`Error creating the map: ${error?.message || error}`));
			})
			.catch(error => showError(`Source entity record can't be retrieved: ${error?.message || error}`));
	} else {
		showError("This iFrame is intended to run from within the model-driven entity form.");
	}
} else {
	showError("This iFrame is intended to run from within the model-driven app.");
}
