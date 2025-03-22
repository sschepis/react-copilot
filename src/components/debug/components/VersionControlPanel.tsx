import React, { useState } from 'react';
import { ModifiableComponent } from '../../../utils/types';
import { VersionHistoryView } from './VersionHistoryView';
import { VersionDiffViewer } from './VersionDiffViewer';
import './VersionControlPanel.css';

interface VersionControlPanelProps {
  component: ModifiableComponent;
}

/**
 * Combined panel for version control that includes history view and diff viewer
 */
export const VersionControlPanel: React.FC<VersionControlPanelProps> = ({ component }) => {
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>();
  const [comparisonVersionId, setComparisonVersionId] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'history' | 'diff'>('history');

  // Handle selecting a version from history view
  const handleSelectVersion = (versionId: string) => {
    // If we're in history view, just set the selected version
    if (viewMode === 'history') {
      setSelectedVersionId(versionId);
    } 
    // If we're in diff view and no version is selected yet, set the first one
    else if (!selectedVersionId) {
      setSelectedVersionId(versionId);
    } 
    // If one version is already selected, set the comparison version and switch to diff view
    else if (selectedVersionId !== versionId) {
      setComparisonVersionId(versionId);
    }
  };

  // Handle comparing two versions
  const handleCompareVersions = () => {
    if (selectedVersionId) {
      setViewMode('diff');
    }
  };

  // Handle going back to history view
  const handleBackToHistory = () => {
    setViewMode('history');
    setComparisonVersionId(undefined);
  };

  // Handle restoring to a specific version
  const handleRestoreVersion = (versionId: string) => {
    // In a real implementation, this would call the relevant service
    // to restore the component to this version
    console.log(`Restoring to version: ${versionId}`);
    // TODO: Implement actual component version restoration
  };

  return (
    <div className="version-control-panel">
      {/* View mode toggle */}
      <div className="view-mode-toggle">
        <button 
          className={`toggle-button ${viewMode === 'history' ? 'active' : ''}`}
          onClick={handleBackToHistory}
        >
          History
        </button>
        <button 
          className={`toggle-button ${viewMode === 'diff' ? 'active' : ''}`}
          onClick={handleCompareVersions}
          disabled={!selectedVersionId}
        >
          Compare
        </button>
      </div>

      {/* Content area */}
      <div className="version-content-area">
        {viewMode === 'history' ? (
          <VersionHistoryView
            componentId={component.id}
            onSelectVersion={handleSelectVersion}
            selectedVersionId={selectedVersionId}
          />
        ) : (
          <VersionDiffViewer
            componentId={component.id}
            fromVersionId={selectedVersionId}
            toVersionId={comparisonVersionId}
            onSelectVersion={handleRestoreVersion}
          />
        )}
      </div>
    </div>
  );
};

export default VersionControlPanel;