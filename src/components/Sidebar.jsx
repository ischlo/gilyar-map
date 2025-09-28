export default function Sidebar() {
    return (
        <div className="sidebar">
            <h1>Description</h1>

            <div className="box">
                <h2>Place</h2>
                <p>This is some sample text. You can replace it with dynamic content.</p>
            </div>

            <div className="box">
                <h2>Sentiment</h2>
                <p>Add more boxes here to show details alongside your map.</p>
            </div>

            <div className="box">
                <h2>Route</h2>
                <p>Add more boxes here to show details alongside your map.</p>
            </div>

            <div className="box">
                <h2>In context</h2>
                <p>You can also insert charts, tables, or any other React components.</p>
            </div>
        </div>
    );
}

