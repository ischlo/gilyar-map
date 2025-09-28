import { MapContainer, TileLayer, Marker, Popup, ZoomControl, GeoJSON } from "react-leaflet";
import { useState, useEffect } from "react";

import "leaflet/dist/leaflet.css";
// import placesGeoJSON from "../../public/data/geoplaces_moscow_2.json";

export default function MapView({ activeMap }) {

    // Optional: dynamic fetch
    const [geoData, setGeoData] = useState(null);

    // useEffect(() => {
    //     if (activeMap === "Places") {
    //         // If fetching dynamically
    //         // fetch(placesGeoJSON)
    //         //     .then(res => res.json())
    //         //     .then(data => setGeoData(data));

    //         // If imported statically
    //         setGeoData(placesGeoJSON);
    //     } else {
    //         setGeoData(null); // clear for other maps
    //     }
    // }, [activeMap]);

    // console.log(geoData)

    const position = [55.75, 37.645]; // Moscow
    const bounds = [
        [55.4, 37.0], // Southwest corner
        [56.0, 38.2],       // Northeast corner
    ];

    return (
        <div style={{ position: "relative", height: "100vh", width: '100vw' }}>
            <MapContainer
                center={position}
                zoom={13}
                minZoom={9}
                className="map"
                style={{ height: "100%", width: "100%" }}
                maxBounds={[
                    bounds
                ]}
                maxBoundsViscosity={.3} // 1.0 = strictly stuck, 0 = elastic
                zoomControl={false}
            >
                <TileLayer
                    url="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
                />

                {/* Add zoom control bottom left */}
                <ZoomControl position="bottomleft" />

                {/* Conditionally render GeoJSON
                {activeMap === "Places" && geoData && (
                    <GeoJSON
                        data={geoData}
                        style={{ color: "red", weight: 2, fillOpacity: 1 }}
                        onEachFeature={(feature, layer) => {
                            if (feature.properties.name) {
                                layer.bindPopup(feature.properties.name);
                            }
                        }}
                    />
                )} */}

            </MapContainer>

        </div >
    );
}
