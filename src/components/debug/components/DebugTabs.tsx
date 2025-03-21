import React from 'react';
import { TabGroup, TabDefinition } from '../../common/ui/TabGroup';
import { ModifiableComponent } from '../../../utils/types';

export interface DebugTabsProps {
  component: ModifiableComponent;
  initialTab?: string;
  className?: string;
  tabs: Array<{
    id: string;
    label: React.ReactNode;
    content: React.ReactNode;
    disabled?: boolean;
  }>;
}

/**
 * A specialized tab component for the debug panel
 * that displays different types of information about a component
 */
export const DebugTabs: React.FC<DebugTabsProps> = ({
  component,
  initialTab,
  className = '',
  tabs,
}) => {
  const [activeTab, setActiveTab] = React.useState(initialTab || (tabs.length > 0 ? tabs[0].id : ''));
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // Convert our tabs to TabDefinitions
  const tabDefinitions: TabDefinition[] = tabs.map(tab => ({
    id: tab.id,
    label: tab.label,
    content: tab.content,
    disabled: tab.disabled,
  }));
  
  return (
    <div className={`debug-tabs ${className}`}>
      <TabGroup
        tabs={tabDefinitions}
        value={activeTab}
        onValueChange={handleTabChange}
        className="debug-tab-group"
        tabListClassName="debug-tab-list"
        tabClassName="debug-tab"
        tabContentClassName="debug-tab-content"
        activeTabClassName="debug-tab-active"
      />
    </div>
  );
};