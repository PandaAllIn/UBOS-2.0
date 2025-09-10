---
version: 1.0.0
type: ui-spec
status: proposed
author: UBOS Design
---

# Tide Guide Dashboard (Web Replica) — Product Spec

## Intent
Deliver a Tide Guide–inspired dashboard that visualizes UBOS health with ocean‑themed depth, clarity, and motion. Runs in web/Electron/iPad. Uses existing UBOS APIs.

## Layout
- Header: Title, status pill, global controls (Refresh, Theme, Export)
- Metrics Row (4): Citizens Active • Agents Runs • Memory Notes • Funding Opportunities
- Sections: Recent Alerts • Territories • Agent Activity • Opportunities (top N)
- Depth & Motion: soft gradients, subtle parallax, sparkline motion on updates

## Data Contracts
- GET /api/status → { system: { agents {active,completed,failed}, memory {notes,sizeKB}, costs }, eufmProject { phase, progress, fundingOpportunities } }
- GET /api/alerts → Array<{ level: 'info'|'warning'|'error', message: string, timestamp: ISO }>
- GET /api/tools, /api/subscriptions, /api/opportunities (optional views)
- WebSocket: forward progress/notify/alert events (optional live mode)

## Interactions
- Metric cards: tap to reveal details (sheet/panel) with last 24h trend and breakdown.
- Alerts: tap to expand message, copy action, deep link to related spec/run if available.
- Global Refresh: pulls fresh status and alerts.
- Live mode: (optional) toggle to subscribe to WS updates.

## Visual System
- Ocean gradient background (dark default) with radial accents.
- Cards: glassy surfaces (low‑alpha), soft shadows, 12–16px radius.
- Typography: SF Pro (or system UI), strong weights on metrics.
- Charts: minimal sparklines with rounded strokes, transitions on data change.
- Color coding: ok=#06d6a0 warn=#ffb703 err=#ef476f accent=#00c2b2.

## Accessibility
- Sufficient color contrast for text on glass backgrounds.
- Reduced motion setting disables transitions.
- Keyboard navigation across controls and cards.

## Acceptance Criteria
- [ ] Loads and renders metrics using /api/status within 500ms on LAN.
- [ ] Alerts panel shows last up to 6 alerts with timestamps.
- [ ] Metric cards update on Refresh and animate chart path.
- [ ] Works in Safari (iPadOS), Chrome, and Electron on macOS 13.
- [ ] Dark mode default; gradients and cards render without banding.

