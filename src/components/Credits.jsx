function PlaceholderIconLink({ href, label, children }) {
    return (
        <a
            href={href}
            className="credits-icon-link"
            aria-label={label}
            onClick={(e) => e.preventDefault()}
        >
            {children}
        </a>
    );
}

export default function Credits() {
    return (
        <div className="credits">
            <div className="credits-row">
                <span className="credits-person">
                    <span className="credits-name">Genie Razumovskaya</span>
                    <PlaceholderIconLink href="#" label="Genie Razumovskaya on LinkedIn">
                        <i className="bi bi-linkedin" aria-hidden />
                    </PlaceholderIconLink>
                    <PlaceholderIconLink href="#" label="Email Genie Razumovskaya">
                        <i className="bi bi-envelope" aria-hidden />
                    </PlaceholderIconLink>
                </span>
                <span className="credits-sep" aria-hidden>
                    ·
                </span>
                <span className="credits-person">
                    <span className="credits-name">Ivann Schlosser</span>
                    <PlaceholderIconLink href="#" label="Ivann Schlosser on LinkedIn">
                        <i className="bi bi-linkedin" aria-hidden />
                    </PlaceholderIconLink>
                    <PlaceholderIconLink href="#" label="Email Ivann Schlosser">
                        <i className="bi bi-envelope" aria-hidden />
                    </PlaceholderIconLink>
                </span>
            </div>
            <p className="credits-year">
                <i>2025</i>
            </p>
        </div>
    );
}
