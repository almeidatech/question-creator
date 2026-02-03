'use client';

import { forwardRef, useState } from 'react';
import type { HTMLAttributes } from 'react';

/**
 * Tabs Component Props
 */
export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  /** Tab items */
  items?: Array<{ label: string; content: React.ReactNode; id: string }>;
  /** Default active tab id */
  defaultValue?: string;
}

/**
 * Tabs Atom Component
 *
 * Tabbed interface component
 *
 * @example
 * ```tsx
 * <Tabs
 *   items={[
 *     { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
 *     { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
 *   ]}
 *   defaultValue="tab1"
 * />
 * ```
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ items = [], defaultValue, className = '', ...props }, ref) => {
    const [activeTab, setActiveTab] = useState(defaultValue || items[0]?.id || '');

    return (
      <div ref={ref} className={className} {...props}>
        {/* Tab buttons */}
        <div className="flex border-b border-neutral-200" role="tablist">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                px-4 py-2 font-medium text-sm transition-colors
                ${
                  activeTab === item.id
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-neutral-600 hover:text-neutral-900'
                }
              `}
              role="tab"
              {...(activeTab === item.id
                ? { "aria-selected": "true" }
                : { "aria-selected": "false" })}
              aria-controls={`tab-panel-${item.id}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-4">
          {items.map((item) => (
            <div
              key={item.id}
              id={`tab-panel-${item.id}`}
              role="tabpanel"
              hidden={activeTab !== item.id}
              className={activeTab === item.id ? 'block' : 'hidden'}
            >
              {item.content}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';

