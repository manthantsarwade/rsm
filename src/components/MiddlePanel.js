import React, { useState, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import DatePickerModal from './DatePickerModal';
import { jiraAPI } from '../services/jiraAPI';
import './MiddlePanel.css';

const MiddlePanel = ({ selectedProject, assignments, onRemoveUser, onAssignUserWithDates, selectedUser, onClearSelectedUser, showDateModal, pendingAssignment, onCloseDateModal, onUpdateProjectTimeline }) => {
  const [epics, setEpics] = useState([]);
  const [projectTimeline, setProjectTimeline] = useState(null);
  const [loadingEpics, setLoadingEpics] = useState(false);
  const [timelineView, setTimelineView] = useState('week'); // day, week, month, year

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
      const projectEpics = await jiraAPI.getEpics(selectedProject.key);
      setEpics(projectEpics);
      
      // Calculate project timeline from epics
      if (projectEpics.length > 0) {
        // Parse dates more carefully to avoid timezone issues
        const startDates = projectEpics
          .map(epic => {
            if (!epic.startDate) return null;
            // Create date at noon to avoid timezone issues
            const date = new Date(epic.startDate + 'T12:00:00');
            return isNaN(date) ? null : date;
          })
          .filter(date => date !== null);
          
        const endDates = projectEpics
          .map(epic => {
            if (!epic.endDate) return null;
            // Create date at noon to avoid timezone issues
            const date = new Date(epic.endDate + 'T12:00:00');
            return isNaN(date) ? null : date;
          })
          .filter(date => date !== null);
        
        if (startDates.length > 0 && endDates.length > 0) {
          const projectStart = new Date(Math.min(...startDates));
          const projectEnd = new Date(Math.max(...endDates));
          
          const timeline = {
            startDate: projectStart.toISOString().split('T')[0],
            endDate: projectEnd.toISOString().split('T')[0],
            duration: Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24)) + 1
          };
          
          setProjectTimeline(timeline);
          
          // Update parent component with timeline data
          if (onUpdateProjectTimeline) {
            onUpdateProjectTimeline(selectedProject.id, timeline);
          }
        }
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
          <div className="empty-icon">Target</div>
          <h3>Select a Project</h3>
          <p>Choose a project from the right panel to view its details and manage resources</p>
        </div>
      </div>
    );
  }

  const assignedUsers = assignments[selectedProject.id] || [];

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

      {/* Enhanced Project Timeline Section */}
      {loadingEpics ? (
        <div className="project-timeline-section">
          <div className="timeline-header">
            <h3>Project Timeline</h3>
            <div className="timeline-info">
              <span className="timeline-duration">Loading...</span>
            </div>
          </div>
          <div className="timeline-loading">
            <div className="loading-bar"></div>
          </div>
        </div>
      ) : projectTimeline ? (
        <div className="project-timeline-section">
          <div className="timeline-header">
            <h3>Project Timeline</h3>
            <div className="timeline-info">
              <span className="timeline-duration">{projectTimeline.duration} days</span>
            </div>
          </div>
          
          {/* Timeline View Toggle */}
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
          
          <div className="synchronized-timeline-table-container">
            <h4>Project & Team Timeline</h4>
            
            {/* Project Row - Always First */}
            <div className="project-timeline-row">
              <div className="project-name-cell">{selectedProject.name} ({selectedProject.key})</div>
              <div className="project-timeline-cell">
                <ContinuousProjectBar timeline={projectTimeline} viewMode={timelineView} />
              </div>
            </div>
            
            <Droppable droppableId={`project-${selectedProject.id}`}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`synchronized-timeline-table ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                >
                  {/* Timeline Header Row */}
                  <div className="sync-timeline-header-row">
                    <div className="sync-user-name-column">Team Member</div>
                    <div className="sync-timeline-scale-column">
                      <ContinuousTimelineHeader timeline={projectTimeline} viewMode={timelineView} />
                    </div>
                  </div>
                  
                  {/* User Timeline Rows with Drag & Drop */}
                  <div className="sync-timeline-body">
                    {assignedUsers.map((item, index) => {
                      const user = item.user || item;
                      const startDate = item.startDate || null;
                      const endDate = item.endDate || null;
                      
                      if (!user || !user.id || !startDate || !endDate) return null;
                      
                      return (
                        <Draggable key={user.id} draggableId={`timeline-user-${user.id}`} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`draggable-timeline-row ${snapshot.isDragging ? 'dragging' : ''}`}
                            >
                              <div className="sync-user-name-column">
                                <div className="user-info-inline">
                                  <span className="user-name-inline">{user.name}</span>
                                  <span className="user-role-inline">({user.role})</span>
                                  <button
                                    className="remove-user-btn-inline"
                                    onClick={() => onRemoveUser(selectedProject.id, user.id)}
                                    title="Remove user from project"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                              <div className="sync-timeline-scale-column">
                                <ContinuousUserBar
                                  user={user}
                                  startDate={startDate}
                                  endDate={endDate}
                                  projectTimeline={projectTimeline}
                                  viewMode={timelineView}
                                  isEndingSoon={isAssignmentEndingSoon(endDate)}
                                  hasEnded={hasAssignmentEnded(endDate)}
                                />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    
                    {assignedUsers.length === 0 && (
                      <div className="empty-sync-timeline-table">
                        <div className="sync-user-name-column">No users assigned</div>
                        <div className="sync-timeline-scale-column">
                          <div className="empty-sync-timeline-message">Drop users here to assign them to this project</div>
                        </div>
                      </div>
                    )}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      ) : selectedProject && epics.length === 0 ? (
        <div className="project-timeline-section">
          <div className="timeline-header">
            <h3>Project Timeline</h3>
          </div>
          <div className="no-timeline">
            <span>No epics found to calculate timeline</span>
          </div>
        </div>
      ) : null}

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

// Continuous Timeline Header Component
const ContinuousTimelineHeader = ({ timeline, viewMode }) => {
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
          
          columns.push({
            date: new Date(currentDate),
            label: currentDate.getDate().toString(),
            month: monthYear,
            monthIndex: monthIndex,
            colorGroup: monthIndex % 2 === 1 ? 'month-1' : 'month-2'
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
            colorGroup: weekMonthIndex % 2 === 1 ? 'month-1' : 'month-2'
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
            colorGroup: monthCounter % 2 === 1 ? 'month-1' : 'month-2'
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
            colorGroup: yearCounter % 2 === 1 ? 'month-1' : 'month-2'
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
    <div className="continuous-timeline-header">
      {columns.map((col, index) => (
        <div 
          key={index} 
          className={`timeline-header-cell ${col.colorGroup}`}
        >
          {col.label}
        </div>
      ))}
    </div>
  );
};

// Continuous Project Bar Component
const ContinuousProjectBar = ({ timeline, viewMode }) => {
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
          
          cells.push({
            date: new Date(currentDate),
            colorGroup: monthIndex % 2 === 1 ? 'month-1' : 'month-2'
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
            colorGroup: weekMonthIndex % 2 === 1 ? 'month-1' : 'month-2'
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
            colorGroup: monthCounter % 2 === 1 ? 'month-1' : 'month-2'
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
            colorGroup: yearCounter % 2 === 1 ? 'month-1' : 'month-2'
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
    <div className="continuous-project-bar">
      {cells.map((cell, index) => (
        <div 
          key={index} 
          className={`project-timeline-cell ${cell.colorGroup}`}
        >
          <div className="project-bar-fill"></div>
        </div>
      ))}
    </div>
  );
};

// Continuous User Bar Component
const ContinuousUserBar = ({ user, startDate, endDate, projectTimeline, viewMode, isEndingSoon, hasEnded }) => {
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
          
          cells.push({
            date: new Date(currentDate),
            isActive: isUserActive,
            colorGroup: monthIndex % 2 === 1 ? 'month-1' : 'month-2'
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
            colorGroup: weekMonthIndex % 2 === 1 ? 'month-1' : 'month-2'
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
            colorGroup: monthCounter % 2 === 1 ? 'month-1' : 'month-2'
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
            colorGroup: yearCounter % 2 === 1 ? 'month-1' : 'month-2'
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
  
  let barClass = 'continuous-user-bar';
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
          className={`user-timeline-cell ${cell.colorGroup} ${cell.isActive ? 'active' : ''}`}
        >
          {cell.isActive && <div className="user-bar-fill"></div>}
        </div>
      ))}
    </div>
  );
};

export default MiddlePanel;