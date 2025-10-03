import { createAzureMapView } from "@resconet/azure-maps";
// Alternatively: import { createGoogleMapView } from "@resconet/google-maps";
import "@resconet/jsbridge";
import { createMapAreaFetch, MapAreaButton, type FetchResult } from "@resconet/map-area-tools";
import '../../../common/ios-drawer.js'

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

// Fetch URL query parameters
if (MobileCRM.bridge) {
	/* Scenario 1: This document is running in iFrameForm opened from peer iFrame (see area-visualization sample) which is handling JSBridge global event "MeasurementCaptured" */
	const onResultFetched = (result?: FetchResult) => {
		if (MobileCRM?.bridge) {
			MobileCRM.bridge.raiseGlobalEvent("MeasurementCaptured", result); // Send result back to parent iFrame
			MobileCRM.bridge.closeForm();
		}
	};
	MobileCRM.UI.IFrameForm.requestObject(form => {
		const options = form.options; // Peer iFrame (see are-visualization sample) send custom options of type { subscriptionKey:string, polygon?: string, innerAreas?: string, name?: string, id?: string }
		createAzureMapView(mapElement, { subscriptionKey: options.subscriptionKey, })
			// Alternatively: createGoogleMapView(mapElement, { apiKey: options.apiKey, mapId: options.mapId })
			.then(mapView => {
				createMapAreaFetch(mapView, buttonContainerElement, onResultFetched, {
					timestampProperty: "event_date",	// Enables custom GeoJSON property which will obtain the ISO date string in form YYYY-MM-DD
					polygonAreaProperty: "declared_area", // Enables custom GeoJSON property which will obtain the polygon area in specified units
					additionalProperties: { name: options.name, id: options.id }, // Set reference or other custom GeoJSON properties
					areaUnits: "Hectares",
					areaCalculationMode: "Default", // Use TurfJS for more precise area calculation
				})
					.then(areaFetch => {
						MobileCRM.UI.IFrameForm.onSave(() => {
							onResultFetched(areaFetch.constructResult());
							return false;
						}, true);

						// Optionally, set own button texts here if needed, e.g.:
						// areaFetch.overrideButtonText(MapAreaButton.MeasureArea, "Measure Field");
						// Optionally, set mapView properties
						//mapView.setSatelliteMode(true);

						if (options.polygon) {
							const innerAreas = options.innerAreas;
							areaFetch.initialize(JSON.parse(options.polygon), innerAreas ? JSON.parse(innerAreas) : undefined)
								.catch(error => MobileCRM.UI.Form.showToast(`Error setting polygon GeoJson: ${error}`, "Cmd.Error.png"));
						} else {
							// Set default map position and zoom if no polygon is given and current location unknown.
							mapView.setCenter(40.78, -73.97, 11);
						}
					})
					.catch(error => showError(`Error creating the map area tools: ${error}`));
			})
			.catch(error => showError(`Error creating the map: ${error}`));
	}, showError);
} else {
	showError("This iFrame is intended to run from within the Resco Mobile CRM app.")
}