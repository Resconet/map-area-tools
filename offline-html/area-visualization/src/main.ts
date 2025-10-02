import "@resconet/jsbridge";
import { type FetchResult } from "@resconet/map-area-tools";
import { PolygonRenderer } from "./polygonRenderer";

//MobileCRM.bridge.command("openDevTools");

const GeoPolygonFetchConfig = {
	outerAreaGeoJsonField: "new_outerarea", //the logical (!) name of the field from target entity which will obtain the GeoJSON data of your area measurement
	excludedAreasGeoJsonField: "new_excludedobjects", //the logical name of the field from target entity which will obtain the GeoJSON collection of excluded objects
	// For Azure Maps, specify:
	azureSubscriptionKey: "",	// primary shared key from Azure Maps Account on Azure Portal
	// For Google Maps, specify:
	googleApiKey: "",
	googleMapId: "",
};

// Load elements from index.html
const startMeasurementButton = document.getElementById("startMeasurement");
const svgElement = document.getElementById("polygonPreview") as unknown as SVGSVGElement;
const unitSelect = document.getElementById("unitSelect") as HTMLSelectElement;

// Create polygon rendered object
const polygonRenderer = (svgElement && unitSelect) ? new PolygonRenderer(svgElement, unitSelect) : undefined;

// Request entity from object and fetch fields containing already-captured area polygons
MobileCRM.UI.EntityForm.requestObject(
	(form: MobileCRM.UI.EntityForm) => {
		const entity = form.entity;
		const outerAreaGeoJson = entity.properties[GeoPolygonFetchConfig.outerAreaGeoJsonField];
		if (outerAreaGeoJson) {
			if (startMeasurementButton) {
				startMeasurementButton.textContent = "Edit Area Measurement";
			}
			const outerPolygon = JSON.parse(outerAreaGeoJson);
			const innerAreasGeoJson = entity.properties[GeoPolygonFetchConfig.excludedAreasGeoJsonField];
			const innerPolygons = innerAreasGeoJson ? JSON.parse(innerAreasGeoJson) : null;
			polygonRenderer?.renderPolygons(outerPolygon, innerPolygons);
		}
	},
	err => console.error(`Error requesting EntityForm: ${err}`)
);

// MeasurementCaptured global event handler
function onMeasurementCompleted(event: FetchResult) {
	if (event) {
		MobileCRM.UI.EntityForm.setFieldValue(GeoPolygonFetchConfig.outerAreaGeoJsonField, event.polygon ? JSON.stringify(event.polygon) : "");
		if (event.polygon) {
			polygonRenderer?.renderPolygons(event.polygon, event.innerAreas);
		}
		MobileCRM.UI.EntityForm.setFieldValue(GeoPolygonFetchConfig.excludedAreasGeoJsonField, event.innerAreas ? JSON.stringify(event.innerAreas) : "");
	}
	registerMeasurementCaptured(false);
}
function registerMeasurementCaptured(register: boolean) {
	MobileCRM.bridge.onGlobalEvent("MeasurementCaptured", onMeasurementCompleted, register);
}

// Handle start measurement button click
startMeasurementButton?.addEventListener("click", () => {
	MobileCRM.UI.EntityForm.requestObject((form: MobileCRM.UI.EntityForm) => {
		const entity = form.entity;
		registerMeasurementCaptured(true);
		MobileCRM.UI.IFrameForm.showModal(
			"Area Measurement",
			"file://map-area-tools/modal-iframe/index.html",	// Path to child iFrame within Offline HTML storage in Woodford.
			{
				apiKey: GeoPolygonFetchConfig.googleApiKey,
				mapId: GeoPolygonFetchConfig.googleMapId,
				subscriptionKey: GeoPolygonFetchConfig.azureSubscriptionKey,
				// Add entity record reference as custom GeoJSON fields entity
				entity: entity.entityName,
				id: entity.id,
				name: entity.primaryName,
				// Fetch outer area and excluded objects from currently opened entity record
				polygon: entity.properties[GeoPolygonFetchConfig.outerAreaGeoJsonField],
				innerAreas: entity.properties[GeoPolygonFetchConfig.excludedAreasGeoJsonField],
			}
		);
	},
		err => console.error(`Error requesting EntityForm: ${err}`)
	);
});