# UI Component Library - Atoms

Complete atomic component library for Question Creator MVP.

## 📦 Components (14 Atoms)

### Form Elements
- **Button** - Multi-variant button component (primary, secondary, danger, ghost, outline)
- **Input** - Text input with variants (default, error, success) and labels
- **Select** - Dropdown select component with options
- **Checkbox** - Checkbox with label support
- **Radio/RadioGroup** - Radio button group component
- **Label** - Form field label with required indicator

### Containers & Display
- **Card** - Content container with variants (default, elevated, outlined)
- **Dialog** - Modal dialog component
- **Badge** - Status indicator badges
- **Divider** - Visual separator (horizontal/vertical)

### Complex Components
- **Tabs** - Tabbed interface
- **Spinner** - Loading indicator
- **Form** - Form wrapper component

### Typography
- **Text** - Generic text component with variants
- **Heading1-3** - Semantic heading components
- **Paragraph** - Paragraph component
- **Caption** - Small caption text

## 🎨 Usage

### Basic Button
```tsx
import { Button } from '@/src/components/ui';

export default function HomePage() {
  return (
    <div>
      <Button variant="primary" size="md">
        Click Me
      </Button>
      <Button variant="outline" isLoading>
        Loading...
      </Button>
    </div>
  );
}
```

### Form Example
```tsx
import { Form, Input, Select, Button, Label } from '@/src/components/ui';

export default function SignupForm() {
  return (
    <Form onSubmit={(e) => e.preventDefault()}>
      <Input
        type="email"
        label="Email"
        placeholder="user@example.com"
        required
      />
      <Input
        type="password"
        label="Password"
        placeholder="••••••••"
        required
      />
      <Select
        label="Domain"
        options={[
          { value: 'const', label: 'Direito Constitucional' },
          { value: 'penal', label: 'Direito Penal' },
        ]}
      />
      <Button type="submit" fullWidth>
        Sign Up
      </Button>
    </Form>
  );
}
```

### Dialog Component
```tsx
import { Dialog, Button } from '@/src/components/ui';
import { useState } from 'react';

export default function DialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <h2>Dialog Title</h2>
        <p>Dialog content goes here</p>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </Dialog>
    </>
  );
}
```

## 🎯 Design Tokens

All components use design tokens from `/src/tokens/`:

- **Colors** - Primary, success, error, warning, info, neutral palettes
- **Typography** - Font families, sizes, weights, line heights
- **Spacing** - Consistent 4px grid system
- **Shadows** - Elevation system for depth
- **Border Radius** - Rounded corner scales

### Using Tokens Directly

```tsx
import { colors, typography, spacing } from '@/src/tokens';

const MyComponent = () => (
  <div style={{
    backgroundColor: colors.primary[500],
    padding: spacing[4],
    fontSize: typography.fontSize.base[0],
  }}>
    Styled with tokens
  </div>
);
```

## 🧪 Testing

All components have unit tests with 80%+ coverage.

### Running Tests
```bash
npm run test
```

### Test Coverage
```bash
npm run test:coverage
```

### Component Tests
Each component has a test file in `__tests__/`:
- `button.test.tsx` - Button component tests
- `input.test.tsx` - Input component tests
- ... (one test file per component)

Test coverage includes:
- Render tests
- Variant tests
- State changes
- Accessibility tests
- Error handling

## ♿ Accessibility

All components follow WCAG AA standards:

- ✅ Semantic HTML
- ✅ Proper ARIA labels
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Color contrast
- ✅ Reduced motion support (planned)

## 📱 Responsive Design

Components are mobile-first and responsive:

- **xs**: 320px
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## 🔧 Customization

### Using Tailwind Classes

```tsx
<Button
  className="rounded-full text-lg"
  style={{ textTransform: 'uppercase' }}
>
  Custom Button
</Button>
```

### Extending Components

Extend components by composing them:

```tsx
function CustomButton(props: ButtonProps) {
  return (
    <Button
      {...props}
      className={`custom-class ${props.className || ''}`}
    />
  );
}
```

## 📚 Storybook

View component showcase in Storybook:

```bash
npm run storybook
```

## 🐛 Bug Reports

Found a bug? Open an issue on GitHub with:
- Component name
- Expected behavior
- Actual behavior
- Browser/OS information
- Code example

## 📝 License

MIT
