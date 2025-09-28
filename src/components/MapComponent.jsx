import { MapContainer, TileLayer, Marker, Popup, useMapEvents, ZoomControl } from "react-leaflet";

function MapUpdater({ mapState, onMove }) {
    useMapEvents({
        moveend: (e) => {
            const map = e.target;
            onMove(map.getCenter(), map.getZoom());
        }
    });
    return null;
}

export default function MapComponent({ mapState, onMove }) {

    const bounds = [
        [55.4, 37.0], // Southwest corner
        [56.0, 38.2],       // Northeast corner
    ];

    return (
        <MapContainer
            center={mapState.center}
            zoom={mapState.zoom}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            maxBounds={bounds}
            maxBoundsViscosity={0.3}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
                url="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png"
            />

            <ZoomControl position="bottomleft" />

            {/* Synchronize map state */}
            <MapUpdater mapState={mapState} onMove={onMove} />

        </MapContainer>

    );
}
