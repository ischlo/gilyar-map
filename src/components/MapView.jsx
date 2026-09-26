import { useCallback, useEffect, useMemo, useState } from "react";
import DeckGL from "@deck.gl/react";
import { IconLayer, PathLayer, SolidPolygonLayer } from "@deck.gl/layers";
import { ContourLayer } from "@deck.gl/aggregation-layers";
import { TripsLayer } from "@deck.gl/geo-layers";
import { ZoomWidget } from "@deck.gl/widgets";
import { Map } from "react-map-gl/mapbox";

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
const DARK_YELLOW = [184, 134, 11];
const SENTIMENT_CELL_SIZE_METERS = 100;
const ROUTE_TRIP_DURATION_SECONDS = 60;
const ROUTE_TRAIL_LENGTH_SECONDS = 15;
const SENTIMENT_CONTOURS = [
    { threshold: [0, 2.5], color: [127, 29, 29, 90], zIndex: 1 },
    { threshold: [2.5, 3.5], color: [180, 83, 9, 90], zIndex: 2 },
    { threshold: [3.5, 4.5], color: [202, 138, 4, 90], zIndex: 3 },
    { threshold: [4.5, 6], color: [22, 101, 52, 90], zIndex: 4 },
    { threshold: 2.5, color: [127, 29, 29, 180], strokeWidth: 1.5 },
    { threshold: 3.5, color: [180, 83, 9, 180], strokeWidth: 1.5 },
    { threshold: 4.5, color: [22, 101, 52, 180], strokeWidth: 1.5 },
];

const SENTIMENT_LEGEND = [
    { label: "1–<2.5", color: "rgba(127, 29, 29, 0.65)" },
    { label: "2.5–<3.5", color: "rgba(180, 83, 9, 0.65)" },
    { label: "3.5–<4.5", color: "rgba(202, 138, 4, 0.65)" },
    { label: "4.5–5", color: "rgba(22, 101, 52, 0.65)" },
];

const PLACE_ICON_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path fill="#000" d="M32 4C20.4 4 11 13.4 11 25c0 15 21 35 21 35s21-20 21-35C53 13.4 43.6 4 32 4z"/>
  <circle cx="32" cy="25" r="8.5" fill="#fff"/>
</svg>
`)}`;

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

function clampViewState(vs) {
    let { longitude, latitude, zoom } = vs;
    latitude = Math.min(Math.max(latitude, GEO_BOUNDS.minLat), GEO_BOUNDS.maxLat);
    longitude = Math.min(Math.max(longitude, GEO_BOUNDS.minLng), GEO_BOUNDS.maxLng);
    zoom = Math.min(Math.max(zoom, 9), 20);
    return { ...vs, longitude, latitude, zoom };
}

function unwrapFeatureObject(object) {
    if (!object) return null;
    return object.feature ?? object;
}

function getFeatureProperties(feature) {
    if (!feature) return {};
    return feature.properties ?? feature;
}

function isGeolocatedTrue(feature) {
    const value = getFeatureProperties(feature).geolocated;
    return value === true || value === "true" || value === "True" || value === 1 || value === "1";
}

function isPointGeometry(type) {
    return type === "Point" || type === "MultiPoint";
}

function isLineGeometry(type) {
    return type === "LineString" || type === "MultiLineString";
}

function isPolygonGeometry(type) {
    return type === "Polygon" || type === "MultiPolygon";
}

function flattenCoordinates(coordinates) {
    if (!Array.isArray(coordinates)) return [];
    if (typeof coordinates[0] === "number") return [coordinates];
    return coordinates.flatMap(flattenCoordinates);
}

function getFeatureCenter(feature) {
    const coordinates = flattenCoordinates(feature?.geometry?.coordinates);
    if (!coordinates.length) return null;

    const [longitude, latitude] = coordinates.reduce(
        (acc, point) => [acc[0] + point[0], acc[1] + point[1]],
        [0, 0]
    );

    return [longitude / coordinates.length, latitude / coordinates.length];
}

function toPathObjects(featureCollection = []) {
    return featureCollection.flatMap((feature) => {
        const { type, coordinates } = feature.geometry ?? {};

        if (type === "LineString") {
            return [{ feature, path: coordinates }];
        }

        if (type === "MultiLineString") {
            return coordinates.map((path) => ({ feature, path }));
        }

        return [];
    });
}

