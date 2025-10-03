# Map Area Tools

This repository contains a set of samples demonstrating how to use Resco Map Area Tools with various backends and map providers.
It also demonstrates how to integrate the solution into the Resco Mobile CRM app as Offline HTML or as a Dataverse web resource.

## offline-html samples

A set of samples demonstrating how to integrate map-area-tools into the Resco Mobile CRM app as an Offline HTML iFrame.

### area-visualization

A sample demonstrating how to get and set area GeoJSON from either a text field or a file field, and display the areas in a generated SVG image.
It also contains a simple area units selector displaying areas in chosen units.
It serves as a starting point for a new measurement or editing of existing areas performed in a new window as a modal iFrame (see modal-iframe sample), passing existing areas and map credentials as custom iFrameForm options.

### modal-iframe

## dataverse-webresource

A sample demonstrating how to use the Map Area Tools with Azure Maps (or Google Maps) as a Dataverse web resource included on model-driven app form. It implements Azure/Google Maps window allowing to define and edit outer area and several excluded objects stored into entity fields. If also saves resulting area value in given area units into a numeric field.