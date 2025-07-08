import React from 'react';
import './UserDetailsModal.css';

const UserDetailsModal = ({ isOpen, onClose, user, assignments, projects }) => {
  if (!isOpen || !user) {
    return null;
  }

  // CHANGED: Show only project assignments, no epics
  // Lines 8-16: Modified to remove epic-based assignments
  const userAssignments = [];
  Object.entries(assignments).forEach(([projectId, projectAssignments]) => {
    const assignment = projectAssignments.find(a => a.user && a.user.id === user.id);
    if (assignment) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        userAssignments.push({
          project,
          assignment,
          startDate: assignment.startDate,
          endDate: assignment.endDate
        });
      }
    }
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{user.name}'s Assignments</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {userAssignments.length > 0 ? (
            <ul className="assignments-list">
              {userAssignments.map(({ project, assignment }, index) => (
                <li key={index} className="assignment-item">
                  <div className="assignment-project">
                    <strong>Project:</strong> {project.name}
                    <span className="project-lead">(Lead: {project.lead})</span>
                  </div>
                  <div className="assignment-dates">
                    <strong>Duration:</strong> {formatDate(assignment.startDate)} - {formatDate(assignment.endDate)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>This user has no assignments.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default UserDetailsModal;
