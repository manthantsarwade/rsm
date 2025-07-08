import React, { useState } from 'react';

const EpicCard = ({ epic, assignments, onUserAssignment, onUserRemove }) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // Get users assigned to this epic
  const assignedUsers = Object.entries(assignments)
    .filter(([userId, assignment]) => assignment.epicId === epic.id)
    .map(([userId, assignment]) => ({ userId, ...assignment }));

  const handleAssignUser = (userId, startDate, endDate) => {
    onUserAssignment(userId, epic.id, startDate, endDate);
    setShowAssignModal(false);
  };

  return (
    <div className="epic-card">
      <div className="epic-header">
        <div className="epic-key">{epic.key}</div>
        <div className="epic-status">
          <span className={`status-badge ${epic.status.toLowerCase().replace(' ', '-')}`}>
            {epic.status}
          </span>
        </div>
      </div>
      
      <div className="epic-name">{epic.name}</div>
      
      {epic.description && (
        <div className="epic-description">
          {epic.description.length > 150 
            ? `${epic.description.substring(0, 150)}...` 
            : epic.description
          }
        </div>
      )}
      
      <div className="epic-assignee">
        {epic.assignee ? (
          <div className="assignee-info">
            <span className="assignee-label">Assignee:</span>
            <span className="assignee-name">{epic.assignee.name}</span>
          </div>
        ) : (
          <div className="no-assignee">No assignee</div>
        )}
      </div>
      
      <div className="epic-dates">
        {epic.dueDate && (
          <div className="due-date">
            <span className="date-label">Due:</span>
            <span className="date-value">{formatDate(epic.dueDate)}</span>
          </div>
        )}
        <div className="created-date">
          <span className="date-label">Created:</span>
          <span className="date-value">{formatDate(epic.created)}</span>
        </div>
      </div>
      
      <div className="assigned-users-section">
        <div className="section-header">
          <h4>Assigned Users ({assignedUsers.length})</h4>
          <button 
            className="assign-user-btn"
            onClick={() => setShowAssignModal(true)}
          >
            + Assign User
          </button>
        </div>
        
        <div className="assigned-users-list">
          {assignedUsers.map(({ userId, startDate, endDate, assignedAt }) => (
            <div key={userId} className="assigned-user-item">
              <div className="user-assignment-info">
                <span className="user-id">User {userId}</span>
                <div className="assignment-dates">
                  <span>{formatDate(startDate)} - {formatDate(endDate)}</span>
                </div>
              </div>
              <button 
                className="remove-user-btn"
                onClick={() => onUserRemove(userId)}
              >
                ×
              </button>
            </div>
          ))}
          
          {assignedUsers.length === 0 && (
            <div className="no-assigned-users">
              <p>No users assigned to this epic</p>
            </div>
          )}
        </div>
      </div>
      
      {showAssignModal && (
        <UserAssignmentModal
          epic={epic}
          onAssign={handleAssignUser}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  );
};

const UserAssignmentModal = ({ epic, onAssign, onClose }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedUserId && startDate && endDate) {
      onAssign(selectedUserId, startDate, endDate);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Assign User to {epic.key}</h3>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="assignment-form">
          <div className="form-group">
            <label htmlFor="userId">User ID:</label>
            <input
              type="text"
              id="userId"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              placeholder="Enter user ID"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Assign User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ForgeMiddlePanel = ({ epics, selectedProject, assignments, onUserAssignment, onUserRemove }) => {
  if (!selectedProject) {
    return (
      <div className="middle-panel">
        <div className="no-project-selected">
          <div className="no-project-icon">📋</div>
          <h3>No Project Selected</h3>
          <p>Select a project from the right panel to view its epics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="middle-panel">
      <div className="panel-header">
        <h2>Epics - {selectedProject.name}</h2>
        <div className="epic-count-badge">{epics.length}</div>
      </div>
      
      <div className="epics-container">
        {epics.length === 0 ? (
          <div className="no-epics">
            <div className="no-epics-icon">📝</div>
            <h3>No Epics Found</h3>
            <p>This project doesn't have any epics yet</p>
          </div>
        ) : (
          epics.map((epic) => (
            <EpicCard
              key={epic.id}
              epic={epic}
              assignments={assignments}
              onUserAssignment={onUserAssignment}
              onUserRemove={onUserRemove}
            />
          ))
        )}
      </div>
    </div>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

export default ForgeMiddlePanel;