import { useState, useEffect, useMemo, useCallback } from "react";
import DeckGL, { ZoomWidget } from "@deck.gl/react";
import { GeoJsonLayer, BitmapLayer } from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";

const INITIAL_VIEW_STATE = {
    longitude: 37.645,
    latitude: 55.75,
    zoom: 13,
    pitch: 0,
    bearing: 0,
};

const GEO_BOUNDS = {
    minLat: 55.4,
    maxLat: 56.0,
    minLng: 37.0,
    maxLng: 38.2,
};

const DARK_RED = [139, 0, 0];

function clampViewState(vs) {
    let { longitude, latitude, zoom } = vs;
    latitude = Math.min(Math.max(latitude, GEO_BOUNDS.minLat), GEO_BOUNDS.maxLat);
    longitude = Math.min(Math.max(longitude, GEO_BOUNDS.minLng), GEO_BOUNDS.maxLng);
    zoom = Math.min(Math.max(zoom, 9), 20);
    return { ...vs, longitude, latitude, zoom };
}

/** CARTO Positron (light) — `{s}` subdomains for throughput */
const CARTO_LIGHT_TILES = [
    "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
];

export default function MapView({ activeMap }) {
    const [geoData, setGeoData] = useState(null);
    const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

    useEffect(() => {
        fetch(`${import.meta.env.BASE_URL}data/geoplaces_moscow_3.json`)
            .then((res) => {
                if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                const filtered = {
                    ...data,
                    features: data.features.filter((f) => f.properties.geolocated == true),
                };
                setGeoData(filtered);
            })
            .catch((err) => console.error(err));
    }, []);

    const onViewStateChange = useCallback(({ viewState: vs }) => {
        setViewState(clampViewState(vs));
    }, []);

    const layers = useMemo(() => {
        const base = [
            new TileLayer({
                id: "carto-basemap",
                data: CARTO_LIGHT_TILES,
                minZoom: 0,
                maxZoom: 19,
                tileSize: 256,
                renderSubLayers: (props) => {
                    const {
                        bbox: { west, south, east, north },
                    } = props.tile;
                    const { data: image, ...layerProps } = props;
                    return new BitmapLayer(layerProps, {
                        id: `${props.id}-bitmap`,
                        image,
                        bounds: [west, south, east, north],
                        data: undefined,
                    });
                },
            }),
        ];

        if (activeMap !== "Places" || !geoData) return base;

        return [
            ...base,
            new GeoJsonLayer({
                id: "places",
                data: geoData,
                pickable: true,
                stroked: true,
                filled: true,
                lineWidthMinPixels: 4,
                lineWidthUnits: "pixels",
                getLineColor: [...DARK_RED, 77],
                getFillColor: (f) => {
                    const t = f.geometry?.type;
                    if (t === "Point" || t === "MultiPoint") {
                        return [...DARK_RED, 204];
                    }
                    return [...DARK_RED, 77];
                },
                pointType: "circle",
                pointRadiusUnits: "pixels",
                getPointRadius: 8,
            }),
        ];
    }, [activeMap, geoData]);

    const getTooltip = useCallback((info) => {
        const f = info.object;
        const name = f?.properties?.name;
        if (!name) return null;
        return { text: String(name) };
    }, []);

    return (
        <div style={{ position: "relative", height: "100vh", width: "100vw" }}>
            <DeckGL
                className="map"
                style={{ width: "100%", height: "100%" }}
                viewState={viewState}
                onViewStateChange={onViewStateChange}
                controller={{
                    scrollZoom: true,
                    dragPan: true,
                    dragRotate: false,
                    touchRotate: false,
                }}
                layers={layers}
                getTooltip={getTooltip}
            >
                <ZoomWidget placement="bottom-left" />
            </DeckGL>
            <div
                style={{
                    position: "absolute",
                    left: 8,
                    bottom: 52,
                    fontSize: 11,
                    color: "#333",
                    background: "rgba(255,255,255,0.75)",
                    padding: "2px 6px",
                    borderRadius: 3,
                    pointerEvents: "none",
                    maxWidth: "60%",
                }}
            >
                © OpenStreetMap · CARTO
            </div>
        </div>
    );
}
