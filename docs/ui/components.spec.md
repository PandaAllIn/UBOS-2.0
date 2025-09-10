---
version: 1.0.0
type: ui-components
status: proposed
author: UBOS Design
---

# UI Components — Spec

## OceanBackground
- Props: variant ('calm'|'active'), children
- Behavior: renders layered radial gradients; optional parallax on scroll.

## MetricCard
- Props: title, value, badge, series:number[], color? 
- Behavior: glass card with title row, metric row, Sparkline; onClick emits `select(title)`.

## Sparkline
- Props: data:number[], color, height
- Behavior: minimal line chart, animates on prop change.

## AlertsList
- Props: alerts: {level,message,timestamp}[]
- Behavior: renders chips per alert; level sets color; truncates to 6 by default.

## Section
- Props: title, actions?, children
- Behavior: section heading with action slot.

## NavHeader
- Props: title, status, actions[]
- Behavior: sticky header with glass blur, status pill, buttons.

## Acceptance Criteria
- [ ] Components render in isolation (Storybook or local examples).
- [ ] MetricCard supports long titles and large values without overflow.
- [ ] Sparkline animates under 16ms/frame on typical data sizes.
- [ ] AlertsList gracefully handles empty and error states.

