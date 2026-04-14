# Hero Animation Performance Design

Date: 2026-04-06
Project: Frontend landing hero animations
Scope: Improve smoothness of both the `Waves` background animation and hero waveform bars while preserving the visual style.

## Goals

- Remove perceived lag in hero live animations on desktop and mobile.
- Keep the current aesthetic and interaction feel.
- Degrade gracefully on weaker devices and reduced-motion environments.

## Non-Goals

- No visual redesign of the hero section.
- No new dependencies.
- No backend or API changes.

## Current Performance Hotspots

1. `src/components/ui/Waves.tsx`
   - Performs per-point noise + cursor-force math every frame.
   - Updates many SVG paths every animation tick.
   - Runs continuously regardless of viewport visibility.

2. `src/components/sections/Hero.tsx`
   - Renders many waveform bars with independent inline CSS animations.
   - Continuous animation load can cause jank when combined with other effects.

## Proposed Approach (Recommended)

### 1) Adaptive Waves Engine

Introduce a lightweight runtime profile for `Waves` with three levels:

- `full`: desktop/high-capability context
- `balanced`: default mixed context
- `lite`: mobile/reduced-motion/low-capability context

Profile decision order and parameters are explicit:

1. If `prefers-reduced-motion` is true -> `lite`
2. Else if touch-capable and viewport width `< 768` -> `lite`
3. Else if `navigator.hardwareConcurrency` exists and `<= 4` -> `balanced`
4. Else -> `full`

If `hardwareConcurrency` is unavailable, use rule 2 + default to `balanced`.

Profile parameter matrix:

- `full`: `fpsCap=50`, `xGap=10`, `yGap=10`, `cursorForceScale=1.0`, `maxCursorDisplacement=50`
- `balanced`: `fpsCap=30`, `xGap=14`, `yGap=14`, `cursorForceScale=0.75`, `maxCursorDisplacement=36`
- `lite`: `fpsCap=25`, `xGap=18`, `yGap=18`, `cursorForceScale=0.45`, `maxCursorDisplacement=24`

Profile controls:

- target FPS cap (frame-throttled RAF)
- grid density (`xGap`, `yGap`)
- cursor interaction intensity

### 2) Visibility-Aware Rendering

Pause updates when animation is not useful using deterministic rules:

- If `document.hidden === true`: cancel RAF.
- If offscreen (`IntersectionObserver` ratio `< 0.05`): cancel RAF.
- Resume RAF only when visible and onscreen.
- On resume, reset `lastFrameTime` to `performance.now()` to avoid a large elapsed-time jump.
- Observer settings: `threshold: [0, 0.05, 0.2]`, `rootMargin: '0px'`.

### 3) Lower-Cost Hero Waveform Bars

Replace fully independent inline animation timings with a shared keyframe strategy:

- Add one shared class `.hero-wave-bar` with a single animation declaration.
- Keep index-based visual variation via CSS vars only (`--i`, `--h`, optional `--amp`).
- Use `animation-delay: calc(var(--i) * 48ms)` for staggering.
- Prefer transform-based motion (`scaleY`) over animating height where visually equivalent.
- Keep the bar count fixed and source heights as a memoized constant.

### 4) Motion Accessibility and Safety

- Respect `prefers-reduced-motion`: switch to static fallback.
- Keep robust null/bounds guards for refs and dimensions.
- Ensure listeners + RAF are always cleaned up on unmount.
- In `lite` mode, cursor-interaction force is heavily reduced and may be disabled for mobile smoothness.
- If `prefers-reduced-motion` is enabled, do not start `Waves` RAF and render a static frame.

## Component-Level Design

### `src/components/ui/Waves.tsx`

- Add profile detection at mount using:
  - `window.matchMedia('(prefers-reduced-motion: reduce)')`
  - viewport/touch hints
  - `navigator.hardwareConcurrency` (when available)
- Access `window`, `document`, and `navigator` only inside `useEffect`.
- Convert free-running RAF into frame-capped loop with elapsed-time gating.
- Make `setLines` density configurable by profile.
- Add visibility flags driven by:
  - `document.visibilityState`
  - `IntersectionObserver`
- Tick only when active and due for update.
- Keep touch handling non-blocking for scrolling; avoid `preventDefault` unless strictly required.
- If reduced-motion is active, initialize lines once and skip continuous animation.

### `src/components/sections/Hero.tsx`

- Keep existing bar list structure.
- Shift from inline per-item `animation` strings to one shared class/keyframes.
- Keep per-bar variation via CSS custom properties (`--i`, `--h`, optional `--amp`).

### `src/styles/globals.css` (or local style scope)

- Add optimized hero waveform keyframes.
- Add reduced-motion overrides for waveform classes.
- Ensure no infinite hero animation runs under reduced-motion mode.

## Data Flow

1. Mount `Waves`.
2. Compute `performanceProfile`.
3. Initialize grid according to profile.
4. If reduced-motion is off, start RAF loop with FPS cap; otherwise keep static frame only.
5. For each eligible tick:
   - update mouse smoothing
   - move points
   - draw paths
6. If hidden/offscreen, cancel RAF and stop updates.
7. On unmount, cancel RAF and remove listeners.

## Error Handling and Edge Cases

- If refs are unavailable, skip frame work.
- If container dimensions are zero, avoid building lines until valid size exists.
- Ensure observer/listener cleanup even on early exits.
- Fallback defaults when environment hints are unavailable.

## Testing and Verification Plan

1. Static checks
   - `npm run lint`
   - `npm run type-check`

2. Functional checks
   - Home page hero loads and animates on desktop and mobile widths.
   - No runtime errors during mount/unmount and route transitions.

3. Performance checks
   - Capture baseline-before/after using the same commit baseline tag and same optimized commit.
   - Keep browser version, viewport, and device power mode identical.
   - Use warm cache and start recording after a 2s settle period.
   - Use browser Performance panel with a 10s recording on hero view.
   - Run 3 recordings and report the median.
   - Compare scripting/rendering time before vs after optimization.
   - Verify RAF updates stop when tab hidden and when hero is offscreen.
   - Confirm reduced-motion environment disables infinite hero motion.
   - Run a simple matrix: Chrome desktop, Chrome mobile emulation, and Safari.

## Rollout Plan

1. Implement adaptive `Waves` profile + capped RAF.
2. Add visibility-based pause/resume.
3. Optimize hero waveform bar animation strategy.
4. Add reduced-motion fallbacks.
5. Run verification and adjust profile thresholds if needed.

## Risks and Mitigations

- Risk: Visual feel changes too much in `lite` mode.
  - Mitigation: Keep shape language and tune thresholds conservatively.

- Risk: Observer lifecycle bugs.
  - Mitigation: Centralize cleanup and add mount/unmount checks.

- Risk: Over-throttling on strong devices.
  - Mitigation: Use profile-based defaults and quick manual tuning.

## Success Criteria

- `Waves` frame interval p95 is <= 21ms in `full` profile while hero is visible.
- `Waves` frame interval p95 is <= 40ms in `lite` profile while hero is visible.
- Main-thread scripting time in hero section is reduced by >= 30% on mobile viewport versus baseline.
- Hidden tab or offscreen hero results in no active RAF loop for `Waves`.
- Hero waveform no longer uses inline per-bar `animation` strings.
- Reduced-motion mode has no infinite hero animations.
- Reduced-motion mode does not run `Waves` RAF.
- No regressions in layout, theme, or interaction.
