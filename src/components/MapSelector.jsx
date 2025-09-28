// src/components/MapSelector.jsx

// export default function MapSelector({ mapTopics, activeMap, setActiveMap }) {
//     return (
//         <div
//             style={{
//                 position: "absolute",
//                 top: "10px",
//                 left: "50%",
//                 transform: "translateX(-50%)",
//                 display: "flex",
//                 gap: "1rem",
//                 padding: "0.5rem 1rem",
//                 background: "rgba(255,255,255,0.5)", // default transparency
//                 borderRadius: "6px",
//                 zIndex: 1001,
//                 transition: "background 0.2s ease",
//             }}
//             onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,1)")}
//             onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.5)")}
//         >
//             {mapTopics.map((map) => (
//                 <button
//                     key={map}
//                     onClick={() => setActiveMap(map)}
//                     style={{
//                         padding: "0.3rem 0.6rem",
//                         borderRadius: "4px",
//                         border: "1px solid #ccc",
//                         cursor: "pointer",
//                         transition: "background 0.2s ease, color 0.2s ease",
//                         background: activeMap === map ? "#4f46e5" : "rgba(255,255,255,0.5)",
//                         color: activeMap === map ? "#fff" : "#000",
//                     }}
//                     onMouseEnter={(e) => {
//                         if (activeMap !== map) e.currentTarget.style.background = "rgba(255,255,255,1)";
//                     }}
//                     onMouseLeave={(e) => {
//                         if (activeMap !== map) e.currentTarget.style.background = "rgba(255,255,255,0.5)";
//                     }}
//                 >
//                     {map.toUpperCase()}
//                 </button>
//             ))}
//         </div>
//     );
// }


import { useState, useEffect } from "react";

export default function MapSelector({ mapTopics, activeMap, setActiveMap }) {

    const [isHovered, setIsHovered] = useState(false);
    const [showHint, setShowHint] = useState(true); // hint visible initially

    const buttonWidth = 100;
    const gap = 10;
    const container_width = (mapTopics.length - 1) * (buttonWidth + gap) - gap; // full expanded width
    const container_height = 80;

    // Hide the hint after 5 seconds on initial load
    useEffect(() => {
        const timer = setTimeout(() => setShowHint(false), 5000);
        return () => clearTimeout(timer);
    }, []);


    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                background: "transparent",
                zIndex: 1001,
                width: container_width,
                height: container_height, // enough to cover buttons vertically
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {mapTopics.map((map, index) => {
                // Calculate horizontal position when hovered
                const targetX = isHovered ? (index - 1) * (buttonWidth + gap) : 0;

                return (
                    <button
                        key={map}
                        onClick={() => setActiveMap(map)}
                        style={{
                            position: "absolute",
                            left: (container_width - buttonWidth) / 2,
                            top: "10px",
                            width: `${buttonWidth}px`,
                            transform: `translateX(${targetX}px)`,
                            transition: "transform 0.3s ease, opacity 0.3s ease",
                            padding: "0.3rem 0.6rem",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            cursor: "pointer",
                            background: activeMap === map ? "#4f46e5" : "rgba(255,255,255,0.85)",
                            color: activeMap === map ? "#fff" : "#000",
                            opacity: isHovered || activeMap === map ? 1 : 0,
                            zIndex: activeMap === map ? 2 : 1, // selected button on top
                            textAlign: "center",
                        }}
                    >
                        {map.toUpperCase()}

                    </button>
                );

            })}

            {/* Hint text */}
            {showHint && (
                <div
                    style={{
                        position: "absolute",
                        left: container_width / 2 + 10, // position it just to the right of buttons
                        top: container_height - 20,
                        transform: "translateY(-50%)",
                        background: "transparent",
                        color: "gray",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        whiteSpace: "nowrap",
                        pointerEvents: "none", // don't interfere with hover
                    }}
                >
                    Hover for more !
                </div>
            )}
        </div>
    );
}
