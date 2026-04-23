# OmniSphere

OmniSphere is a cross-platform React Native application for exploring the IOTA validator ecosystem through an interactive 3D globe, live network metrics, validator analytics, and configurable runtime behavior.

Built with Expo + Expo Router, the app runs on iOS, Android, and web from one codebase.

## Table of contents

- [Overview](#overview)
- [Core features](#core-features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Data flow](#data-flow)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Available scripts](#available-scripts)
- [Caching and refresh behavior](#caching-and-refresh-behavior)
- [Troubleshooting](#troubleshooting)
- [Development notes](#development-notes)

## Overview

OmniSphere focuses on operational visibility of the validator network:

- A performant 3D globe experience with validator markers and selection overlays.
- A compact dashboard for epoch and stake health signals.
- A validators tab for deep sorting, filtering, and metric inspection.
- An analytics tab for voting power distribution and APY comparisons.
- A settings system for theme, auto-rotation, refresh interval, and cache management.

## Screenshots

<div style="display: flex; flex-direction: row; flex-wrap: wrap; gap: 10px;">
  <img src="./assets/images/globe-light.png" width="200" alt="Globe (Light Mode)" />
  <img src="./assets/images/globe-dark.png" width="200" alt="Globe (Dark Mode)" />
  <img src="./assets/images/globe-clusters.png" width="200" alt="Globe Node Cluster" />
  <img src="./assets/images/nodes.png" width="200" alt="Validators List" />
  <img src="./assets/images/analytics.png" width="200" alt="Analytics Dashboard" />
  <img src="./assets/images/settings.png" width="200" alt="Settings" />
</div>

## Core features

### 3D globe experience

- COBE-based globe rendered inside a WebView/iframe bridge.
- Real-time marker projection with selection support.
- Single-validator and multi-validator overlay cards.
- Gesture support: drag, momentum, pinch-to-zoom, tap-to-select.

### Network dashboard

- Epoch progress and remaining time.
- Total stake, average APY, active validator count, and gas price.
- Live refresh driven by React Query and user-configurable intervals.

### Validators workspace

- Search by name/address.
- Sort by stake, voting power, APY, or name.
- Expandable metric cards per validator.

### Analytics workspace

- Interactive voting power donut visualization.
- Validator leaderboard cards.
- APY carousel for high-yield comparison.
- Pull-to-refresh support.

### Operational settings

- Light and dark themes.
- Configurable refresh interval (15s / 30s / 60s).
- Auto-rotation control for the globe.
- Clear geolocation cache action.

## Tech stack

- React Native 0.81 + React 19
- Expo SDK 54
- Expo Router (file-based navigation and API routes)
- @tanstack/react-query for data fetching and caching
- react-native-webview for native globe rendering
- COBE for 3D globe rendering
- TypeScript (strict mode)
- ESLint (expo flat config)

## Project structure

```text
app/
   _layout.tsx                 # Root providers, navigation stack, boot animation
   api/validators+api.ts       # Internal API proxy to IOTA RPC
   (tabs)/
      _layout.tsx               # Tab navigation and custom tab bar styling
      index.tsx                 # Home: globe + dashboard
      validators.tsx            # Validator explorer
      analytics.tsx             # Network analytics
      settings.tsx              # Runtime configuration

components/
   globe/                      # Globe, overlays, WebView bridge, HTML scripts
   dashboard/                  # Network summary cards
   social/                     # Optional X feed WebView component

hooks/
   use-validators.ts           # React Query hook for validator payload
   use-validator-locations.ts  # Geolocation resolution query
   use-settings.tsx            # Persistent UI/runtime settings

services/
   api/client.ts               # Internal API fetch wrapper
   validators.ts               # Validators service contracts
   validator-location/         # DNS + GeoIP resolution and cache layer

utils/
   spherical-hash.ts           # Deterministic fallback coordinates
```

## Data flow

1. UI requests validator data through `useValidators`.
2. Client calls internal route `GET /api/validators`.
3. API route proxies two RPC methods in parallel:
   - `iotax_getLatestIotaSystemStateV2`
   - `iotax_getValidatorsApy`
4. Geolocation pipeline resolves validator hosts to IPv4 and GeoIP coordinates.
5. Globe bridge pushes normalized marker payloads to the WebView renderer.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Application

```bash
npm start
```

In the output, you'll find options to open the app in an:

- Android emulator (press `a`)
- iOS simulator (press `i`)
- Web browser (press `w`)

## Technology Stack

- [Expo](https://expo.dev/)
- React Native & Reanimated
- React Navigation
- React Query
- Cobe (3D Globe)

