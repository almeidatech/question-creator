# 🎨 Design Tokens System

**Version:** 1.0 | **Status:** ✅ Complete | **Format:** Tailwind CSS + TypeScript

---

## 📋 Table of Contents

1. [Color System](#color-system)
2. [Typography](#typography)
3. [Spacing & Layout](#spacing--layout)
4. [Border Radius](#border-radius)
5. [Shadows](#shadows)
6. [Z-Index Layers](#z-index-layers)
7. [Animations](#animations)
8. [Breakpoints](#breakpoints)
9. [Implementation Guide](#implementation-guide)

---

## Color System

### Primary Colors (Legal Blue - Constitutional Law Theme)

```css
--primary-50: #eff6ff;   /* Lightest, hover backgrounds */
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6;  /* Main primary - buttons, links */
--primary-600: #2563eb;  /* Hover state */
--primary-700: #1d4ed8;  /* Active/pressed state */
--primary-800: #1e40af;
--primary-900: #1e3a8a;  /* Darkest, text on light bg */
```

**Usage:**
- Primary buttons
- Links (focus states)
- Active navigation items
- Section headers
- Loading spinners

---

### Success Colors (Green)

```css
--success-50: #f0fdf4;
--success-100: #dcfce7;
--success-200: #bbf7d0;
--success-300: #86efac;
--success-400: #4ade80;
--success-500: #22c55e;  /* Main success */
--success-600: #16a34a;  /* Hover */
--success-700: #15803d;  /* Active */
--success-800: #166534;
--success-900: #0f5620;
```

**Usage:**
- Correct answer badges
- Success messages
- Checkmarks
- Positive feedback

---

### Error Colors (Red)

```css
--error-50: #fef2f2;
--error-100: #fee2e2;
--error-200: #fecaca;
--error-300: #fca5a5;
--error-400: #f87171;
--error-500: #ef4444;   /* Main error */
--error-600: #dc2626;   /* Hover */
--error-700: #b91c1c;   /* Active */
--error-800: #991b1b;
--error-900: #7f1d1d;
```

**Usage:**
- Wrong answer badges
- Error messages
- Validation errors
- Delete confirmations

---

### Warning Colors (Amber)

```css
--warning-50: #fffbeb;
--warning-100: #fef3c7;
--warning-200: #fde68a;
--warning-300: #fcd34d;
--warning-400: #fbbf24;
--warning-500: #f59e0b;  /* Main warning */
--warning-600: #d97706;  /* Hover */
--warning-700: #b45309;  /* Active */
--warning-800: #92400e;
--warning-900: #78350f;
```

**Usage:**
- Loading states
- Pending reviews
- Time warnings (exam countdown)
- Caution messages

---

### Neutral Colors (Grayscale)

```css
--neutral-50: #f9fafb;   /* Lightest backgrounds */
--neutral-100: #f3f4f6;
--neutral-200: #e5e7eb;  /* Dividers, borders */
--neutral-300: #d1d5db;
--neutral-400: #9ca3af;  /* Placeholder text */
--neutral-500: #6b7280;  /* Muted text, secondary text */
--neutral-600: #4b5563;
--neutral-700: #374151;  /* Secondary headings */
--neutral-800: #1f2937;  /* Primary text */
--neutral-900: #111827;  /* Darkest, body text */
```

**Usage:**
- Text content
- Borders
- Backgrounds
- Disabled states

---

### Semantic Colors

```css
--background: #ffffff;        /* Page background */
--foreground: #111827;        /* Primary text */
--muted: #6b7280;            /* Secondary text */
--muted-foreground: #4b5563; /* Tertiary text */
--border: #e5e7eb;           /* Dividers, borders */
--input: #ffffff;            /* Input backgrounds */
--input-border: #d1d5db;     /* Input borders */
--ring: #3b82f6;             /* Focus ring (primary) */
--card: #ffffff;             /* Card backgrounds */
--card-foreground: #111827;  /* Card text */
```

---

## Typography

### Font Families

```css
/* Body Text - Clean, readable sans-serif */
--font-base: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

/* Code - Monospace for technical content */
--font-mono: 'Fira Code, Consolas, monospace';
```

### Font Sizes

```css
--text-xs: 0.75rem;      /* 12px - captions, small labels */
--text-sm: 0.875rem;     /* 14px - helper text, secondary */
--text-base: 1rem;       /* 16px - body text, default */
--text-lg: 1.125rem;     /* 18px - question text, emphasis */
--text-xl: 1.25rem;      /* 20px - section titles */
--text-2xl: 1.5rem;      /* 24px - page titles */
--text-3xl: 1.875rem;    /* 30px - hero titles, h1 */
--text-4xl: 2.25rem;     /* 36px - rarely used */
```

### Font Weights

```css
--font-light: 300;        /* Rarely used (decorative) */
--font-normal: 400;       /* Body text, standard */
--font-medium: 500;       /* Labels, secondary headings */
--font-semibold: 600;     /* Section titles, emphasis */
--font-bold: 700;         /* Headings, strong emphasis */
--font-extrabold: 800;    /* Hero titles, very strong */
```

### Line Heights

```css
--leading-tight: 1.2;     /* Headings, compact text */
--leading-normal: 1.5;    /* Body text, readable */
--leading-relaxed: 1.75;  /* Descriptions, longer text */
```

### Predefined Text Styles

Use these instead of combining individual values:

```css
/* Heading 1 - Page titles */
.heading-1 {
  font-size: 1.875rem;
  font-weight: 700;
  line-height: 2.25rem;
  letter-spacing: -0.02em;
}

/* Heading 2 - Section titles */
.heading-2 {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 2rem;
}

/* Heading 3 - Subsection titles */
.heading-3 {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.75rem;
}

/* Body - Main text content */
.body {
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5rem;
}

/* Body Small - Secondary text */
.body-small {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25rem;
}

/* Label - Form labels, badges */
.label {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.25rem;
}

/* Caption - Helper text, timestamps */
.caption {
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1rem;
  color: var(--muted);
}
```

---

## Spacing & Layout

### Spacing Scale

All spacing values are multiples of 4px (0.25rem):

```css
--space-0: 0;              /* 0px - no space */
--space-1: 0.25rem;        /* 4px - tight spacing */
--space-2: 0.5rem;         /* 8px - compact spacing */
--space-3: 0.75rem;        /* 12px - small spacing */
--space-4: 1rem;           /* 16px - default padding */
--space-6: 1.5rem;         /* 24px - medium spacing */
--space-8: 2rem;           /* 32px - generous spacing */
--space-10: 2.5rem;        /* 40px - large spacing */
--space-12: 3rem;          /* 48px - extra large spacing */
--space-16: 4rem;          /* 64px - huge spacing */
```

### Semantic Spacing (Use in Components)

```css
--gap-xs: 0.5rem;          /* 8px - tight gaps */
--gap-sm: 1rem;            /* 16px - small gaps */
--gap-md: 1.5rem;          /* 24px - default gaps */
--gap-lg: 2rem;            /* 32px - large gaps */
--gap-xl: 3rem;            /* 48px - extra large gaps */
--gap-2xl: 4rem;           /* 64px - huge gaps */
```

### Common Patterns

```css
/* Button padding */
--btn-padding-sm: 0.5rem 1rem;      /* Small buttons */
--btn-padding-md: 0.75rem 1.5rem;   /* Medium buttons */
--btn-padding-lg: 1rem 2rem;        /* Large buttons */

/* Card padding */
--card-padding: 1.5rem;             /* Card content padding */

/* Input padding */
--input-padding: 0.75rem 1rem;      /* Input field padding */

/* Form spacing */
--form-gap: 1.5rem;                 /* Space between form fields */
```

---

## Border Radius

```css
--radius-none: 0;          /* No radius (sharp corners) */
--radius-sm: 0.375rem;     /* 6px - small inputs */
--radius-md: 0.5rem;       /* 8px - standard */
--radius-lg: 0.75rem;      /* 12px - large cards */
--radius-xl: 1rem;         /* 16px - extra large */
--radius-full: 9999px;     /* Fully rounded (pills) */
```

**Usage by Component:**
- Buttons: `radius-md`
- Input fields: `radius-md`
- Cards: `radius-lg`
- Badges: `radius-full` (pill-shaped)
- Dialog overlays: `radius-xl`

---

## Shadows

### Elevation System

Shadows create depth and visual hierarchy:

```css
--shadow-none: none;

/* Subtle shadow - elevate slightly */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Medium shadow - card elevation */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
             0 2px 4px -1px rgba(0, 0, 0, 0.06);

/* Large shadow - floating panels */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
             0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* Extra large shadow - modal dialogs */
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
             0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* Huge shadow - full modals */
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Inner shadow - inset effect */
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
```

**Usage by Component:**
- Hover states: `shadow-md`
- Cards: `shadow-md`
- Dropdowns: `shadow-lg`
- Modals: `shadow-xl` or `shadow-2xl`

---

## Z-Index Layers

```css
--z-hide: -1;              /* Hidden elements */
--z-base: 0;               /* Default stacking context */
--z-dropdown: 1000;        /* Dropdowns, popovers */
--z-sticky: 1020;          /* Sticky headers */
--z-fixed: 1030;           /* Fixed navigation */
--z-modal-backdrop: 1040;  /* Modal overlay */
--z-modal: 1050;           /* Modal dialog */
--z-popover: 1060;         /* Popover tooltips */
--z-tooltip: 1070;         /* Tooltip text */
```

---

## Animations

### Duration

```css
--duration-fast: 150ms;    /* Micro-interactions */
--duration-base: 200ms;    /* Standard animations */
--duration-slow: 300ms;    /* Slower, more visible */
```

### Easing Functions

```css
--ease: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Common Transitions

```css
/* Button interactions */
transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

/* Hover effects */
transition: background-color 200ms ease-out,
            box-shadow 200ms ease-out;

/* Loading spinners */
animation: spin 1s linear infinite;

/* Fade in */
transition: opacity 300ms ease-out;
```

---

## Breakpoints

### Responsive Sizes

```css
--breakpoint-xs: 320px;   /* Extra small phones */
--breakpoint-sm: 640px;   /* Phones */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Desktops */
--breakpoint-xl: 1280px;  /* Large desktops */
--breakpoint-2xl: 1536px; /* Extra large displays */
```

**Usage Strategy:**
- **Mobile-first**: Design for `xs`, then enhance for larger screens
- **Exam questions**: Full width on all sizes (responsive text)
- **Dashboard**: Two-column on `lg` and up
- **Admin tables**: Horizontal scroll on `sm`, normal on `md` and up

---

## Implementation Guide

### Tailwind Configuration

Add to your `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    colors: {
      primary: {
        50: '#eff6ff',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        900: '#1e3a8a',
        // ... complete palette
      },
      success: {
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
      },
      error: {
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
      },
      warning: {
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
      },
    },
    spacing: {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      4: '1rem',
      6: '1.5rem',
      8: '2rem',
      // ... complete spacing
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      full: '9999px',
    },
    boxShadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      // ... complete shadows
    },
  },
};
```

### React Usage

```typescript
// Direct class names
<button className="bg-primary-500 hover:bg-primary-600">
  Click me
</button>

// Using CSS variables (in CSS)
.button {
  background-color: var(--primary-500);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  transition: background-color var(--duration-base) var(--ease);
}

// Tailwind utilities (preferred)
<div className="p-4 bg-primary-50 rounded-lg shadow-md">
  Content
</div>
```

---

## 📝 Token Usage Rules

1. **Never hardcode colors** - Always use CSS variables or Tailwind classes
2. **Spacing is multiples of 4px** - Maintains consistent rhythm
3. **Use semantic names** - `--primary-500` not `--blue-500`
4. **Typography styles** - Use predefined classes (`.heading-1`, `.body`)
5. **Shadows for elevation** - Don't use arbitrary box-shadows
6. **Animations use standard duration** - `--duration-fast`, `--duration-base`, `--duration-slow`

---

**Last Updated:** 2026-02-01 | **Status:** ✅ Ready for Implementation

