import React, { useState, useEffect, useMemo } from 'react';
import { ComponentVersion } from '../../../utils/types';
import { VersionControl, VersionBranch, VersionControlEvents } from '../../../services/component/VersionControl';
import './VersionHistoryView.css';

interface VersionHistoryViewProps {
  componentId: string;
  onSelectVersion?: (versionId: string) => void;
  selectedVersionId?: string;
}

/**
 * Component that displays version history with branching visualization
 */
export const VersionHistoryView: React.FC<VersionHistoryViewProps> = ({
  componentId,
  onSelectVersion,
  selectedVersionId
}) => {
  const [versions, setVersions] = useState<ComponentVersion[]>([]);
  const [branches, setBranches] = useState<VersionBranch[]>([]);
  const [branchColors, setBranchColors] = useState<Record<string, string>>({});
  const [newBranchName, setNewBranchName] = useState('');
  const [sourceVersionId, setSourceVersionId] = useState<string | null>(null);
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [sourceBranchId, setSourceBranchId] = useState<string | null>(null);
  const [targetBranchId, setTargetBranchId] = useState<string | null>(null);
  const [mergeMessage, setMergeMessage] = useState('');

  const versionControl = useMemo(() => new VersionControl(), []);

  // Load version history and branches on component mount or when componentId changes
  useEffect(() => {
    if (componentId) {
      loadVersionData();
      
      // Subscribe to version control events
      const handleVersionCreated = () => loadVersionData();
      const handleBranchCreated = () => loadVersionData();
      const handleMergeCompleted = () => loadVersionData();
      
      versionControl.on(VersionControlEvents.VERSION_CREATED, handleVersionCreated);
      versionControl.on(VersionControlEvents.BRANCH_CREATED, handleBranchCreated);
      versionControl.on(VersionControlEvents.MERGE_COMPLETED, handleMergeCompleted);
      
      return () => {
        versionControl.off(VersionControlEvents.VERSION_CREATED, handleVersionCreated);
        versionControl.off(VersionControlEvents.BRANCH_CREATED, handleBranchCreated);
        versionControl.off(VersionControlEvents.MERGE_COMPLETED, handleMergeCompleted);
      };
    }
  }, [componentId, versionControl]);

  // Load version and branch data
  const loadVersionData = () => {
    const allVersions = versionControl.getVersionHistory(componentId);
    const allBranches = versionControl.getBranches(componentId);
    setVersions(allVersions);
    setBranches(allBranches);

    // Generate branch colors if needed
    const colors = { ...branchColors };
    const predefinedColors = [
      '#0366d6', '#28a745', '#6f42c1', '#e36209', '#d73a49', 
      '#6f7781', '#2188ff', '#79b8ff', '#c53d13', '#34d058'
    ];
    
    allBranches.forEach((branch, index) => {
      if (!colors[branch.id]) {
        colors[branch.id] = predefinedColors[index % predefinedColors.length];
      }
    });
    
    setBranchColors(colors);
  };

  // Find which branch a version belongs to
  const getBranchForVersion = (versionId: string): VersionBranch | null => {
    return branches.find(branch => branch.versionIds.includes(versionId)) || null;
  };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Truncate description if too long
  const truncateDescription = (description: string, maxLength: number = 60): string => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  // Handle creating a new branch
  const handleCreateBranch = () => {
    if (!sourceVersionId || !newBranchName.trim()) return;
    
    try {
      versionControl.createBranch(componentId, sourceVersionId, newBranchName.trim());
      setNewBranchName('');
      setSourceVersionId(null);
      setShowBranchDialog(false);
      loadVersionData();
    } catch (error) {
      console.error('Failed to create branch:', error);
      // In a real app, you'd show error in UI
    }
  };

  // Handle merging branches
  const handleMergeBranches = () => {
    if (!sourceBranchId || !targetBranchId || !mergeMessage.trim()) return;
    
    try {
      versionControl.mergeBranches(
        componentId, 
        sourceBranchId, 
        targetBranchId, 
        mergeMessage.trim()
      );
      setSourceBranchId(null);
      setTargetBranchId(null);
      setMergeMessage('');
      setShowMergeDialog(false);
      loadVersionData();
    } catch (error) {
      console.error('Failed to merge branches:', error);
      // In a real app, you'd show error in UI
    }
  };

  // Render empty state if no versions
  if (versions.length === 0) {
    return (
      <div className="version-history-empty">
        <p>No version history available for this component.</p>
      </div>
    );
  }

  return (
    <div className="version-history-view">
      {/* Header and actions */}
      <div className="version-history-header">
        <h3>Version History</h3>
        <div className="version-history-actions">
          <button 
            className="create-branch-button"
            onClick={() => setShowBranchDialog(true)}
          >
            Create Branch
          </button>
          {branches.length >= 2 && (
            <button 
              className="merge-branches-button"
              onClick={() => setShowMergeDialog(true)}
            >
              Merge Branches
            </button>
          )}
        </div>
      </div>

      {/* Branch dialog */}
      {showBranchDialog && (
        <div className="branch-dialog">
          <h4>Create New Branch</h4>
          <div className="form-group">
            <label>Source Version:</label>
            <select 
              value={sourceVersionId || ''} 
              onChange={e => setSourceVersionId(e.target.value)}
            >
              <option value="">Select a version...</option>
              {versions.map(version => (
                <option key={version.id} value={version.id}>
                  {formatTimestamp(version.timestamp)} - {truncateDescription(version.description || 'No description')}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Branch Name:</label>
            <input 
              type="text" 
              value={newBranchName} 
              onChange={e => setNewBranchName(e.target.value)}
              placeholder="feature/new-branch"
            />
          </div>
          <div className="dialog-actions">
            <button 
              className="cancel-button" 
              onClick={() => {
                setShowBranchDialog(false);
                setSourceVersionId(null);
                setNewBranchName('');
              }}
            >
              Cancel
            </button>
            <button 
              className="create-button" 
              onClick={handleCreateBranch}
              disabled={!sourceVersionId || !newBranchName.trim()}
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Merge dialog */}
      {showMergeDialog && (
        <div className="merge-dialog">
          <h4>Merge Branches</h4>
          <div className="form-group">
            <label>Source Branch:</label>
            <select 
              value={sourceBranchId || ''} 
              onChange={e => setSourceBranchId(e.target.value)}
            >
              <option value="">Select a branch...</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Target Branch:</label>
            <select 
              value={targetBranchId || ''} 
              onChange={e => setTargetBranchId(e.target.value)}
              disabled={!sourceBranchId}
            >
              <option value="">Select a branch...</option>
              {branches
                .filter(branch => branch.id !== sourceBranchId)
                .map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))
              }
            </select>
          </div>
          <div className="form-group">
            <label>Merge Message:</label>
            <textarea 
              value={mergeMessage} 
              onChange={e => setMergeMessage(e.target.value)}
              placeholder="Describe the purpose of this merge..."
              rows={3}
            />
          </div>
          <div className="dialog-actions">
            <button 
              className="cancel-button" 
              onClick={() => {
                setShowMergeDialog(false);
                setSourceBranchId(null);
                setTargetBranchId(null);
                setMergeMessage('');
              }}
            >
              Cancel
            </button>
            <button 
              className="merge-button" 
              onClick={handleMergeBranches}
              disabled={!sourceBranchId || !targetBranchId || !mergeMessage.trim()}
            >
              Merge
            </button>
          </div>
        </div>
      )}

      {/* Version history graph */}
      <div className="version-history-graph">
        <div className="graph-header">
          <div className="commit-column">Commit</div>
          <div className="message-column">Message</div>
          <div className="author-column">Author</div>
          <div className="date-column">Date</div>
          <div className="branch-column">Branch</div>
        </div>
        
        <div className="graph-body">
          {versions.map(version => {
            const branch = getBranchForVersion(version.id);
            const isMergeCommit = version.description?.toLowerCase().includes('merge');
            const isSelected = version.id === selectedVersionId;
            
            return (
              <div 
                key={version.id} 
                className={`version-item ${isSelected ? 'selected' : ''} ${isMergeCommit ? 'merge-commit' : ''}`}
                onClick={() => onSelectVersion?.(version.id)}
              >
                {/* Simple visualization of commits and branches */}
                <div className="commit-column">
                  <div 
                    className="commit-node"
                    style={{ 
                      backgroundColor: branch ? branchColors[branch.id] : '#ccc' 
                    }}
                    title={branch ? `Branch: ${branch.name}` : 'No branch'}
                  />
                  <div className="commit-id">{version.id.substring(0, 7)}</div>
                </div>
                
                <div className="message-column" title={version.description || 'No description'}>
                  {version.description || 'No description'}
                </div>
                
                <div className="author-column" title={version.author || 'Unknown'}>
                  {version.author || 'Unknown'}
                </div>
                
                <div className="date-column" title={formatTimestamp(version.timestamp)}>
                  {formatTimestamp(version.timestamp)}
                </div>
                
                <div 
                  className="branch-column" 
                  style={{ 
                    color: branch ? branchColors[branch.id] : '#999'
                  }}
                  title={branch ? branch.name : 'No branch'}
                >
                  {branch ? branch.name : '—'}
                </div>
                
                {/* Actions dropdown */}
                <div className="version-actions">
                  <button className="view-code-button" title="View code">
                    <span className="icon">📄</span>
                  </button>
                  {onSelectVersion && (
                    <button 
                      className="restore-button" 
                      title="Restore this version"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectVersion(version.id);
                      }}
                    >
                      <span className="icon">↺</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Branch legend */}
      {branches.length > 0 && (
        <div className="branch-legend">
          <div className="legend-header">Branches</div>
          <div className="legend-items">
            {branches.map(branch => (
              <div key={branch.id} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: branchColors[branch.id] }}
                />
                <div className="legend-name">{branch.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionHistoryView;