import React, { useState, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import DatePickerModal from './DatePickerModal';
import { jiraAPI } from '../services/jiraAPI';
import './MiddlePanel.css';

const MiddlePanel = ({ selectedProject, assignments, onRemoveUser, onAssignUserWithDates, selectedUser, onClearSelectedUser, showDateModal, pendingAssignment, onCloseDateModal, onUpdateProjectTimeline }) => {
  const [epics, setEpics] = useState([]);
  const [projectTimeline, setProjectTimeline] = useState(null);
  const [loadingEpics, setLoadingEpics] = useState(false);
  const [timelineView, setTimelineView] = useState('day'); // day, week, month, year

  // DUMMY DATA FOR TESTING - Replace with real data later
  const dummyProjectTimeline = {
    startDate: '2024-07-05',
    endDate: '2024-08-30',
    duration: 56
  };

  const dummyUsers = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@company.com',
      role: 'Frontend Developer',
      startDate: '2024-07-09',
      endDate: '2024-07-20'
    },
    {
      id: '2', 
      name: 'Jane Smith',
      email: 'jane@company.com',
      role: 'Backend Developer',
      startDate: '2024-07-15',
      endDate: '2024-08-10'
    },
    {
      id: '3',
      name: 'Mike Johnson', 
      email: 'mike@company.com',
      role: 'UI/UX Designer',
      startDate: '2024-07-22',
      endDate: '2024-08-25'
    },
    {
      id: '4',
      name: 'Sarah Wilson',
      email: 'sarah@company.com', 
      role: 'QA Engineer',
      startDate: '2024-08-01',
      endDate: '2024-08-28'
    }
  ];

  // Helper functions
  const isAssignmentEndingSoon = (endDate) => {
    if (!endDate) return false;
    const today = new Date();
    const assignmentEnd = new Date(endDate);
    const diffTime = assignmentEnd - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  const hasAssignmentEnded = (endDate) => {
    if (!endDate) return false;
    const today = new Date();
    const assignmentEnd = new Date(endDate);
    return today > assignmentEnd;
  };

  useEffect(() => {
    if (selectedProject) {
      // For demo, use dummy data
      setProjectTimeline(dummyProjectTimeline);
      if (onUpdateProjectTimeline) {
        onUpdateProjectTimeline(selectedProject.id, dummyProjectTimeline);
      }
    } else {
      setProjectTimeline(null);
    }
  }, [selectedProject]);

  const handleDateAssignment = (assignmentData) => {
    onAssignUserWithDates(assignmentData);
    onCloseDateModal();
  };

  // Show empty state if no project selected
  if (!selectedProject) {
    return (
      <div className="middle-panel">
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h3>Select a Project</h3>
          <p>Choose a project from the right panel to view its timeline and manage resources</p>
        </div>
      </div>
    );
  }

  return (
    <div className="middle-panel">
      {/* Header Section */}
      <div className="middle-header">
        <div className="project-info">
          <h2>{selectedProject.name}</h2>
          <span className="project-key">{selectedProject.key}</span>
        </div>
      </div>

      {/* Timeline View Controls */}
      <div className="timeline-view-controls">
        <div className="view-toggle-group">
          {['day', 'week', 'month', 'year'].map(view => (
            <button
              key={view}
              className={`view-toggle-btn ${timelineView === view ? 'active' : ''}`}
              onClick={() => setTimelineView(view)}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Timeline Container */}
      {projectTimeline ? (
        <div className="timeline-container">
          <h4>Resource Timeline</h4>
          
          <Droppable droppableId={`project-${selectedProject.id}`}>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`timeline-table ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
              >
                {/* Timeline Header with Dates */}
                <TimelineHeader timeline={projectTimeline} viewMode={timelineView} />
                
                {/* User Rows */}
                <div className="timeline-body">
                  {dummyUsers.map((user, index) => (
                    <Draggable key={user.id} draggableId={`user-${user.id}`} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`timeline-row ${snapshot.isDragging ? 'dragging' : ''}`}
                        >
                          {/* User Name Column */}
                          <div className="user-name-column">
                            <div className="user-info">
                              <span className="user-name">{user.name}</span>
                              <span className="user-role">{user.role}</span>
                            </div>
                            <button
                              className="remove-btn"
                              onClick={() => console.log('Remove user:', user.id)}
                              title="Remove user"
                            >
                              ×
                            </button>
                          </div>
                          
                          {/* Timeline Columns for this User */}
                          <UserTimelineColumns
                            user={user}
                            projectTimeline={projectTimeline}
                            viewMode={timelineView}
                            isEndingSoon={isAssignmentEndingSoon(user.endDate)}
                            hasEnded={hasAssignmentEnded(user.endDate)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  
                  {/* Empty State */}
                  {dummyUsers.length === 0 && (
                    <div className="empty-timeline-row">
                      <div className="user-name-column">No users assigned</div>
                      <div className="timeline-columns">
                        <div className="drop-message">Drop users here to assign them</div>
                      </div>
                    </div>
                  )}
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      ) : (
        <div className="no-timeline">
          <span>No timeline data available</span>
        </div>
      )}

      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={showDateModal}
        onClose={onCloseDateModal}
        onSave={handleDateAssignment}
        user={pendingAssignment ? pendingAssignment.user : null}
        project={pendingAssignment ? pendingAssignment.project : null}
        projectTimeline={projectTimeline}
      />
    </div>
  );
};

// Timeline Header Component - Shows dates/periods
const TimelineHeader = ({ timeline, viewMode }) => {
  const generateColumns = () => {
    const startDate = new Date(timeline.startDate + 'T12:00:00');
    const endDate = new Date(timeline.endDate + 'T12:00:00');
    const columns = [];
    const currentDate = new Date(startDate);
    
    switch (viewMode) {
      case 'day':
        while (currentDate <= endDate) {
          const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
          columns.push({
            date: new Date(currentDate),
            label: currentDate.getDate().toString(),
            fullDate: currentDate.toLocaleDateString(),
            isWeekend
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
        break;
        
      case 'week':
        let weekNum = 1;
        while (currentDate <= endDate) {
          columns.push({
            date: new Date(currentDate),
            label: `W${weekNum}`,
            fullDate: `Week ${weekNum}`
          });
          weekNum++;
          currentDate.setDate(currentDate.getDate() + 7);
        }
        break;
        
      case 'month':
        while (currentDate <= endDate) {
          columns.push({
            date: new Date(currentDate),
            label: currentDate.toLocaleDateString(undefined, { month: 'short' }),
            fullDate: currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
          });
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        break;
        
      case 'year':
        while (currentDate <= endDate) {
          columns.push({
            date: new Date(currentDate),
            label: currentDate.getFullYear().toString(),
            fullDate: currentDate.getFullYear().toString()
          });
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        }
        break;
    }
    
    return columns;
  };

  const columns = generateColumns();
  
  return (
    <div className="timeline-header">
      {/* First column for user names */}
      <div className="header-name-column">
        <strong>Team Member</strong>
      </div>
      
      {/* Date columns */}
      <div className="header-date-columns">
        {columns.map((col, index) => (
          <div 
            key={index} 
            className={`date-column ${col.isWeekend ? 'weekend' : ''}`}
            title={col.fullDate}
          >
            {col.label}
          </div>
        ))}
      </div>
    </div>
  );
};

// User Timeline Columns Component - Shows user's timeline bars
const UserTimelineColumns = ({ user, projectTimeline, viewMode, isEndingSoon, hasEnded }) => {
  const userStart = new Date(user.startDate + 'T12:00:00');
  const userEnd = new Date(user.endDate + 'T12:00:00');
  
  const generateColumns = () => {
    const startDate = new Date(projectTimeline.startDate + 'T12:00:00');
    const endDate = new Date(projectTimeline.endDate + 'T12:00:00');
    const columns = [];
    const currentDate = new Date(startDate);
    
    switch (viewMode) {
      case 'day':
        while (currentDate <= endDate) {
          const isUserActive = currentDate >= userStart && currentDate <= userEnd;
          const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
          
          columns.push({
            date: new Date(currentDate),
            isActive: isUserActive,
            isWeekend
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
        break;
        
      case 'week':
        while (currentDate <= endDate) {
          const weekEnd = new Date(currentDate);
          weekEnd.setDate(weekEnd.getDate() + 6);
          const isUserActive = (userStart <= weekEnd && userEnd >= currentDate);
          
          columns.push({
            date: new Date(currentDate),
            isActive: isUserActive
          });
          currentDate.setDate(currentDate.getDate() + 7);
        }
        break;
        
      case 'month':
        while (currentDate <= endDate) {
          const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          const isUserActive = (userStart <= monthEnd && userEnd >= currentDate);
          
          columns.push({
            date: new Date(currentDate),
            isActive: isUserActive
          });
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        break;
        
      case 'year':
        while (currentDate <= endDate) {
          const yearEnd = new Date(currentDate.getFullYear(), 11, 31);
          const isUserActive = (userStart <= yearEnd && userEnd >= currentDate);
          
          columns.push({
            date: new Date(currentDate),
            isActive: isUserActive
          });
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        }
        break;
    }
    
    return columns;
  };

  const columns = generateColumns();
  
  let statusClass = '';
  if (isEndingSoon) statusClass = 'ending-soon';
  else if (hasEnded) statusClass = 'ended';
  
  return (
    <div className={`user-timeline-columns ${statusClass}`}>
      {columns.map((col, index) => (
        <div 
          key={index} 
          className={`timeline-cell ${col.isActive ? 'active' : ''} ${col.isWeekend ? 'weekend' : ''}`}
        >
          {col.isActive && (
            <div className="user-bar">
              <div className="bar-tooltip">
                <div>{user.name}</div>
                <div>{user.role}</div>
                <div>{formatDate(user.startDate)} - {formatDate(user.endDate)}</div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default MiddlePanel;