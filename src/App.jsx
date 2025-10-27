import MapView from "./components/MapView";
import Credits from "./components/Credits";
import Sidebar from './components/Sidebar';
import MapSelector from "./components/MapSelector";

import "./index.css";

import { useState } from "react";

export default function App() {

  const map_topics = ["Places", 'Sentiment', 'Route'];

  const [activeMap, setActiveMap] = useState(map_topics[0]);

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw" }}>

      {/* Overlayed title box */}
      <div
        style={{
          position: "absolute",
          top: "1vh",
          left: "1vw",
          background: "white",
          margin: '10px',
          padding: "10px",
          zIndex: 1000,
          borderRadius: "4px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          fontWeight: "bold"
        }}
      >
        <h3>Moscow & Muscovites</h3>
        <p> <i>1926</i> </p>
        <p>Vladimir Gilyarovski</p>

      </div>


      <MapView activeMap={activeMap} />

      <MapSelector
        mapTopics={map_topics}
        activeMap={activeMap}
        setActiveMap={setActiveMap}
      />

      <Sidebar />

      <Credits />

    </div>
  );
}