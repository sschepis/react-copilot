import React, { useState } from 'react';
import * as Icons from '../../common/icons';

export interface TreeItemProps {
  id: string;
  label: React.ReactNode;
  depth?: number;
  isSelected?: boolean;
  isExpandable?: boolean;
  initialExpanded?: boolean;
  onSelect?: (id: string) => void;
  children?: React.ReactNode;
  className?: string;
}

export const TreeItem: React.FC<TreeItemProps> = ({
  id,
  label,
  depth = 0,
  isSelected = false,
  isExpandable = false,
  initialExpanded = false,
  onSelect,
  children,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  };
  
  const handleSelect = () => {
    if (onSelect) {
      onSelect(id);
    }
  };
  
  return (
    <div className="tree-item-container">
      <div
        className={`tree-item ${isSelected ? 'tree-item-selected' : ''} ${className}`}
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={handleSelect}
        data-id={id}
      >
        {isExpandable && (
          <button
            className="tree-item-toggle"
            onClick={handleToggle}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Icons.ChevronDownIcon /> : <Icons.ChevronRightIcon />}
          </button>
        )}
        
        <div className="tree-item-content">
          {label}
        </div>
      </div>
      
      {isExpandable && isExpanded && children && (
        <div className="tree-item-children">
          {children}
        </div>
      )}
    </div>
  );
};