# Expander Component

A modern, flexible expander component for React that can be positioned on any side of the screen with smooth animations.

## Features

- **Flexible Positioning**: Can be placed on left, right, top, or bottom
- **Orientation-Aware Text**: Horizontal bars show normal text, vertical bars show rotated text
- **Size Options**: Full width/height or content-sized
- **Smooth Animations**: CSS transitions with easing for expand/collapse
- **Modern Design**: Glassmorphism effect with backdrop blur and gradients
- **Accessibility**: Proper ARIA labels and focus management
- **TypeScript Support**: Fully typed with TypeScript

## Props

```typescript
interface ExpanderProps {
  children: ReactNode;           // Content to display when expanded
  title: string;                 // Text to show on the toggle button
  position: "left" | "right" | "top" | "bottom";  // Position of the expander
  size?: "full" | "content";     // Size behavior (default: "content")
  isDocked?: boolean;            // Initial docked state (default: false)
  onToggle?: (isDocked: boolean) => void;  // Callback when toggle state changes
  className?: string;            // Additional CSS classes
}
```

## Usage Examples

### Bottom Layers Panel (Full Width)
```tsx
<Expander
  title="Layers"
  position="bottom"
  size="full"
  isDocked={true}
  onToggle={setIsDocked}
>
  <LayersPanel />
</Expander>
```

### Right Side Panel (Content Size)
```tsx
<Expander
  title="Filters"
  position="right"
  size="content"
  isDocked={false}
>
  <FiltersPanel />
</Expander>
```

### Left Side Panel with Custom Styling
```tsx
<Expander
  title="Tools"
  position="left"
  size="content"
  className="custom-tools-panel"
>
  <ToolsContent />
</Expander>
```

## Positioning

- **Left/Right**: Vertical toggle button with rotated text
- **Top/Bottom**: Horizontal toggle button with normal text

## Size Options

- **full**: Takes full width (horizontal) or height (vertical) of container
- **content**: Sizes based on content, with minimum toggle button size

## Styling

The component uses CSS custom properties and can be customized by overriding the following classes:

- `.expander` - Main container
- `.expander-toggle` - Toggle button
- `.expander-content` - Content area
- `.expander-title` - Title text
- `.vertical-text` - Rotated text for vertical positions

## Animation

The component includes smooth animations for:
- Expand/collapse transitions
- Hover effects on toggle button
- Slide-in animations when expanding

## Accessibility

- Proper ARIA labels for screen readers
- Keyboard focus management
- Semantic button element for toggle functionality