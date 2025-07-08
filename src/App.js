import React, { useState, useEffect } from 'react';
import './App.css';
import { DragDropContext } from '@hello-pangea/dnd';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import MiddlePanel from './components/MiddlePanel';
import UserDetailsModal from './components/UserDetailsModal';
import { jiraAPI } from './services/jiraAPI';
import { storageService } from './services/storageService';

function App() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [projectTimelines, setProjectTimelines] = useState({});
  const [projectEpics, setProjectEpics] = useState({});
  const [showDateModal, setShowDateModal] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUserForModal, setSelectedUserForModal] = useState(null);

  useEffect(() => {
    initializeData();
  }, []);

  const fetchAllProjectTimelines = async (projects) => {
    const timelinePromises = projects.map(async (project) => {
      try {
        const projectEpics = await jiraAPI.getEpics(project.key);
        
        // Store epics for each project
        setProjectEpics(prev => ({
          ...prev,
          [project.id]: projectEpics
        }));
        
        if (projectEpics.length > 0) {
          // Parse dates more carefully to avoid timezone issues
          const startDates = projectEpics
            .map(epic => {
              if (!epic.startDate) return null;
              const date = new Date(epic.startDate + 'T12:00:00');
              return isNaN(date) ? null : date;
            })
            .filter(date => date !== null);
            
          const endDates = projectEpics
            .map(epic => {
              if (!epic.endDate) return null;
              const date = new Date(epic.endDate + 'T12:00:00');
              return isNaN(date) ? null : date;
            })
            .filter(date => date !== null);
          
          if (startDates.length > 0 && endDates.length > 0) {
            const projectStart = new Date(Math.min(...startDates));
            const projectEnd = new Date(Math.max(...endDates));
            
            return {
              projectId: project.id,
              timeline: {
                startDate: projectStart.toISOString().split('T')[0],
                endDate: projectEnd.toISOString().split('T')[0],
                duration: Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24)) + 1
              }
            };
          }
        }
        return null;
      } catch (error) {
        console.error(`Error fetching epics for project ${project.key}:`, error);
        return null;
      }
    });

    const results = await Promise.all(timelinePromises);
    const newTimelines = {};
    
    results.forEach(result => {
      if (result) {
        newTimelines[result.projectId] = result.timeline;
      }
    });

    setProjectTimelines(newTimelines);
    
    // Save to localStorage
    const savedData = storageService.loadData();
    storageService.saveData({ 
      ...savedData, 
      projectTimelines: newTimelines 
    });
  };

  const initializeData = async () => {
    try {
      setLoading(true);
      const savedData = storageService.loadData();
      
      // Load saved timelines first
      if (savedData?.projectTimelines) {
        setProjectTimelines(savedData.projectTimelines);
      }
      
      const jiraUsers = await jiraAPI.getUsers();
      setUsers(jiraUsers);
      
      let jiraProjects = await jiraAPI.getProjects();
      setProjects(jiraProjects);
      
      // Fetch epics for all projects to calculate timelines
      await fetchAllProjectTimelines(jiraProjects);
      
      if (savedData?.assignments) {
        const validatedAssignments = {};
        Object.keys(savedData.assignments).forEach(projectId => {
          const projectAssignments = savedData.assignments[projectId];
          if (Array.isArray(projectAssignments)) {
            validatedAssignments[projectId] = projectAssignments.filter(item => 
              item && (item.user || item.id)
            );
          }
        });
        setAssignments(validatedAssignments);
      }
      
    } catch (error) {
      console.error('Error initializing data:', error);
      setUsers(mockUsers);
      setProjects(mockProjects);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = async (project) => {
    setSelectedProject(project);
  };

  const updateProjectTimeline = (projectId, timeline) => {
    setProjectTimelines(prev => {
      const updated = {
        ...prev,
        [projectId]: timeline
      };
      
      // Save to localStorage
      const savedData = storageService.loadData();
      storageService.saveData({ 
        ...savedData, 
        projectTimelines: updated 
      });
      
      return updated;
    });
  };

  const handleAssignUserWithDates = (assignmentData) => {
    const { user, project, startDate, endDate } = assignmentData;
    const projectId = project.id;
    const userId = user.id;
    
    const userObject = users.find(u => u.id === userId);
    if (!userObject) return;
    
    const newAssignments = { ...assignments };
    if (!newAssignments[projectId]) {
      newAssignments[projectId] = [];
    }
    
    // CHANGED: Allow users to be assigned to multiple projects
    // Lines 94-105: Modified to allow duplicate assignments across projects
    const existingAssignment = newAssignments[projectId].find(a => a.user.id === userId);
    if (!existingAssignment) {
      newAssignments[projectId].push({
        user: userObject,
        startDate,
        endDate,
        assignedAt: new Date().toISOString()
      });
      
      setAssignments(newAssignments);
      storageService.saveData({ assignments: newAssignments });
    } else {
      // Update existing assignment with new dates
      existingAssignment.startDate = startDate;
      existingAssignment.endDate = endDate;
      existingAssignment.assignedAt = new Date().toISOString();
      
      setAssignments(newAssignments);
      storageService.saveData({ assignments: newAssignments });
    }
  };

  // CHANGED: Allow drag from both available and assigned users lists
  // Lines 179-199: Modified to allow dragging from assigned-users list too
  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      (source.droppableId === 'available-users' || source.droppableId === 'assigned-users' || source.droppableId === 'becoming-available-users') &&
      destination.droppableId.startsWith('project-')
    ) {
      const projectId = destination.droppableId.replace('project-', '');
      const project = projects.find((p) => p.id === projectId);
      const user = users.find((u) => String(u.id) === draggableId);

      if (project && user) {
        setPendingAssignment({ user, project });
        setShowDateModal(true);
      }
    }
  };

  const getAvailableUsers = () => {
    const assignedUserIds = Object.values(assignments || {})
      .flat()
      .filter(item => item && (item.user || item.id))
      .map(item => {
        if (item.user && item.user.id) {
          return item.user.id;
        }
        if (item.id) {
          return item.id;
        }
        return null;
      })
      .filter(id => id !== null);
    
    return users.filter(user => user && user.id && !assignedUserIds.includes(user.id));
  };

  const getAssignedUsers = () => {
    const today = new Date();
    const assignedUserIds = Object.values(assignments || {})
      .flat()
      .filter(item => {
        if (!item || !(item.user || item.id)) return false;
        
        // Check if assignment has ended
        if (item.endDate) {
          const assignmentEnd = new Date(item.endDate);
          if (today > assignmentEnd) {
            // Remove expired assignments
            setTimeout(() => {
              const newAssignments = { ...assignments };
              Object.keys(newAssignments).forEach(projectId => {
                newAssignments[projectId] = newAssignments[projectId].filter(assignment => {
                  if (assignment.endDate) {
                    const endDate = new Date(assignment.endDate);
                    return today <= endDate;
                  }
                  return true;
                });
              });
              setAssignments(newAssignments);
              storageService.saveData({ assignments: newAssignments });
            }, 100);
            return false;
          }
        }
        return true;
      })
      .map(item => {
        if (item.user && item.user.id) {
          return item.user.id;
        }
        if (item.id) {
          return item.id;
        }
        return null;
      })
      .filter(id => id !== null);
    
    // Get unique assigned users
    const uniqueAssignedIds = [...new Set(assignedUserIds)];
    return users.filter(user => user && user.id && uniqueAssignedIds.includes(user.id));
  };

  // Function to check if user assignment is ending soon (3 days)
  const isAssignmentEndingSoon = (endDate) => {
    if (!endDate) return false;
    const today = new Date();
    const assignmentEnd = new Date(endDate);
    const diffTime = assignmentEnd - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  const getUsersBecomingAvailable = () => {
    const usersWithEndingSoonAssignments = [];
    const processedUserIds = new Set();

    Object.values(assignments || {}).forEach(projectAssignments => {
      projectAssignments.forEach(item => {
        if (!item || !(item.user || item.id)) return;
        
        const user = item.user || users.find(u => u.id === item.id);
        if (!user || processedUserIds.has(user.id)) return;

        if (isAssignmentEndingSoon(item.endDate)) {
          usersWithEndingSoonAssignments.push({
            ...user,
            endDate: item.endDate // Include end date for reference
          });
          processedUserIds.add(user.id);
        }
      });
    });

    return usersWithEndingSoonAssignments;
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading HR Resource Manager...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>HR Resource Manager</h1>
        <div className="header-info">
          <span className="user-count">{users.length} Users</span>
          <span className="project-count">{projects.length} Projects</span>
        </div>
      </header>
      
      <div className="app-content">
        <DragDropContext onDragEnd={handleDragEnd}>
          <LeftPanel 
            availableUsers={getAvailableUsers()}
            assignedUsers={getAssignedUsers()}
            usersBecomingAvailable={getUsersBecomingAvailable()}
            loading={loading}
            onUserClick={(user) => {
              setSelectedUserForModal(user);
              setShowUserDetailsModal(true);
            }}
          />
          
          <MiddlePanel 
            selectedProject={selectedProject}
            assignments={assignments}
            onAssignUserWithDates={handleAssignUserWithDates}
            onRemoveUser={(projectId, userId) => {
              const newAssignments = { ...assignments };
              if (newAssignments[projectId]) {
                newAssignments[projectId] = newAssignments[projectId].filter(item => {
                  if (item.user && item.user.id) {
                    return item.user.id !== userId;
                  }
                  if (item.id) {
                    return item.id !== userId;
                  }
                  return false;
                });
                setAssignments(newAssignments);
                storageService.saveData({ assignments: newAssignments });
              }
            }}
            showDateModal={showDateModal}
            pendingAssignment={pendingAssignment}
            onCloseDateModal={() => {
              setShowDateModal(false);
              setPendingAssignment(null);
            }}
            onUpdateProjectTimeline={updateProjectTimeline}
          />
        </DragDropContext>
        
        <RightPanel 
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelect={handleProjectSelect}
          projectTimelines={projectTimelines}
          projectEpics={projectEpics}
        />
      </div>
      <UserDetailsModal
        isOpen={showUserDetailsModal}
        onClose={() => setShowUserDetailsModal(false)}
        user={selectedUserForModal}
        assignments={assignments}
        projects={projects}
      />
    </div>
  );
}

