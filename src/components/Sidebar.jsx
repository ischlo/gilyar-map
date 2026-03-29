function SidebarBox({ title, value, emptyLabel }) {
    const content = value || emptyLabel;

    return (
        <div className="box">
            <h2>{title}</h2>
            <p>{content}</p>
        </div>
    );
}

export default function Sidebar({ selectedFeature, activeMap }) {
    const properties = selectedFeature?.properties ?? {};

    return (
        <div className="sidebar">
            <h1>Description</h1>

            <SidebarBox
                title="Place"
                value={properties.place}
                emptyLabel="Click a feature to inspect it."
            />

            <SidebarBox
                title="In context"
                value={properties.sentence}
                emptyLabel="The quoted sentence will appear here."
            />

            {activeMap === "Places" && (
                <SidebarBox
                    title="Demographic"
                    value={properties.social_groups}
                    emptyLabel="The related social groups will appear here."
                />
            )}
        </div>
    );
}
