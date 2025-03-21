import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';

export interface TabDefinition {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabGroupProps {
  tabs: TabDefinition[];
  defaultTab?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  tabListClassName?: string;
  tabClassName?: string;
  tabContentClassName?: string;
  activeTabClassName?: string;
}

export const TabGroup: React.FC<TabGroupProps> = ({
  tabs,
  defaultTab,
  value,
  onValueChange,
  orientation = 'horizontal',
  className = '',
  tabListClassName = '',
  tabClassName = '',
  tabContentClassName = '',
  activeTabClassName = '',
}) => {
  // If no default tab is provided, use the first tab
  const initialTab = defaultTab || (tabs.length > 0 ? tabs[0].id : '');

  return (
    <Tabs.Root
      className={`tab-group ${className}`}
      defaultValue={initialTab}
      value={value}
      onValueChange={onValueChange}
      orientation={orientation}
    >
      <Tabs.List className={`tab-list ${tabListClassName}`} aria-label="Tabs">
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.id}
            value={tab.id}
            disabled={tab.disabled}
            className={`tab ${tabClassName}`}
            data-state={(value || initialTab) === tab.id ? 'active' : 'inactive'}
            data-active-class={activeTabClassName}
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {tabs.map((tab) => (
        <Tabs.Content
          key={tab.id}
          value={tab.id}
          className={`tab-content ${tabContentClassName}`}
        >
          {tab.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
};