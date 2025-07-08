import React, { useState } from 'react';
import './DatePickerModal.css';

const DatePickerModal = ({ isOpen, onClose, onSave, user, project, projectTimeline }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');

  const validateDates = (start, end) => {
    if (!start || !end) {
      return 'Both start and end dates are required';
    }
    
    if (new Date(start) >= new Date(end)) {
      return 'Start date must be before end date';
    }
    
    if (projectTimeline) {
      const projectStart = new Date(projectTimeline.startDate);
      const projectEnd = new Date(projectTimeline.endDate);
      const userStart = new Date(start);
      const userEnd = new Date(end);
      
      if (userStart < projectStart) {
        return `Start date cannot be before project start (${formatDate(projectTimeline.startDate)})`;
      }
      
      if (userEnd > projectEnd) {
        return `End date cannot be after project end (${formatDate(projectTimeline.endDate)})`;
      }
    }
    
    return '';
  };

  const handleSave = () => {
    const error = validateDates(startDate, endDate);
    if (error) {
      setDateError(error);
      return;
    }
    
    onSave({
      user,
      project,
      startDate,
      endDate
    });
    setStartDate('');
    setEndDate('');
    setDateError('');
    onClose();
  };

  const handleCancel = () => {
    setStartDate('');
    setEndDate('');
    setDateError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Assign User to Project</h3>
          <button className="close-btn" onClick={handleCancel}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="assignment-info">
            <div className="info-item">
              <span className="label">User:</span>
              <span className="value">{user?.name}</span>
            </div>
            <div className="info-item">
              <span className="label">Project:</span>
              <span className="value">{project?.name}</span>
            </div>
          </div>
          
          <div className="date-inputs">
            {projectTimeline && (
              <div className="project-timeline-info">
                <span>Project Timeline: {formatDate(projectTimeline.startDate)} - {formatDate(projectTimeline.endDate)}</span>
              </div>
            )}
            
            <div className="date-inputs-row">
              <div className="input-group">
                <label htmlFor="startDate">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDateError('');
                  }}
                  min={projectTimeline ? projectTimeline.startDate : undefined}
                  max={projectTimeline ? projectTimeline.endDate : undefined}
                  className="date-input"
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="endDate">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDateError('');
                  }}
                  min={startDate || (projectTimeline ? projectTimeline.startDate : undefined)}
                  max={projectTimeline ? projectTimeline.endDate : undefined}
                  className="date-input"
                />
              </div>
            </div>
            
            {dateError && (
              <div className="date-error">
                {dateError}
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button 
            className="btn-save" 
            onClick={handleSave}
            disabled={!startDate || !endDate}
          >
            Assign User
          </button>
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

export default DatePickerModal;
