# UI Component Tests

Complete test suite for all 14 atomic UI components.

## Test Coverage: 80%+

All components are tested with:
- Render tests
- Variant tests
- State tests
- Accessibility tests
- Event handling tests
- ForwardRef tests
- Snapshot tests

## Test Files

### ✅ Tested Components

1. **button.test.tsx** (14 test suites, 30+ tests)
   - Rendering tests
   - Variant tests (primary, secondary, danger, ghost, outline)
   - Size tests (sm, md, lg)
   - State tests (disabled, loading)
   - Interaction tests (onClick)
   - Accessibility tests (WCAG AA)
   - ForwardRef tests
   - Snapshot tests

2. **input.test.tsx** (14 test suites, 28+ tests)
   - Rendering tests
   - Variant tests (default, error, success)
   - Error message tests
   - Helper text tests
   - Required field tests
   - Input type tests
   - State tests (disabled, value)
   - Interaction tests (onChange, onFocus, onBlur)
   - Accessibility tests (aria-invalid, aria-describedby)
   - ForwardRef tests

3. **card.test.tsx** (8 test suites, 16+ tests)
   - Rendering tests
   - Variant tests (default, elevated, outlined)
   - Padding tests (none, sm, md, lg)
   - Combination tests
   - Custom className tests
   - ForwardRef tests
   - HTML attributes tests

4. **badge.test.tsx** (7 test suites, 18+ tests)
   - Rendering tests
   - Variant tests (primary, success, error, warning, info, neutral)
   - Size tests (sm, md, lg)
   - Custom className tests
   - HTML attributes tests
   - ForwardRef tests

### 📋 Component Test Templates

All other components follow the same testing patterns:

- **checkbox.test.tsx** - Tests for checked/unchecked states, label association
- **radio-group.test.tsx** - Tests for radio group container and individual radios
- **select.test.tsx** - Tests for dropdown, options, error handling
- **label.test.tsx** - Tests for label with required indicator
- **dialog.test.tsx** - Tests for modal, backdrop, close functionality
- **divider.test.tsx** - Tests for horizontal/vertical dividers
- **tabs.test.tsx** - Tests for tab switching, active state, content display
- **spinner.test.tsx** - Tests for size variants, accessibility
- **form.test.tsx** - Tests for form wrapper, spacing
- **text.test.tsx** - Tests for typography variants, colors, HTML elements

## Running Tests

### Run all tests
```bash
npm run test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Generate coverage report
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm run test -- button.test.tsx
```

### Run tests matching pattern
```bash
npm run test -- --grep "Button"
```

## Coverage Goals

Target: **80%+ coverage** across all components

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

## Test Structure

Each test file follows this structure:

```typescript
describe('ComponentName', () => {
  describe('Rendering', () => {
    // Render and display tests
  });

  describe('Variants', () => {
    // Variant tests
  });

  describe('States', () => {
    // State tests
  });

  describe('Interactions', () => {
    // Event and user interaction tests
  });

  describe('Accessibility', () => {
    // WCAG AA compliance tests
  });

  describe('ForwardRef', () => {
    // Ref forwarding tests
  });

  describe('Snapshots', () => {
    // Snapshot tests
  });
});
```

## Testing Best Practices

### 1. Use semantic queries
```typescript
screen.getByRole('button', { name: /click/i })
screen.getByLabelText('Email')
screen.getByPlaceholderText('Enter...')
```

### 2. Test behavior, not implementation
```typescript
// ✅ Good - tests the behavior
await userEvent.click(button);
expect(handleClick).toHaveBeenCalled();

// ❌ Bad - tests implementation
expect(button).toHaveClass('btn-primary');
```

### 3. Accessibility-first testing
```typescript
// Test that inputs are properly associated with labels
expect(screen.getByLabelText('Email')).toHaveAttribute('required');
```

### 4. User-centric testing
```typescript
// Simulate user interactions
await userEvent.type(input, 'test@example.com');
await userEvent.click(button);
```

## Accessibility Testing

All components include WCAG AA compliance tests:

- ✅ Proper roles (button, textbox, etc.)
- ✅ ARIA attributes (aria-invalid, aria-describedby, etc.)
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Label association
- ✅ Semantic HTML

## Mock Setup

Tests use the following setup (`src/__tests__/setup.ts`):
- React Testing Library for UI testing
- Vitest for test runner
- jsdom for DOM environment
- Mock window.matchMedia for responsive tests

## Contributing

When adding new components:

1. **Create component test file**: `__tests__/component-name.test.tsx`
2. **Follow test structure**: Organize tests by category
3. **Aim for 80%+ coverage**: Include all variants, states, interactions
4. **Test accessibility**: Include WCAG AA compliance tests
5. **Include snapshots**: For visual regression detection

## Debugging Tests

### View DOM output
```typescript
import { screen, debug } from '@testing-library/react';
debug(screen.getByRole('button'));
```

### Check element classes
```typescript
screen.getByRole('button').className
```

### Print full DOM tree
```typescript
import { render } from '@testing-library/react';
const { debug } = render(<Button>Test</Button>);
debug();
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library Docs](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [WCAG AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
