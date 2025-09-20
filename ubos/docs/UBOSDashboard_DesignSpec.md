# UBOS Dashboard — Tide Guide Inspired Design

Project: EUFM (European Union Funds Manager) — AI Agent Orchestration System

Goal: Adapt Tide Guide’s SwiftUI aesthetics and interaction patterns to a UBOS dashboard that visualizes citizen activity, agent performance, territory health, and governance data. Emphasis on muted oceanic backgrounds, clean line graphs, progressive disclosure, and iOS-native feel.

## Design Study Summary (Tide Guide by Tucker MacDonald)

Observed characteristics (from public materials and Apple design language):
- Ocean palette: deep navy/indigo bases with teal/aqua accents; soft gradients evoke depth and calm.
- Clean line graphs: smooth curves, thin strokes, subtle gradient fills, gentle gridlines, clear peaks/valleys.
- Progressive disclosure: compact summaries expand to detail views and then to full tables/insights; scrubbing overlays for precise values.
- Hierarchy and negative space: large headings, quiet cards, soft inner shadows, and SF fonts for clarity.
- Material/translucency: occasional blurred backdrops to establish depth without visual noise.

## Visual Language for UBOS

- Colors (tokens):
  - `bg.primary`: #0B1220 (navy)
  - `bg.secondary`: #121A2B (slate)
  - `accent.primary`: #49C0C7 (aqua)
  - `accent.secondary`: #2DA1A8 (teal)
  - `neutral.100/300/500/700`: #F5F7FA / #C9D3E0 / #8CA0B3 / #5E6C82
  - `danger/ok/warn`: #E76F51 / #43D17C / #F4A261
  - `gridline`: rgba(255,255,255,0.08)

- Typography:
  - SF Pro / SF Rounded for numerics; medium to semibold for headlines, regular for body.
  - Large numeric readouts on cards with letterspacing tightened.

- Surfaces:
  - Cards on `bg.secondary` with 8–12 pt corner radius, very soft inner shadow, 1px border using `gridline`.
  - Optional `.ultraThinMaterial` overlays for expanded details.

## Charting Principles

- Line graphs first; thin strokes (1.5–2.0pt), cubic smoothing.
- Gradient area fill below line using `accent.primary → transparent`.
- Gridlines at low contrast (`gridline`), padded axes, no heavy borders.
- Scrubbing overlay: dot marker + value callout; fade-in/out on interaction.

## Progressive Disclosure (Depth Levels)

- Depth 0 — Minimal: sparkline + key metric, no axes.
- Depth 1 — Standard: labeled axes, scrubbing, 24–48h window.
- Depth 2 — Expanded: comparison overlays (targets/bands), annotations, table toggle.

## Information Architecture Mapping

1) Citizen Activity
   - Primary: activity rate over time (sparkline → detailed curve)
   - Secondary: daily peaks, engagement windows
   - Alerts: anomalies (spikes/drops)

2) Agent Performance
   - Primary: success rate or throughput trend
   - Secondary: latency, cost per task
   - Comparisons: per-agent overlay; badges for SLO compliance

3) Territory Health
   - Primary: composite health index trend
   - Secondary: components (economy, environment, infrastructure)
   - Bands: healthy/attention/critical background ranges

4) Governance
   - Primary: policy adoption trend, decision throughput
   - Secondary: backlog age, compliance rate
   - Drill-down: table of measures with status chips

## Interaction Patterns

- Tap-to-expand cards; use `.sheet` or `.navigationDestination` for deep dives.
- Scrub gestures reveal contextual values.
- Segmented control for time ranges (24h / 7d / 30d); detail increases with range.
- Pull-to-refresh and smooth transitions (`.transition(.opacity.combined(with: .move))`).

## Specs-Driven UI

- Central spec JSON defines palette tokens, depth levels, modules, and per-module chart options.
- Client (SwiftUI) maps tokens to colors, stroke widths, and component visibility.
- Server/agents can update spec to evolve UI without shipping new app logic.

Artifacts in repo:
- `specs/ubos_dashboard_spec.json`: canonical design/IA spec.
- `ios/UBOSDashboardUI`: Swift Package with modular SwiftUI components (cards, line chart, depth model) for quick integration.

## Upgrade Path

1) v0 — Prototype visuals: muted backgrounds, sparkline cards, minimal interactivity.
2) v1 — Charts+Scrub: axis labels, scrubbing, gradients, time ranges.
3) v2 — Overlays: bands, comparisons, annotations.
4) v3 — Live data: websockets, per-agent overlays, persistence of view state.
5) v4 — Governance drill-downs: tables, filters, export.

