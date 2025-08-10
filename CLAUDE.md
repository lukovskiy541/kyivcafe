# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a vanilla JavaScript web application for exploring cafes in Kyiv. It's a client-side only application that uses the Overpass API to fetch cafe data from OpenStreetMap and displays them on an interactive Leaflet.js map. The application is automatically deployed to GitHub Pages.

## Core Architecture

The application is built around a single main class `KyivCafeApp` in `script.js` that manages:

- **Map Management**: Leaflet.js map initialization and control
- **Data Fetching**: Asynchronous loading of cafe data from Overpass API
- **State Management**: Cafe status (new/visited/disliked) stored in localStorage
- **UI Interactions**: Filter controls, modal dialogs, and geolocation functionality
- **Marker System**: Custom colored markers representing different cafe statuses

### Key Components

- `index.html`: Single page application structure with modal overlay for cafe details
- `script.js`: Main `KyivCafeApp` class containing all application logic
- `style.css`: Complete styling including responsive design and animations

### Data Flow

1. App initializes Leaflet map centered on Kyiv
2. Fetches cafe data via POST request to Overpass API with bounding box query
3. Processes elements into cafe objects with status from localStorage
4. Creates Leaflet markers with custom icons based on status
5. Applies current filter to show/hide markers
6. User interactions update localStorage and refresh UI

## Development Commands

### Local Development
```bash
# Start simple HTTP server for testing
python -m http.server 8000
# OR
npx serve .

# Open in browser
# http://localhost:8000
```

### Testing
No automated testing framework is configured. Test manually by:
- Verifying map loads and centers on Kyiv
- Clicking cafe markers to open modal
- Testing filter buttons
- Testing geolocation "Find Me" functionality
- Verifying localStorage persistence across page reloads

## API Integration

The app uses Overpass API (https://overpass-api.de/api/interpreter) to query OpenStreetMap data:

```javascript
// Bounding box covers Kyiv metropolitan area
const overpassQuery = `
    [out:json][timeout:25];
    (
      node["amenity"="cafe"](50.1,30.0,50.8,31.0);
      way["amenity"="cafe"](50.1,30.0,50.8,31.0);
      relation["amenity"="cafe"](50.1,30.0,50.8,31.0);
    );
    out geom;
`;
```

## State Management

User data is persisted in localStorage under key `'kyiv-cafe-statuses'` as JSON:
```javascript
{
  "cafeId1": "visited",
  "cafeId2": "disliked",
  // ... other cafe statuses
}
```

## Styling Architecture

CSS follows a component-based approach with:
- Global reset and base styles
- Header component with filters and controls
- Map container styling
- Modal overlay components
- Custom marker styling via Leaflet divIcon
- Responsive breakpoints for mobile devices

## Geolocation Feature

The "Find Me" button uses browser Geolocation API with:
- High accuracy positioning when available
- 10-second timeout with fallback error handling
- Custom blue user location marker distinct from cafe markers
- Automatic map centering on user location with zoom level 15

## Deployment

Automatic deployment to GitHub Pages occurs on push to master branch. No build process is required as this is a static site with no compilation steps.

## Browser Compatibility

Targets modern browsers with ES6+ support. Uses:
- `async/await` syntax
- Template literals
- Arrow functions  
- `fetch()` API
- Geolocation API
- localStorage