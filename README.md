# Moscow & Muscovites


Web app illustrating the locations of the early 19-th century book by journalist Vladimir Gilyarovski documenting the people and places of the Moscow of that time. 


This is a digital humanities project by Ivann Schlosser and Genie Razumovskaya

## Mapbox setup

The basemap uses Mapbox GL. Create a Mapbox public (`pk.`) access token with
the public read scopes required for styles and fonts, then add it to an
untracked `.env.local` file:

```env
VITE_MAPBOX_ACCESS_TOKEN=pk.your_public_token_here
```

The `.env.example` file documents the required variable without containing a
real token. Never put a secret (`sk.`) token in this project.

For the current local `npm run deploy` workflow, Vite reads `.env.local` while
building and `gh-pages` publishes the resulting `dist` directory. Because
GitHub Pages is a static client-side site, the public token will be visible in
the deployed JavaScript. Protect it with Mapbox URL restrictions for
`ischlo.github.io/gilyar-map` and use a separate restricted token for local
development. Rotate the token if it is abused.
