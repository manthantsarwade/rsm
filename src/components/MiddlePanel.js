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

  // Dummy data for testing
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

  // Function to check if user assignment is ending soon (3 days)
  const isAssignmentEndingSoon = (endDate) => {
    if (!endDate) return false;
    const today = new Date();
    const assignmentEnd = new Date(endDate);
    const diffTime = assignmentEnd - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  // Function to check if user assignment has ended
  const hasAssignmentEnded = (endDate) => {
    if (!endDate) return false;
    const today = new Date();
    const assignmentEnd = new Date(endDate);
    return today > assignmentEnd;
  };

  useEffect(() => {
    if (selectedProject) {
      fetchEpicsAndCalculateTimeline();
    } else {
      setEpics([]);
      setProjectTimeline(null);
    }
  }, [selectedProject]);

  const fetchEpicsAndCalculateTimeline = async () => {
    if (!selectedProject) return;
    
    try {
      setLoadingEpics(true);
      // For demo, use dummy timeline
      setProjectTimeline(dummyProjectTimeline);
      
      // Update parent component with timeline data
      if (onUpdateProjectTimeline) {
        onUpdateProjectTimeline(selectedProject.id, dummyProjectTimeline);
      }
    } catch (error) {
      console.error('Error fetching epics:', error);
    } finally {
      setLoadingEpics(false);
    }
  };

  const handleDateAssignment = (assignmentData) => {
    onAssignUserWithDates(assignmentData);
    onCloseDateModal();
  };

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
      <div className="middle-header">
        <div className="project-info">
          <h2>{selectedProject.name}</h2>
          <span className="project-key">{selectedProject.key}</span>
        </div>
        <div className="header-actions">
          {selectedUser && (
            <div className="selected-user-info">
              <span className="selected-label">Selected:</span>
              <span className="selected-name">{selectedUser.name}</span>
              <button className="clear-selection-btn" onClick={onClearSelectedUser}>×</button>
            </div>
          )}
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

      {/* Excel-like Timeline Table */}
      {loadingEpics ? (
        <div className="timeline-loading">
          <div className="loading-bar"></div>
        </div>
      ) : projectTimeline ? (
        <div className="excel-timeline-container">
          <h4>Project Timeline & Resource Allocation</h4>
          
          <Droppable droppableId={`project-${selectedProject.id}`}>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`excel-timeline-table ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
              >
                {/* Timeline Header Row */}
                <div className="timeline-header-row">
                  <div className="timeline-name-column">
                    <strong>Resource / Timeline</strong>
                  </div>
                  <div className="timeline-scale-column">
                    <ExcelTimelineHeader timeline={projectTimeline} viewMode={timelineView} />
                  </div>
                </div>
                
                {/* Project Timeline Row */}
                <div className="timeline-project-row">
                  <div className="timeline-name-column">
                    <div className="project-timeline-info">
                      <span className="project-name-timeline">{selectedProject.name}</span>
                      <span className="project-key-timeline">({selectedProject.key})</span>
                    </div>
                  </div>
                  <div className="timeline-scale-column">
                    <ExcelProjectBar timeline={projectTimeline} viewMode={timelineView} />
                  </div>
                </div>
                
                {/* User Timeline Rows */}
                <div className="timeline-users-body">
                  {dummyUsers.map((user, index) => (
                    <Draggable key={user.id} draggableId={`timeline-user-${user.id}`} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`timeline-user-row ${snapshot.isDragging ? 'dragging' : ''}`}
                        >
                          <div className="timeline-name-column">
                            <div className="user-timeline-info">
                              <span className="user-name-timeline">{user.name}</span>
                              <span className="user-role-timeline">{user.role}</span>
                              <span className="user-dates-timeline">
                                {formatDate(user.startDate)} - {formatDate(user.endDate)}
                              </span>
                            </div>
                            <button
                              className="remove-user-btn"
                              onClick={() => console.log('Remove user:', user.id)}
                              title="Remove user from project"
                            >
                              ×
                            </button>
                          </div>
                          <div className="timeline-scale-column">
                            <ExcelUserBar
                              user={user}
                              startDate={user.startDate}
                              endDate={user.endDate}
                              projectTimeline={projectTimeline}
                              viewMode={timelineView}
                              isEndingSoon={isAssignmentEndingSoon(user.endDate)}
                              hasEnded={hasAssignmentEnded(user.endDate)}
                            />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  
                  {dummyUsers.length === 0 && (
                    <div className="empty-timeline-row">
                      <div className="timeline-name-column">No users assigned</div>
                      <div className="timeline-scale-column">
                        <div className="empty-timeline-message">Drop users here to assign them to this project</div>
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

// Excel Timeline Header Component
const ExcelTimelineHeader = ({ timeline, viewMode }) => {
  const generateTimelineColumns = () => {
    const startDate = new Date(timeline.startDate + 'T12:00:00');
    const endDate = new Date(timeline.endDate + 'T12:00:00');
    const columns = [];
    
    const currentDate = new Date(startDate);
    
    switch (viewMode) {
      case 'day':
        let monthIndex = 0;
        let currentMonth = null;
        while (currentDate <= endDate) {
          const monthYear = currentDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
          if (currentMonth !== monthYear) {
            currentMonth = monthYear;
            monthIndex++;
          }
          
          const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
          
          columns.push({
            date: new Date(currentDate),
            label: currentDate.getDate().toString(),
            month: monthYear,
            monthIndex: monthIndex,
            colorGroup: monthIndex % 2 === 1 ? 'primary' : 'secondary',
            isWeekend: isWeekend
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
        break;
        
      case 'week':
        let weekNum = 1;
        let weekMonthIndex = 0;
        let currentWeekMonth = null;
        while (currentDate <= endDate) {
          const weekMonth = currentDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
          
          if (currentWeekMonth !== weekMonth) {
            currentWeekMonth = weekMonth;
            weekMonthIndex++;
          }
          
          columns.push({
            date: new Date(currentDate),
            label: `W${weekNum}`,
            month: weekMonth,
            colorGroup: weekMonthIndex % 2 === 1 ? 'primary' : 'secondary'
          });
          
          weekNum++;
          currentDate.setDate(currentDate.getDate() + 7);
        }
        break;
        
      case 'month':
        let monthCounter = 0;
        while (currentDate <= endDate) {
          monthCounter++;
          columns.push({
            date: new Date(currentDate),
            label: currentDate.toLocaleDateString(undefined, { month: 'short' }),
            colorGroup: monthCounter % 2 === 1 ? 'primary' : 'secondary'
          });
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        break;
        
      case 'year':
        let yearCounter = 0;
        while (currentDate <= endDate) {
          yearCounter++;
          columns.push({
            date: new Date(currentDate),
            label: currentDate.getFullYear().toString(),
            colorGroup: yearCounter % 2 === 1 ? 'primary' : 'secondary'
          });
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        }
        break;
        
      default:
        return [];
    }
    
    return columns;
  };

  const columns = generateTimelineColumns();
  
  return (
    <div className="excel-timeline-header">
      {columns.map((col, index) => (
        <div 
          key={index} 
          className={`timeline-header-cell ${col.colorGroup} ${col.isWeekend ? 'weekend' : ''}`}
          title={col.month}
        >
          {col.label}
        </div>
      ))}
    </div>
  );
};

// Excel Project Bar Component
const ExcelProjectBar = ({ timeline, viewMode }) => {
  const generateProjectCells = () => {
    const startDate = new Date(timeline.startDate + 'T12:00:00');
    const endDate = new Date(timeline.endDate + 'T12:00:00');
    const cells = [];
    
    const currentDate = new Date(startDate);
    
    switch (viewMode) {
      case 'day':
        let monthIndex = 0;
        let currentMonth = null;
        while (currentDate <= endDate) {
          const monthYear = currentDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
          if (currentMonth !== monthYear) {
            currentMonth = monthYear;
            monthIndex++;
          }
          
          const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
          
          cells.push({
            date: new Date(currentDate),
            colorGroup: monthIndex % 2 === 1 ? 'primary' : 'secondary',
            isWeekend: isWeekend
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
        break;
        
      case 'week':
        let weekMonthIndex = 0;
        let currentWeekMonth = null;
        while (currentDate <= endDate) {
          const weekMonth = currentDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
          
          if (currentWeekMonth !== weekMonth) {
            currentWeekMonth = weekMonth;
            weekMonthIndex++;
          }
          
          cells.push({
            date: new Date(currentDate),
            colorGroup: weekMonthIndex % 2 === 1 ? 'primary' : 'secondary'
          });
          
          currentDate.setDate(currentDate.getDate() + 7);
        }
        break;
        
      case 'month':
        let monthCounter = 0;
        while (currentDate <= endDate) {
          monthCounter++;
          cells.push({
            date: new Date(currentDate),
            colorGroup: monthCounter % 2 === 1 ? 'primary' : 'secondary'
          });
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        break;
        
      case 'year':
        let yearCounter = 0;
        while (currentDate <= endDate) {
          yearCounter++;
          cells.push({
            date: new Date(currentDate),
            colorGroup: yearCounter % 2 === 1 ? 'primary' : 'secondary'
          });
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        }
        break;
        
      default:
        return [];
    }
    
    return cells;
  };

  const cells = generateProjectCells();
  
  return (
    <div className="excel-project-bar">
      {cells.map((cell, index) => (
        <div 
          key={index} 
          className={`project-timeline-cell ${cell.colorGroup} ${cell.isWeekend ? 'weekend' : ''}`}
        >
          <div className="project-bar-fill"></div>
        </div>
      ))}
    </div>
  );
};

// Excel User Bar Component
const ExcelUserBar = ({ user, startDate, endDate, projectTimeline, viewMode, isEndingSoon, hasEnded }) => {
  const projectStart = new Date(projectTimeline.startDate + 'T12:00:00');
  const projectEnd = new Date(projectTimeline.endDate + 'T12:00:00');
  const userStart = new Date(startDate + 'T12:00:00');
  const userEnd = new Date(endDate + 'T12:00:00');
  
  const generateUserCells = () => {
    const startDate = new Date(projectTimeline.startDate + 'T12:00:00');
    const endDate = new Date(projectTimeline.endDate + 'T12:00:00');
    const cells = [];
    
    const currentDate = new Date(startDate);
    
    switch (viewMode) {
      case 'day':
        let monthIndex = 0;
        let currentMonth = null;
        while (currentDate <= endDate) {
          const monthYear = currentDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
          if (currentMonth !== monthYear) {
            currentMonth = monthYear;
            monthIndex++;
          }
          
          const isUserActive = currentDate >= userStart && currentDate <= userEnd;
          const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
          
          cells.push({
            date: new Date(currentDate),
            isActive: isUserActive,
            colorGroup: monthIndex % 2 === 1 ? 'primary' : 'secondary',
            isWeekend: isWeekend
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
        break;
        
      case 'week':
        let weekMonthIndex = 0;
        let currentWeekMonth = null;
        while (currentDate <= endDate) {
          const weekEnd = new Date(currentDate);
          weekEnd.setDate(weekEnd.getDate() + 6);
          const weekMonth = currentDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
          
          if (currentWeekMonth !== weekMonth) {
            currentWeekMonth = weekMonth;
            weekMonthIndex++;
          }
          
          const isUserActive = (userStart <= weekEnd && userEnd >= currentDate);
          
          cells.push({
            date: new Date(currentDate),
            isActive: isUserActive,
            colorGroup: weekMonthIndex % 2 === 1 ? 'primary' : 'secondary'
          });
          
          currentDate.setDate(currentDate.getDate() + 7);
        }
        break;
        
      case 'month':
        let monthCounter = 0;
        while (currentDate <= endDate) {
          monthCounter++;
          const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          const isUserActive = (userStart <= monthEnd && userEnd >= currentDate);
          
          cells.push({
            date: new Date(currentDate),
            isActive: isUserActive,
            colorGroup: monthCounter % 2 === 1 ? 'primary' : 'secondary'
          });
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        break;
        
      case 'year':
        let yearCounter = 0;
        while (currentDate <= endDate) {
          yearCounter++;
          const yearEnd = new Date(currentDate.getFullYear(), 11, 31);
          const isUserActive = (userStart <= yearEnd && userEnd >= currentDate);
          
          cells.push({
            date: new Date(currentDate),
            isActive: isUserActive,
            colorGroup: yearCounter % 2 === 1 ? 'primary' : 'secondary'
          });
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        }
        break;
        
      default:
        return [];
    }
    
    return cells;
  };

  const cells = generateUserCells();
  
  let barClass = 'excel-user-bar';
  if (isEndingSoon) {
    barClass += ' ending-soon';
  } else if (hasEnded) {
    barClass += ' assignment-ended';
  }
  
  return (
    <div className={barClass}>
      {cells.map((cell, index) => (
        <div 
          key={index} 
          className={`user-timeline-cell ${cell.colorGroup} ${cell.isActive ? 'active' : ''} ${cell.isWeekend ? 'weekend' : ''}`}
        >
          {cell.isActive && (
            <div className="user-bar-segment">
              <div className="user-bar-tooltip">
                <div className="tooltip-name">{user.name}</div>
                <div className="tooltip-role">{user.role}</div>
                <div className="tooltip-dates">{formatDate(startDate)} - {formatDate(endDate)}</div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default MiddlePanel;