// Mock data for development
const mockUsers = [
  { id: '1', name: 'John Doe', email: 'john.doe@company.com', role: 'Developer', startDate: '2024-01-01', endDate: '2024-12-31' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@company.com', role: 'Designer', startDate: '2024-01-15', endDate: '2024-11-30' },
  { id: '3', name: 'Mike Johnson', email: 'mike.johnson@company.com', role: 'QA Engineer', startDate: '2024-02-01', endDate: '2024-10-31' },
  { id: '4', name: 'Sarah Wilson', email: 'sarah.wilson@company.com', role: 'Product Manager', startDate: '2024-01-01', endDate: '2024-12-31' },
  { id: '5', name: 'David Brown', email: 'david.brown@company.com', role: 'DevOps Engineer', startDate: '2024-03-01', endDate: '2024-12-31' },
];

const mockProjects = [
  { id: '1', key: 'PROJ1', name: 'E-commerce Platform', startDate: '2024-01-01', endDate: '2024-06-30', lead: 'Sarah Wilson' },
  { id: '2', key: 'PROJ2', name: 'Mobile App Development', startDate: '2024-02-01', endDate: '2024-08-31', lead: 'John Doe' },
  { id: '3', key: 'PROJ3', name: 'Data Analytics Dashboard', startDate: '2024-03-01', endDate: '2024-09-30', lead: 'Mike Johnson' },
];

export default App;
