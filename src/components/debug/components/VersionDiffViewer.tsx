import React, { useState, useEffect } from 'react';
import { ComponentVersion } from '../../../utils/types';
import { VersionControl, VersionDiff } from '../../../services/component/VersionControl';
import '../../../utils/styles/diff-viewer.css';

interface VersionDiffViewerProps {
  componentId: string;
  fromVersionId?: string;
  toVersionId?: string;
  onSelectVersion?: (versionId: string) => void;
}

/**
 * Component that displays differences between two versions of a component
 */
export const VersionDiffViewer: React.FC<VersionDiffViewerProps> = ({
  componentId,
  fromVersionId,
  toVersionId,
  onSelectVersion
}) => {
  const [availableVersions, setAvailableVersions] = useState<ComponentVersion[]>([]);
  const [selectedFromVersion, setSelectedFromVersion] = useState<string | undefined>(fromVersionId);
  const [selectedToVersion, setSelectedToVersion] = useState<string | undefined>(toVersionId);
  const [diffResult, setDiffResult] = useState<VersionDiff | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const versionControl = new VersionControl();

  // Fetch available versions when component mounts or componentId changes
  useEffect(() => {
    if (componentId) {
      const versions = versionControl.getVersionHistory(componentId);
      setAvailableVersions(versions);

      // Set default versions if not provided
      if (!selectedFromVersion && versions.length > 1) {
        setSelectedFromVersion(versions[1].id); // Second most recent
      }
      if (!selectedToVersion && versions.length > 0) {
        setSelectedToVersion(versions[0].id); // Most recent
      }
    }
  }, [componentId]);

  // Compute diff when selected versions change
  useEffect(() => {
    if (componentId && selectedFromVersion && selectedToVersion) {
      setLoading(true);
      setError(null);

      try {
        const diff = versionControl.compareVersions(
          componentId,
          selectedFromVersion,
          selectedToVersion
        );
        setDiffResult(diff);
      } catch (err) {
        setError(`Error comparing versions: ${err instanceof Error ? err.message : String(err)}`);
        setDiffResult(null);
      } finally {
        setLoading(false);
      }
    }
  }, [componentId, selectedFromVersion, selectedToVersion]);

  // Handle version selection changes
  const handleFromVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFromVersion(e.target.value);
  };

  const handleToVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedToVersion(e.target.value);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getFormattedDescription = (version: ComponentVersion) => {
    let desc = version.description || 'No description';
    if (version.author) {
      desc += ` (by ${version.author})`;
    }
    return desc;
  };

  // Render the diff as highlighted code
  const renderDiff = () => {
    if (!diffResult) return null;

    return (
      <div className="diff-container">
        <div className="diff-stats">
          <span className="diff-stat added">+{diffResult.addedLines}</span>
          <span className="diff-stat removed">-{diffResult.removedLines}</span>
          <span className="diff-stat changed">∆{diffResult.changedLines}</span>
        </div>
        <pre className="diff-content">
          {diffResult.diff.split('\n').map((line, index) => {
            let className = '';
            if (line.startsWith('+') && !line.startsWith('+++')) {
              className = 'diff-added';
            } else if (line.startsWith('-') && !line.startsWith('---')) {
              className = 'diff-removed';
            } else if (line.startsWith('@@ ')) {
              className = 'diff-info';
            } else if (line.startsWith('@@@ ')) {
              className = 'diff-conflict';
            }
            return (
              <div key={index} className={`diff-line ${className}`}>
                <span className="diff-line-number">{index + 1}</span>
                <span className="diff-line-content">{line}</span>
              </div>
            );
          })}
        </pre>
      </div>
    );
  };

  if (availableVersions.length < 2) {
    return (
      <div className="version-diff-viewer empty-state">
        <p>Not enough versions available to compare.</p>
        <p>There must be at least two versions of this component to show differences.</p>
      </div>
    );
  }

  return (
    <div className="version-diff-viewer">
      <div className="version-selector-container">
        <div className="version-selector">
          <label htmlFor="from-version">From Version:</label>
          <select
            id="from-version"
            value={selectedFromVersion}
            onChange={handleFromVersionChange}
            className="version-select"
          >
            <option value="">Select a version...</option>
            {availableVersions.map(version => (
              <option key={version.id} value={version.id}>
                {formatTimestamp(version.timestamp)} - {getFormattedDescription(version)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="version-selector">
          <label htmlFor="to-version">To Version:</label>
          <select
            id="to-version"
            value={selectedToVersion}
            onChange={handleToVersionChange}
            className="version-select"
          >
            <option value="">Select a version...</option>
            {availableVersions.map(version => (
              <option key={version.id} value={version.id}>
                {formatTimestamp(version.timestamp)} - {getFormattedDescription(version)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="loading-indicator">Loading diff...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!loading && !error && diffResult && (
        <>
          <div className="diff-header">
            <h4>Comparing Versions</h4>
            <div className="diff-metadata">
              <div className="version-info from-version">
                <strong>From:</strong> {formatTimestamp(versionControl.getVersion(componentId, selectedFromVersion!)?.timestamp || 0)}
              </div>
              <div className="version-info to-version">
                <strong>To:</strong> {formatTimestamp(versionControl.getVersion(componentId, selectedToVersion!)?.timestamp || 0)}
              </div>
            </div>
          </div>
          
          {renderDiff()}
        </>
      )}
      
      {/* Version actions */}
      {onSelectVersion && (
        <div className="version-actions">
          <button 
            className="revert-button"
            onClick={() => selectedFromVersion && onSelectVersion(selectedFromVersion)}
          >
            Revert to "From" Version
          </button>
          <button 
            className="apply-button"
            onClick={() => selectedToVersion && onSelectVersion(selectedToVersion)}
          >
            Apply "To" Version
          </button>
        </div>
      )}
    </div>
  );
};

export default VersionDiffViewer;