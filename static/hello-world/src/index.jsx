import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';

// Import the Forge-adapted components
import ForgeLeftPanel from './components/ForgeLeftPanel';
import ForgeMiddlePanel from './components/ForgeMiddlePanel';
import ForgeRightPanel from './components/ForgeRightPanel';
import './App.css';
import './components/ExportPanel.css';

const App = () => {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [epics, setEpics] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [userMappings, setUserMappings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load users and projects from Jira
      const [usersResult, projectsResult, assignmentsResult, mappingsResult] = await Promise.all([
        invoke('getUsers'),
        invoke('getProjects'),
        invoke('getUserAssignments'),
        invoke('getUserMappings')
      ]);

      if (usersResult.success) {
        setUsers(usersResult.data);
      } else {
        console.error('Failed to load users:', usersResult.error);
      }

      if (projectsResult.success) {
        setProjects(projectsResult.data);
      } else {
        console.error('Failed to load projects:', projectsResult.error);
      }

      if (assignmentsResult.success) {
        setAssignments(assignmentsResult.data);
      } else {
        console.error('Failed to load assignments:', assignmentsResult.error);
      }

      if (mappingsResult.success) {
        setUserMappings(mappingsResult.data);
      } else {
        console.error('Failed to load mappings:', mappingsResult.error);
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = async (project) => {
    setSelectedProject(project);
    
    try {
      const epicsResult = await invoke('getEpics', { projectKey: project.key });
      if (epicsResult.success) {
        setEpics(epicsResult.data);
      } else {
        console.error('Failed to load epics:', epicsResult.error);
        setEpics([]);
      }
    } catch (error) {
      console.error('Error loading epics:', error);
      setEpics([]);
    }
  };

  const handleUserAssignment = async (userId, epicId, startDate, endDate) => {
    const newAssignments = {
      ...assignments,
      [userId]: {
        epicId,
        startDate,
        endDate,
        assignedAt: new Date().toISOString(),
        projectId: selectedProject?.id
      }
    };

    try {
      // Save to Forge storage
      const result = await invoke('saveUserAssignments', { assignments: newAssignments });
      if (result.success) {
        setAssignments(newAssignments);
      } else {
        console.error('Failed to save assignments:', result.error);
      }
    } catch (error) {
      console.error('Error saving assignments:', error);
    }
  };

  const handleUserMapping = async (userId, mappingData) => {
    const newMappings = {
      ...userMappings,
      [userId]: {
        ...mappingData,
        updatedAt: new Date().toISOString()
      }
    };

    try {
      // Save to Forge storage
      const result = await invoke('saveUserMappings', { mappings: newMappings });
      if (result.success) {
        setUserMappings(newMappings);
      } else {
        console.error('Failed to save mappings:', result.error);
      }
    } catch (error) {
      console.error('Error saving mappings:', error);
    }
  };

  // Excel export functionality
  const exportToExcel = async (exportType) => {
    try {
      const result = await invoke('exportToExcel', { exportType });
      
      if (result.success) {
        const csvContent = convertToCSV(result.data, exportType);
        downloadCSV(csvContent, `hr-resource-data-${exportType}-${new Date().toISOString().split('T')[0]}.csv`);
      } else {
        alert('Export failed: ' + result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed: ' + error.message);
    }
  };

  const convertToCSV = (data, exportType) => {
    let csvContent = '';
    
    if (exportType === 'assignments' || exportType === 'all') {
      if (data.assignments && data.assignments.length > 0) {
        csvContent += '=== USER ASSIGNMENTS ===\n';
        csvContent += convertArrayToCSV(data.assignments);
        csvContent += '\n\n';
      }
    }
    
    if (exportType === 'mappings' || exportType === 'all') {
      if (data.mappings && data.mappings.length > 0) {
        csvContent += '=== USER MAPPINGS ===\n';
        csvContent += convertArrayToCSV(data.mappings);
        csvContent += '\n\n';
      }
    }
    
    if (exportType === 'all') {
      if (data.users && data.users.length > 0) {
        csvContent += '=== USERS ===\n';
        csvContent += convertArrayToCSV(data.users);
        csvContent += '\n\n';
      }
      
      if (data.projects && data.projects.length > 0) {
        csvContent += '=== PROJECTS ===\n';
        csvContent += convertArrayToCSV(data.projects);
      }
    }
    
    return csvContent;
  };

  const convertArrayToCSV = (array) => {
    if (!array || array.length === 0) return '';
    
    const headers = Object.keys(array[0]);
    const csvRows = [];
    
    csvRows.push(headers.join(','));
    
    array.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Get available and assigned users
  const assignedUserIds = Object.keys(assignments);
  const availableUsers = users.filter(user => !assignedUserIds.includes(user.id));
  const assignedUsers = users.filter(user => assignedUserIds.includes(user.id));

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading HR Resource Manager...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={loadInitialData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>HR Resource Manager</h1>
        <div className="header-actions">
          <div className="export-buttons">
            <button 
              onClick={() => exportToExcel('assignments')} 
              className="export-btn assignments-btn"
              title="Export User Assignments to Excel"
            >
              📊 Export Assignments
            </button>
            <button 
              onClick={() => exportToExcel('mappings')} 
              className="export-btn mappings-btn"
              title="Export User Mappings to Excel"
            >
              👥 Export Mappings
            </button>
            <button 
              onClick={() => exportToExcel('all')} 
              className="export-btn all-btn"
              title="Export All Data to Excel"
            >
              📋 Export All Data
            </button>
          </div>
          <button onClick={loadInitialData} className="refresh-btn">
            🔄 Refresh Data
          </button>
        </div>
      </header>
      
      <main className="app-main">
        <ForgeLeftPanel
          availableUsers={availableUsers}
          assignedUsers={assignedUsers}
          loading={false}
          onUserClick={(user) => console.log('User clicked:', user)}
          onUserAssign={(user) => console.log('User assign:', user)}
        />
        
        <ForgeMiddlePanel
          epics={epics}
          selectedProject={selectedProject}
          assignments={assignments}
          onUserAssignment={handleUserAssignment}
          onUserRemove={(userId) => {
            const newAssignments = { ...assignments };
            delete newAssignments[userId];
            invoke('saveUserAssignments', { assignments: newAssignments })
              .then(() => setAssignments(newAssignments));
          }}
        />
        
        <ForgeRightPanel
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelect={handleProjectSelect}
          projectTimelines={{}} // Can be enhanced later
        />
      </main>
    </div>
  );
};

export default App;