function toPolygonObjects(featureCollection = []) {
    return featureCollection.flatMap((feature) => {
        const { type, coordinates } = feature.geometry ?? {};

        if (type === "Polygon") {
            return [{ feature, polygon: coordinates }];
        }

        if (type === "MultiPolygon") {
            return coordinates.map((polygon) => ({ feature, polygon }));
        }

        return [];
    });
}

function isInspectableFeature(feature) {
    const properties = getFeatureProperties(feature);
    return Boolean(properties.place || properties.sentence);
}

function hasLonLatProperties(feature) {
    const properties = getFeatureProperties(feature);
    const longitude = Number(properties.lon);
    const latitude = Number(properties.lat);

    return Number.isFinite(longitude) && Number.isFinite(latitude);
}

function getRouteIconPosition(feature) {
    const properties = getFeatureProperties(feature);

    if (hasLonLatProperties(feature)) {
        return [
            Number(properties.lon),
            Number(properties.lat),
        ];
    }

    return null;
}

function distanceInMeters(from, to) {
    const earthRadius = 6371008.8;
    const degreesToRadians = (degrees) => degrees * Math.PI / 180;
    const fromLatitude = degreesToRadians(from[1]);
    const toLatitude = degreesToRadians(to[1]);
    const deltaLatitude = degreesToRadians(to[1] - from[1]);
    const deltaLongitude = degreesToRadians(to[0] - from[0]);
    const haversine =
        Math.sin(deltaLatitude / 2) ** 2 +
        Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(deltaLongitude / 2) ** 2;

    return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

function buildRouteTrip(routeData) {
    const orderedFeatures = (routeData?.features ?? [])
        .filter((feature) => isLineGeometry(feature.geometry?.type))
        .sort((a, b) => Number(a.properties?.V1) - Number(b.properties?.V1));
    const routeSegments = toPathObjects(orderedFeatures);
    const path = [];
    const distances = [];
    let totalDistance = 0;

    for (const { path: segment } of routeSegments) {
        for (const coordinate of segment) {
            const previousCoordinate = path[path.length - 1];

            if (
                previousCoordinate &&
                previousCoordinate[0] === coordinate[0] &&
                previousCoordinate[1] === coordinate[1]
            ) {
                continue;
            }

            if (previousCoordinate) {
                totalDistance += distanceInMeters(previousCoordinate, coordinate);
            }

            path.push(coordinate);
            distances.push(totalDistance);
        }
    }

    if (path.length < 2 || totalDistance === 0) return null;

    return {
        path,
        timestamps: distances.map(
            (distance) => (distance / totalDistance) * ROUTE_TRIP_DURATION_SECONDS
        ),
        duration: ROUTE_TRIP_DURATION_SECONDS,
    };
}

function SentimentLegend() {
    return (
        <div className="sentiment-legend" role="group" aria-label="Sentiment legend">
            <h2>Sentiment</h2>
            <p>Ranked from bad (1) to good (5)</p>
            <div className="sentiment-legend-items">
                {SENTIMENT_LEGEND.map(({ label, color }) => (
                    <div className="sentiment-legend-item" key={label}>
                        <span
                            className="sentiment-legend-swatch"
                            style={{ backgroundColor: color }}
                            aria-hidden="true"
                        />
                        <span>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function MapView({ activeMap, onFeatureSelect }) {
    const [geoData, setGeoData] = useState(null);
    const [routeData, setRouteData] = useState(null);
    const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
    const [routeTripTime, setRouteTripTime] = useState(0);
    const widgets = useMemo(
        () => [new ZoomWidget({ placement: "bottom-left" })],
        []
    );

    useEffect(() => {
        const geoplacesUrl = `${import.meta.env.BASE_URL}data/geoplaces_moscow_4.geojson`;
        const routesUrl = `${import.meta.env.BASE_URL}data/routes.geojson`;

        Promise.all([
            fetch(geoplacesUrl).then((res) => {
                if (!res.ok) throw new Error(`Failed to load places: ${res.status}`);
                return res.json();
            }),
            fetch(routesUrl).then((res) => {
                if (!res.ok) throw new Error(`Failed to load routes: ${res.status}`);
                return res.json();
            }),
        ])
            .then(([placeData, routes]) => {
                const features = (placeData?.features || []).filter((feature) => Boolean(feature?.geometry));

                setGeoData({ ...placeData, features });
                setRouteData(routes);
            })
            .catch((err) => console.error(err));
    }, []);

    const onViewStateChange = useCallback(({ viewState: nextViewState }) => {
        setViewState(clampViewState(nextViewState));
    }, []);

    const selectFeature = useCallback(
        (object) => {
            const feature = unwrapFeatureObject(object);
            onFeatureSelect(isInspectableFeature(feature) ? feature : null);
        },
        [onFeatureSelect]
    );

    const allPlaceFeatures = geoData?.features ?? [];
    const geolocatedPlaceFeatures = useMemo(
        () => allPlaceFeatures.filter((feature) => isGeolocatedTrue(feature)),
        [allPlaceFeatures]
    );

    const pointFeatures = useMemo(
        () => geolocatedPlaceFeatures.filter((feature) => isPointGeometry(feature.geometry?.type)),
        [geolocatedPlaceFeatures]
    );

    const linePaths = useMemo(
        () =>
            toPathObjects(
                geolocatedPlaceFeatures.filter((feature) => isLineGeometry(feature.geometry?.type))
            ),
        [geolocatedPlaceFeatures]
    );

    const polygonFeatures = useMemo(
        () =>
            toPolygonObjects(
                geolocatedPlaceFeatures.filter((feature) => isPolygonGeometry(feature.geometry?.type))
            ),
        [geolocatedPlaceFeatures]
    );

    const routePaths = useMemo(
        () => toPathObjects(routeData?.features ?? []),
        [routeData]
    );

    const routeStopFeatures = useMemo(() => {
        return (routeData?.features ?? []).filter(
            (feature) => Boolean(getRouteIconPosition(feature))
        );
    }, [routeData]);

    const routeTrip = useMemo(() => buildRouteTrip(routeData), [routeData]);

    useEffect(() => {
        if (activeMap !== "Route" || !routeTrip) return undefined;

        let animationFrame;
        const startedAt = performance.now();

        const animateTrip = (now) => {
            const elapsedSeconds = (now - startedAt) / 1000;
            setRouteTripTime(elapsedSeconds % routeTrip.duration);
            animationFrame = requestAnimationFrame(animateTrip);
        };

        animationFrame = requestAnimationFrame(animateTrip);

        return () => cancelAnimationFrame(animationFrame);
    }, [activeMap, routeTrip]);

    const sentimentPoints = useMemo(
        () =>
            allPlaceFeatures
                .map((feature) => {
                    const position = getFeatureCenter(feature);
                    const weight = Number(feature?.properties?.sentiment);

                    if (!position || Number.isNaN(weight)) return null;

                    return { feature, position, weight };
                })
                .filter(Boolean),
        [allPlaceFeatures]
    );

    const buildPlaceLayers = useCallback(
        ({ muted = false } = {}) => {
            const lineColor = muted ? [...DARK_RED, 110] : [...DARK_RED, 200];
            const fillColor = muted ? [...DARK_RED, 55] : [...DARK_RED, 90];

            return [
                new SolidPolygonLayer({
                    id: `places-polygons-${muted ? "muted" : "full"}`,
                    data: polygonFeatures,
                    pickable: true,
                    stroked: true,
                    filled: true,
                    wireframe: false,
                    lineWidthUnits: "pixels",
                    lineWidthMinPixels: 2,
                    getPolygon: (d) => d.polygon,
                    getFillColor: fillColor,
                    getLineColor: lineColor,
                    onClick: (info) => selectFeature(info.object),
                }),
                new PathLayer({
                    id: `places-lines-${muted ? "muted" : "full"}`,
                    data: linePaths,
                    pickable: true,
                    widthUnits: "pixels",
                    widthMinPixels: muted ? 2 : 4,
                    rounded: true,
                    getPath: (d) => d.path,
                    getColor: lineColor,
                    onClick: (info) => selectFeature(info.object),
                }),
                new IconLayer({
                    id: `places-points-${muted ? "muted" : "full"}`,
                    data: pointFeatures,
                    pickable: true,
                    sizeUnits: "pixels",
                    getPosition: (feature) => feature.geometry.coordinates,
                    getIcon: () => ({
                        url: PLACE_ICON_URL,
                        width: 64,
                        height: 64,
                        anchorY: 60,
                        mask: true,
                    }),
                    getSize: muted ? 18 : 24,
                    getColor: lineColor,
                    onClick: (info) => selectFeature(info.object),
                }),
            ];
        },
        [linePaths, pointFeatures, polygonFeatures, selectFeature]
    );

    const layers = useMemo(() => {
        const base = [];

        if (activeMap === "Places") {
            return [...base, ...buildPlaceLayers()];
        }

        if (activeMap === "Route") {
            return [
                ...base,
                new PathLayer({
                    id: "routes-background",
                    data: routePaths,
                    pickable: true,
                    widthUnits: "pixels",
                    widthMinPixels: 3,
                    rounded: true,
                    getPath: (d) => d.path,
                    getColor: [...DARK_YELLOW, 80],
                    onClick: (info) => selectFeature(info.object),
                }),
                new TripsLayer({
                    id: "route-trip",
                    data: routeTrip ? [routeTrip] : [],
                    pickable: false,
                    widthUnits: "pixels",
                    widthMinPixels: 5,
                    rounded: true,
                    getPath: (trip) => trip.path,
                    getTimestamps: (trip) => trip.timestamps,
                    getColor: [...DARK_YELLOW, 255],
                    trailLength: ROUTE_TRAIL_LENGTH_SECONDS,
                    currentTime: routeTripTime,
                    fadeTrail: true,
                }),
                new IconLayer({
                    id: "route-stops",
                    data: routeStopFeatures,
                    pickable: true,
                    sizeUnits: "pixels",
                    getPosition: (feature) => getRouteIconPosition(feature),
                    getIcon: () => ({
                        url: PLACE_ICON_URL,
                        width: 64,
                        height: 64,
                        anchorY: 60,
                        mask: true,
                    }),
                    getSize: 22,
                    getColor: [...DARK_RED, 220],
                    onClick: (info) => selectFeature(info.object),
                }),
            ];
        }

        if (activeMap === "Sentiment") {
            return [
                ...base,
                new ContourLayer({
                    id: "sentiment-contours",
                    data: sentimentPoints,
                    cellSize: SENTIMENT_CELL_SIZE_METERS,
                    aggregation: "MEAN",
                    contours: SENTIMENT_CONTOURS,
                    getPosition: (d) => d.position,
                    getWeight: (d) => d.weight,
                    pickable: false,
                }),
            ];
        }

        return base;
    }, [
        activeMap,
        buildPlaceLayers,
        routePaths,
        routeTrip,
        routeTripTime,
        routeStopFeatures,
        selectFeature,
        sentimentPoints,
    ]);

    const getTooltip = useCallback((info) => {
        const feature = unwrapFeatureObject(info.object);
        const place = getFeatureProperties(feature).place;

        if (!place) return null;

        return { text: String(place) };
    }, []);

    return (
        <div
            style={{
                position: "relative",
                height: "100vh",
                width: "100vw",
                background: "#f2f2f2",
            }}
        >
            <DeckGL
                className="map"
                style={{ width: "100%", height: "100%" }}
                viewState={viewState}
                onViewStateChange={onViewStateChange}
                onClick={({ object }) => {
                    if (!object) onFeatureSelect(null);
                }}
                controller={{
                    scrollZoom: true,
                    dragPan: true,
                    dragRotate: false,
                    touchRotate: false,
                    minZoom: 9,
                    maxZoom: 20,
                }}
                parameters={{ clearColor: [0.95, 0.95, 0.95, 1] }}
                layers={layers}
                widgets={widgets}
                getTooltip={getTooltip}
            >
                <Map
                    mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
                    mapStyle="mapbox://styles/mapbox/light-v11"
                    style={{ width: "100%", height: "100%" }}
                />
            </DeckGL>
            {activeMap === "Sentiment" && <SentimentLegend />}
        </div>
    );
}
