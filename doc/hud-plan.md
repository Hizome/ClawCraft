# ClawCraft HUD Plan

## Goal

ClawCraft will support two HUD systems in parallel:

1. `Classic HUD`
   - Warcraft III inspired
   - Uses the existing `warcraft-3-ui` style assets
   - Keeps the nostalgic stone-frame presentation
   - Best suited for race-specific presentation and atmosphere

2. `Modern HUD`
   - Built with React + Tailwind
   - Cleaner information hierarchy
   - Better suited for debugging, productivity, and tool-heavy workflows
   - Easier to evolve into a desktop control surface

The long-term direction is not to replace one with the other immediately.
The project should keep both, and let ClawCraft choose the HUD style based on mode, user preference, or workflow.

## Why Two HUDs

The two HUDs solve different problems:

- `Classic HUD`
  - strong Warcraft identity
  - matches the current race-based scene direction
  - good for immersive presentation

- `Modern HUD`
  - easier to read and maintain
  - easier to integrate debug panels, runtime state, task lists, approvals, and chat
  - better base for future OpenClaw workflow features

This means:

- the `Classic HUD` is the themed game shell
- the `Modern HUD` is the efficient operator shell

## Current Baseline

Current state:

- race selection already exists
- static map background exists
- MDX model stage exists
- classic Warcraft-style HUD exists
- the project can already render a first test building on top of the map

## Planned Architecture

The HUD system should be split into shared scene content and two separate HUD layers.

Shared scene layer:

- static background map
- MDX building and unit stage
- scene configuration loaded from race JSON
- future selection, hover, and interaction state

HUD layer A: `Classic HUD`

- existing race-themed Warcraft layout
- top bar, bottom bar, Warcraft buttons
- visual priority is authenticity

HUD layer B: `Modern HUD`

- built with Tailwind components
- uses panels, cards, badges, tabs, lists, and compact controls
- visual priority is clarity and speed

Both HUDs should consume the same scene state.

## Data Model Direction

Race layout JSON should remain the source of truth for scene placement.

Each race JSON will eventually contain:

- buildings
- units
- optional camera defaults
- optional HUD defaults
- optional foreground masking data

This keeps both HUD systems reading from the same scene description.

## Implementation Phases

### Phase 1: Stabilize Classic HUD

- keep the existing Warcraft HUD working
- continue moving model placement into JSON
- make the debug panel able to export placement data back into JSON format

### Phase 2: Introduce Modern HUD

- create a Tailwind-based HUD shell
- add a top command bar
- add a right-side mission / task / runtime panel
- add a bottom selection panel for unit and building info

### Phase 3: HUD Switching

- add a HUD mode switch
- `classic`
- `modern`
- persist user preference locally

### Phase 4: Shared Interaction Layer

- selection state shared between both HUDs
- building detail panel
- unit detail panel
- task status reflected in both HUDs

## Immediate Next Steps

1. Continue storing building placement in race JSON.
2. Add JSON support for camera defaults.
3. Add `Copy JSON` or `Export JSON` from the MDX debug panel.
4. Create the first Tailwind `Modern HUD` prototype without removing the current classic HUD.

## Rule Going Forward

Until explicitly changed:

- `Classic HUD` remains the main immersive display
- `Modern HUD` is developed in parallel as a second presentation mode
- both HUDs must read from the same scene and layout data
