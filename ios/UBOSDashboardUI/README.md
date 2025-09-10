# UBOSDashboardUI (SwiftUI Package)

A minimal SwiftUI package that captures Tide Guide–inspired aesthetics for the UBOS dashboard:
- Muted oceanic backgrounds
- Clean, smooth line charts (sparklines)
- Modular cards and configurable depth levels (Minimal / Standard / Expanded)

Contents:
- `Palette.swift`: Design tokens for colors
- `DepthLevel.swift`: Environment-driven disclosure level
- `Sparkline.swift`: Lightweight smooth line chart with optional gradient fill and gridlines
- `DashboardCard.swift`: Title + value + sparkline card
- `UBOSDashboardPreview.swift`: A preview/dashboard scaffold for quick iteration

Usage:
- Open this folder with Xcode and add as a Swift Package dependency, or drag the `Sources` into an iOS app target (iOS 16+).
- Present `UBOSDashboardPreview()` inside your app to explore the look and feel.

Upgrade Path:
- Replace `Sparkline` with Charts `LineMark` when feasible.
- Add scrubbing overlays, bands, annotations driven by `specs/ubos_dashboard_spec.json`.

