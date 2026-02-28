# Boondit Design System (R1 Edition)

This document outlines the core design principles and components used across the Boondit site, particularly the Rabbit R1 toolset.

## Core Principles

1.  **Glassmorphism**: Surfaces use semi-transparent backgrounds with backdrop blur to create depth.
2.  **Mono Aesthetic**: Typography leans heavily into monospace fonts for a "hacker" and "utility" feel.
3.  **Accent Palette**:
    *   **Pink**: Primary accent, used for required fields and primary actions.
    *   **Purple**: Secondary accent, used for optional fields and secondary groupings.
    *   **Gray/White**: Neutral grounding colors.
4.  **Corner Brackets**: A signature visual element used to define the boundaries of cards and sections.

## Components

### 1. R1Card (`src/components/ui/R1Card.astro`)
The standard container for all tool modules.
*   **Props**: `title`, `accent` (pink/purple/gray), `corners` (all/none/specific), `headerBar` (bool).
*   **Usage**: Wraps forms, previews, and logs.

### 2. R1Header (`src/components/ui/R1Header.astro`)
Consistent page titles.
*   **Props**: `title`, `description`.
*   **Usage**: At the top of every major utility page.

### 3. R1Banner (`src/components/ui/R1Banner.astro`)
Informational or warning callouts.
*   **Types**: `info`, `warning`, `error`, `success`.
*   **Usage**: For "Sensitive Data" warnings or "Auto Flash" recommendations.

## Layout Patterns

*   **2-Column Grid**: Used for Form vs. Preview logic.
*   **3-Column Grid**: Used for complex tools like the Flash Utility (Controls vs. Sidebar).
*   **Tabbed Interfaces**: Should be used when vertical space exceeds 1.5x viewport height to reduce clutter.

## Typography

*   **Primary**: Retro (Inter Variable)
*   **Monospace**: JetBrains Mono / SFMono / Courier New (used for code, headers, and metadata labels).
