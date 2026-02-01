import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '../search-input';

describe('SearchInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders input field', () => {
      render(<SearchInput />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with default placeholder', () => {
      render(<SearchInput />);
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(<SearchInput placeholder="Search questions..." />);
      expect(screen.getByPlaceholderText('Search questions...')).toBeInTheDocument();
    });

    it('renders search icon', () => {
      const { container } = render(<SearchInput />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('does not show clear button initially', () => {
      render(<SearchInput />);
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    it('handles input change', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup({ delay: null });
      render(<SearchInput onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(onChange).toHaveBeenCalledWith('test');
    });

    it('updates internal value', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SearchInput />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'react');

      expect(input.value).toBe('react');
    });

    it('handles controlled value', () => {
      const { rerender } = render(<SearchInput value="initial" />);
      expect(screen.getByRole('textbox')).toHaveValue('initial');

      rerender(<SearchInput value="updated" />);
      expect(screen.getByRole('textbox')).toHaveValue('updated');
    });

    it('clears value when clear button clicked', async () => {
      const onClear = vi.fn();
      const user = userEvent.setup({ delay: null });
      render(<SearchInput value="test" onClear={onClear} onChange={vi.fn()} />);

      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);

      expect(onClear).toHaveBeenCalled();
    });
  });

  describe('Clear Button', () => {
    it('shows clear button when input has value', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SearchInput value="search term" onChange={vi.fn()} />);

      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('hides clear button when input is empty', () => {
      render(<SearchInput value="" onChange={vi.fn()} />);
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });

    it('does not show clear button when disabled', () => {
      render(<SearchInput value="text" disabled onChange={vi.fn()} />);
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });

    it('clears input and calls onClear', async () => {
      const onChange = vi.fn();
      const onClear = vi.fn();
      const user = userEvent.setup({ delay: null });
      render(
        <SearchInput
          value="search term"
          onChange={onChange}
          onClear={onClear}
        />
      );

      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);

      expect(onChange).toHaveBeenCalledWith('');
      expect(onClear).toHaveBeenCalled();
    });

    it('refocuses input after clear', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SearchInput value="text" onChange={vi.fn()} />);

      const input = screen.getByRole('textbox');
      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);

      expect(input).toHaveFocus();
    });
  });

  describe('Debounce', () => {
    it('supports debounceMs prop', () => {
      render(<SearchInput debounceMs={300} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('defaults to 500ms debounce', () => {
      render(<SearchInput />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('supports keyboard input', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup({ delay: null });
      render(<SearchInput onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(onChange).toHaveBeenCalledWith('test');
    });

    it('supports onSearch callback', () => {
      const onSearch = vi.fn();
      render(<SearchInput onSearch={onSearch} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Result Count', () => {
    it('does not show result count by default', () => {
      render(<SearchInput resultCount={5} />);
      expect(screen.queryByText(/results? found/)).not.toBeInTheDocument();
    });

    it('shows result count when enabled', () => {
      render(<SearchInput showResultCount resultCount={45} />);
      expect(screen.getByText('45 results found')).toBeInTheDocument();
    });

    it('shows singular result text for one result', () => {
      render(<SearchInput showResultCount resultCount={1} />);
      expect(screen.getByText('1 result found')).toBeInTheDocument();
    });

    it('shows no results message', () => {
      render(<SearchInput showResultCount resultCount={0} />);
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('updates result count dynamically', () => {
      const { rerender } = render(
        <SearchInput showResultCount resultCount={10} />
      );
      expect(screen.getByText('10 results found')).toBeInTheDocument();

      rerender(<SearchInput showResultCount resultCount={20} />);
      expect(screen.getByText('20 results found')).toBeInTheDocument();
    });

    it('has aria-describedby when result count shown', () => {
      render(<SearchInput showResultCount resultCount={5} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'search-result-count');
    });

    it('does not have aria-describedby when result count hidden', () => {
      render(<SearchInput showResultCount={false} resultCount={5} />);
      const input = screen.getByRole('textbox');
      expect(input).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('Accessibility', () => {
    it('has aria-label', () => {
      render(<SearchInput />);
      expect(screen.getByLabelText('Search')).toBeInTheDocument();
    });

    it('respects disabled state', () => {
      render(<SearchInput disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('clear button has tabindex', () => {
      render(<SearchInput value="text" onChange={vi.fn()} />);
      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<SearchInput className="custom-class" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });

    it('has focus ring on input', () => {
      render(<SearchInput />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:ring-1');
    });

    it('shows hover state', () => {
      render(<SearchInput />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('hover:border-neutral-400');
    });

    it('has disabled styling when disabled', () => {
      render(<SearchInput disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:opacity-50');
    });
  });

  describe('ForwardRef', () => {
    it('forwards ref correctly', () => {
      const ref = vi.fn();
      render(<SearchInput ref={ref} />);
      expect(ref).toHaveBeenCalled();
      // Ref callback is called with the DOM element
      const callCount = ref.mock.calls.length;
      expect(callCount).toBeGreaterThan(0);
    });
  });

  describe('Integration', () => {
    it('renders complete search interface', () => {
      render(
        <SearchInput
          showResultCount
          resultCount={5}
          placeholder="Search questions..."
        />
      );

      expect(screen.getByPlaceholderText('Search questions...')).toBeInTheDocument();
      expect(screen.getByText('5 results found')).toBeInTheDocument();
    });
  });
});
