import { MapContainer, TileLayer, Marker, Popup, ZoomControl, GeoJSON } from "react-leaflet";
import { useState, useEffect } from "react";

import "leaflet/dist/leaflet.css";
// import placesGeoJSON from "../../public/data/geoplaces_moscow_3.json";

export default function MapView({ activeMap }) {

    // Optional: dynamic fetch
    const [geoData, setGeoData] = useState(null);

    useEffect(() => {
        // fetch("https://raw.githubusercontent.com/evgeniiaraz/moscow_muscovites/main/data/geoplaces_moscow_3.geojson")
        fetch(`${import.meta.env.BASE_URL}data/geoplaces_moscow_3.json`)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
                return res.json();
            })
            // .then(data => setGeoData(data))
            .then(
                data => {
                    console.log(data)
                    // Filter out only features where geolocated === true
                    const filtered = {
                        ...data,
                        features: data.features.filter(f => f.properties.geolocated == true)
                    };
                    setGeoData(filtered);
                    // setGeoData
                })
            .catch(err => console.error(err));
    }, []);

    // console.log(geoData)
    console.log(activeMap);

    const position = [55.75, 37.645]; // Moscow

    const bounds = [
        [55.4, 37.0], // Southwest corner
        [56.0, 38.2], // Northeast corner
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

                {/* Conditionally render GeoJSON */}
                {/* {geoData && <GeoJSON data={geoData} />} */}

                {activeMap === "Places" && geoData && (
                    <GeoJSON
                        data={geoData}
                        style={{
                            color: "darkred",
                            fillColor: "darkred",
                            weight: 4,
                            fillOpacity: .3,
                            opacity: .3,
                        }}
                        pointToLayer={(feature, latlng) =>
                            L.circleMarker(latlng, {
                                radius: 8,
                                fillColor: "darkred",
                                color: "darkred",
                                weight: 3,
                                opacity: .8,
                                fillOpacity: 0.8,
                            })
                        }
                        onEachFeature={(feature, layer) => {
                            if (feature.properties.name) {
                                layer.bindPopup(feature.properties.name);
                            }
                        }}
                    />

                    // <GeoJSON
                    //     data={{
                    //         ...geoData,
                    //         features: geoData.features.map(f => ({
                    //             ...f,
                    //             geometry: {
                    //                 ...f.geometry,
                    //                 coordinates: f.geometry.coordinates.map(([lon, lat]) => [lat, lon])
                    //             }
                    //         }))
                    //     }}
                    // />
                    // <GeoJSON data={{
                    //     type: "FeatureCollection",
                    //     features: [{
                    //         type: "Feature",
                    //         geometry: { type: "Point", coordinates: [position[1], position[0]] },
                    //         properties: { name: "Moscow Center" },
                    //     }]
                    // }}
                    //     style={{ color: "darkred", weight: 10, fillOpacity: 1, radius: 100, }}
                    // />

                )}

            </MapContainer>

        </div >
    );
}
