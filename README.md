# Velora Bureau

Static snapshot of the public site at `https://velorabureau.online/`, retrieved on July 15, 2026.

## Run locally

This is a production static build, so serve the directory over HTTP rather than opening `index.html` directly:

```sh
python3 -m http.server 3101 --directory .
```

Then visit `http://localhost:3101`.

## Contents

- `index.html` - page markup and audio controls
- `assets/index-DMYAzoyl.js` - production JavaScript bundle
- `assets/index-3AmnEz7r.css` - production stylesheet
- `assets/images/` - gallery images
- `assets/models/` - WebGL model
- `assets/audio/` - background audio

The available public site exposes bundled production assets, not its original source project. This repository preserves that runnable deployed version.
