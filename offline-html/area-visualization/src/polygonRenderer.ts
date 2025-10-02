import { GeoJsonFeature, GeoJsonFeatureCollection } from "@resconet/map-interface";

type PolygonData = {
    coordinates: [number, number][];
    area: number;
}

export class PolygonRenderer {
    private width: number = 0;
    private height: number = 0;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private minLng: number = 0;
    private minLat: number = 0;
    private scale: number = 0;

    private outerPolygon?: PolygonData;
    private excludedAreas: PolygonData[] = [];

    private scaleX(lng: number) { return this.offsetX + (lng - this.minLng) * this.scale; }
    private scaleY(lat: number) { return this.height - this.offsetY - (lat - this.minLat) * this.scale; }

    constructor(private svg: SVGSVGElement, private unitSelect: HTMLSelectElement) {
        unitSelect.addEventListener("change", () => this.refresh());
        window.addEventListener("resize", () => this.refresh());
    }

    renderPolygons(outerPolygon: GeoJsonFeature, excludedAreas: GeoJsonFeatureCollection) {
        this.svg.innerHTML = "";
        this.outerPolygon = undefined;
        this.excludedAreas = [];

        if (!outerPolygon) return;

        let coords: [number, number][] = [];
        let area = 0;
        try {
            if (outerPolygon.type === "Feature") {
                coords = outerPolygon.geometry.coordinates[0];
            } else {
                console.error("Unexpected polygon feature type: " + outerPolygon.type);
            }
            area = outerPolygon.properties && outerPolygon.properties.declared_area ? outerPolygon.properties.declared_area : 0;
        } catch (e) {
            console.error(`Unexpected error parsing polygon feature ${e}`);
            return;
        }
        if (!coords.length) return;

        this.outerPolygon = { coordinates: coords, area: area };

        if (excludedAreas && excludedAreas.type === "FeatureCollection" && excludedAreas.features) {
            this.excludedAreas = excludedAreas.features.map((feature: GeoJsonFeature) => ({
                coordinates: feature.geometry.coordinates[0],
                area: feature.properties ? feature.properties.declared_area : 0,
            } as PolygonData));
        }
        this.refresh();
    }

    private refresh() {
        this.svg.innerHTML = "";
        if (this.outerPolygon) {
            const coords = this.outerPolygon.coordinates;
            this.recalculateScale(coords);

            this.createPolygonElement(coords, "#346e67");

            this.createAreaTextElement(this.outerPolygon.area, this.calcPolygonCenter(coords));

            let excludedArea = 0;
            this.excludedAreas.forEach(excluded => {
                this.createPolygonElement(excluded.coordinates, "#ff0000");
                const innerArea = excluded.area;
                if (innerArea) {
                    excludedArea += innerArea;
                    this.createAreaTextElement(innerArea, this.calcPolygonCenter(excluded.coordinates));
                }
            });

            const totalArea = area - excludedArea;
            this.createAreaTextElement(totalArea, [this.width / 2, this.height - 20], "Total: ", 16);
        }
    }

    private recalculateScale(coords: [number, number][]) {
        // Project coordinates to fit SVG
        const latitudes = coords.map(c => c[1]);
        const longitudes = coords.map(c => c[0]);
        this.minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        this.minLng = Math.min(...longitudes);
        const maxLng = Math.max(...longitudes);

        this.width = this.svg.clientWidth || 300;
        this.height = this.svg.clientHeight || 200;
        const pad = 10;

        // Calculate scale to maintain aspect ratio
        const dataWidth = maxLng - this.minLng || 1;
        const dataHeight = maxLat - this.minLat || 1;
        const svgWidth = this.width - 2 * pad;
        const svgHeight = this.height - 2 * pad;
        this.scale = Math.min(svgWidth / dataWidth, svgHeight / dataHeight);

        // Center the polygon in the SVG
        this.offsetX = pad + (svgWidth - this.scale * dataWidth) / 2;
        this.offsetY = pad + (svgHeight - this.scale * dataHeight) / 2;
    }

    private calcPolygonCenter(coords: [number, number][]): [number, number] {
        const centroid = PolygonRenderer.polygonCentroid(coords);
        const [centroidLng, centroidLat] = centroid;
        return [this.scaleX(centroidLng), this.scaleY(centroidLat)];
    }

    static polygonCentroid(points: [number, number][]) {
        let x = 0,
            y = 0,
            f,
            area = 0;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const [x0, y0] = points[j];
            const [x1, y1] = points[i];
            f = x0 * y1 - x1 * y0;
            x += (x0 + x1) * f;
            y += (y0 + y1) * f;
            area += f;
        }
        area = area / 2;
        if (area === 0) return [points[0][0], points[0][1]];
        x = x / (6 * area);
        y = y / (6 * area);
        return [x, y];
    }

    private createPolygonElement(coords: [number, number][], color: string,) {
        const points = coords.map(([lng, lat]) => `${this.scaleX(lng)},${this.scaleY(lat)}`).join(" ");
        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygon.setAttribute("points", points);
        polygon.setAttribute("fill", color);
        polygon.setAttribute("fill-opacity", "0.3");
        polygon.setAttribute("stroke", color);
        //polygon.setAttribute("stroke-width", "2");
        this.svg.appendChild(polygon);
        return polygon;
    }

    private createAreaTextElement(area: number, center: [number, number], prefix = "", fontSize = 12) {
        const textBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", center[0].toString());
        text.setAttribute("y", center[1].toString());
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "#ffffff");
        text.setAttribute("font-size", fontSize.toString());
        //text.setAttribute("font-weight", "bold");
        //text.setAttribute("stroke", "#000000");
        //text.setAttribute("stroke-width", "1");
        text.textContent = prefix + this.areaToText(area);
        this.svg.appendChild(text);

        // Measure text width
        const bbox = text.getBBox();
        const padding = 8;
        textBg.setAttribute("x", (bbox.x - padding / 2).toString());
        textBg.setAttribute("y", (bbox.y - padding / 2).toString());
        textBg.setAttribute("width", (bbox.width + padding).toString());
        textBg.setAttribute("height", (bbox.height + padding).toString());
        textBg.setAttribute("fill", "rgba(0,0,0,0.4)");
        textBg.setAttribute("rx", (fontSize / 2).toString());
        textBg.setAttribute("ry", (fontSize / 2).toString());
        // Insert background before text
        this.svg.insertBefore(textBg, text);
    }

    private areaToText(area: number) {
        if (this.unitSelect) {
            const unit = this.unitSelect.value;
            area = area || 0;
            if (unit === "ha") return PolygonRenderer.printNumber(area) + " ha";
            if (unit === "ac") return PolygonRenderer.printNumber(area * 2.47105) + " ac";
            if (unit === "km2") return PolygonRenderer.printNumber(area * 0.01) + " km²";
            if (unit === "mi2") return PolygonRenderer.printNumber(area * 0.00386102) + " mi²";
            if (unit === "ft2") return PolygonRenderer.printNumber(area * 107639) + " ft²";
            if (unit === "yd2") return PolygonRenderer.printNumber(area * 11959.9) + " yd²";
        }
        return PolygonRenderer.printNumber(area * 10000) + " m²";
    }

    private static printNumber(num: number) {
        if (typeof num !== "number" || isNaN(num)) return "";
        if (num >= 1e6) return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
        if (num >= 1e3) return num.toLocaleString(undefined, { maximumFractionDigits: 1 });
        if (num >= 1) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
        return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
    }
}