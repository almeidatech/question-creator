'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';
import { debounce, KeyboardEvents, isEmpty } from './input-utils';

/**
 * Props for SearchInput component
 */
export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** Current search value */
  value?: string;
  /** Placeholder text for empty state */
  placeholder?: string;
  /** Callback when input value changes */
  onChange?: (value: string) => void;
  /** Callback for debounced search submission */
  onSearch?: (value: string) => void;
  /** Callback when clearing search */
  onClear?: () => void;
  /** Debounce delay in milliseconds (default: 500) */
  debounceMs?: number;
  /** Number of results found */
  resultCount?: number;
  /** Whether to show result count */
  showResultCount?: boolean;
  /** Whether search input is disabled */
  disabled?: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * SearchInput Molecule Component
 *
 * A text input with search icon, clear button, debounce support,
 * keyboard shortcuts, and optional result count display.
 *
 * Features:
 * - Text input with search icon
 * - Clear button when input has content
 * - Debounced search (500ms default)
 * - Keyboard shortcuts (Escape to clear, Enter to submit)
 * - Optional result count display
 * - WCAG AA accessibility support
 *
 * @example
 * ```tsx
 * <SearchInput
 *   value={searchValue}
 *   placeholder="Search questions..."
 *   onChange={setSearchValue}
 *   onSearch={handleSearch}
 *   debounceMs={300}
 *   showResultCount
 *   resultCount={45}
 * />
 * ```
 */
export const SearchInput = forwardRef<HTMLDivElement, SearchInputProps>(
  (
    {
      value = '',
      placeholder = 'Search...',
      onChange,
      onSearch,
      onClear,
      debounceMs = 500,
      resultCount,
      showResultCount = false,
      disabled = false,
      className = '',
      ...inputProps
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [localValue, setLocalValue] = useState(value);

    // Update local value when controlled value changes
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    // Create debounced search function
    const debouncedSearch = useRef(
      debounce((searchValue: string) => {
        onSearch?.(searchValue);
      }, debounceMs)
    ).current;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      onChange?.(newValue);
      debouncedSearch(newValue);
    };

    const handleClear = () => {
      setLocalValue('');
      onChange?.('');
      onClear?.();
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (KeyboardEvents.isEscape(e.key)) {
        e.preventDefault();
        handleClear();
      } else if (KeyboardEvents.isEnter(e.key)) {
        e.preventDefault();
        onSearch?.(localValue);
      }
    };

    const hasValue = !isEmpty(localValue);

    return (
      <div
        ref={ref}
        className={`flex flex-col w-full ${className}`.replace(/\s+/g, ' ').trim()}
      >
        {/* Search Input Container */}
        <div className="relative flex items-center">
          {/* Search Icon */}
          <svg
            className="absolute left-3 w-5 h-5 text-neutral-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={localValue}
            placeholder={placeholder}
            disabled={disabled}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={`
              w-full pl-10 pr-12 py-2 text-base
              border-2 border-neutral-300 rounded-lg
              transition-colors
              focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500
              disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50
              hover:border-neutral-400
            `}
            aria-label="Search"
            aria-describedby={
              showResultCount && resultCount !== undefined
                ? 'search-result-count'
                : undefined
            }
            {...inputProps}
          />

          {/* Clear Button */}
          {hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className={`
                absolute right-3 p-1
                text-neutral-400 hover:text-neutral-600
                transition-colors
                focus:outline-none focus:ring-1 focus:ring-primary-500 rounded
              `}
              aria-label="Clear search"
              tabIndex={0}
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Result Count */}
        {showResultCount && resultCount !== undefined && (
          <div
            id="search-result-count"
            className="mt-2 text-sm text-neutral-600"
          >
            {resultCount === 0 ? (
              <span>No results found</span>
            ) : (
              <span>
                {resultCount} {resultCount === 1 ? 'result' : 'results'} found
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

