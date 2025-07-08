import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { storage } from '@forge/api';

const resolver = new Resolver();

// Get all users from current Jira instance
resolver.define('getUsers', async (req) => {
  try {
    const response = await api.asApp().requestJira(route`/rest/api/3/users/search?maxResults=1000`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const users = await response.json();
    
    // Transform users to match our app format
    const transformedUsers = users.map(user => ({
      id: user.accountId,
      name: user.displayName,
      email: user.emailAddress || '',
      role: 'Developer', // Default role, can be customized
      accountId: user.accountId,
      avatarUrl: user.avatarUrls ? user.avatarUrls['48x48'] : null,
      active: user.active
    }));

    return {
      success: true,
      data: transformedUsers
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Get all projects from current Jira instance
resolver.define('getProjects', async (req) => {
  try {
    const response = await api.asApp().requestJira(route`/rest/api/3/project`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const projects = await response.json();
    
    // Transform projects to match our app format
    const transformedProjects = await Promise.all(projects.map(async (project) => {
      let leadName = 'Unknown';
      
      // Get project lead details if available
      if (project.lead && project.lead.accountId) {
        try {
          const leadResponse = await api.asApp().requestJira(route`/rest/api/3/user?accountId=${project.lead.accountId}`, {
            headers: {
              'Accept': 'application/json'
            }
          });
          const leadData = await leadResponse.json();
          leadName = leadData.displayName;
        } catch (leadError) {
          console.warn('Could not fetch lead details:', leadError);
        }
      }
      
      return {
        id: project.id,
        key: project.key,
        name: project.name,
        description: project.description || '',
        lead: leadName,
        projectTypeKey: project.projectTypeKey,
        avatarUrl: project.avatarUrls ? project.avatarUrls['48x48'] : null,
        category: project.projectCategory ? project.projectCategory.name : 'Uncategorized'
      };
    }));

    return {
      success: true,
      data: transformedProjects
    };
  } catch (error) {
    console.error('Error fetching projects:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Get epics for a specific project
resolver.define('getEpics', async (req) => {
  const { projectKey } = req.payload;
  
  try {
    const jql = `project = "${projectKey}" AND type = Epic ORDER BY created DESC`;
    const response = await api.asApp().requestJira(route`/rest/api/3/search`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jql: jql,
        maxResults: 100,
        fields: ['summary', 'description', 'status', 'assignee', 'created', 'updated', 'duedate']
      })
    });
    
    const data = await response.json();
    
    // Transform epics to match our app format
    const transformedEpics = data.issues.map(epic => ({
      id: epic.id,
      key: epic.key,
      name: epic.fields.summary,
      description: epic.fields.description || '',
      status: epic.fields.status.name,
      assignee: epic.fields.assignee ? {
        id: epic.fields.assignee.accountId,
        name: epic.fields.assignee.displayName,
        email: epic.fields.assignee.emailAddress || ''
      } : null,
      created: epic.fields.created,
      updated: epic.fields.updated,
      dueDate: epic.fields.duedate
    }));

    return {
      success: true,
      data: transformedEpics
    };
  } catch (error) {
    console.error('Error fetching epics:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Storage functions for user assignments and mappings
resolver.define('saveUserAssignments', async (req) => {
  const { assignments } = req.payload;
  
  try {
    await storage.set('userAssignments', assignments);
    return {
      success: true,
      message: 'User assignments saved successfully'
    };
  } catch (error) {
    console.error('Error saving user assignments:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

resolver.define('getUserAssignments', async (req) => {
  try {
    const assignments = await storage.get('userAssignments') || {};
    return {
      success: true,
      data: assignments
    };
  } catch (error) {
    console.error('Error getting user assignments:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Save HR user mappings (employee to project mappings)
resolver.define('saveUserMappings', async (req) => {
  const { mappings } = req.payload;
  
  try {
    await storage.set('userMappings', mappings);
    return {
      success: true,
      message: 'User mappings saved successfully'
    };
  } catch (error) {
    console.error('Error saving user mappings:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

resolver.define('getUserMappings', async (req) => {
  try {
    const mappings = await storage.get('userMappings') || {};
    return {
      success: true,
      data: mappings
    };
  } catch (error) {
    console.error('Error getting user mappings:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Export data to Excel format
resolver.define('exportToExcel', async (req) => {
  try {
    const { exportType } = req.payload; // 'assignments', 'mappings', or 'all'
    
    // Get all data from storage
    const [assignments, mappings, usersResult, projectsResult] = await Promise.all([
      storage.get('userAssignments') || {},
      storage.get('userMappings') || {},
      // Get fresh user and project data for mapping
      getUsersData(),
      getProjectsData()
    ]);

    const users = usersResult.success ? usersResult.data : [];
    const projects = projectsResult.success ? projectsResult.data : [];

    let excelData = {};

    if (exportType === 'assignments' || exportType === 'all') {
      excelData.assignments = formatAssignmentsForExcel(assignments, users, projects);
    }

    if (exportType === 'mappings' || exportType === 'all') {
      excelData.mappings = formatMappingsForExcel(mappings, users, projects);
    }

    if (exportType === 'all') {
      excelData.users = formatUsersForExcel(users);
      excelData.projects = formatProjectsForExcel(projects);
    }

    return {
      success: true,
      data: excelData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Helper function to get users data
async function getUsersData() {
  try {
    const response = await api.asApp().requestJira(route`/rest/api/3/users/search?maxResults=1000`, {
      headers: { 'Accept': 'application/json' }
    });
    const users = await response.json();
    const transformedUsers = users.map(user => ({
      id: user.accountId,
      name: user.displayName,
      email: user.emailAddress || '',
      role: 'Developer',
      accountId: user.accountId,
      active: user.active
    }));
    return { success: true, data: transformedUsers };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Helper function to get projects data
async function getProjectsData() {
  try {
    const response = await api.asApp().requestJira(route`/rest/api/3/project`, {
      headers: { 'Accept': 'application/json' }
    });
    const projects = await response.json();
    const transformedProjects = projects.map(project => ({
      id: project.id,
      key: project.key,
      name: project.name,
      description: project.description || '',
      lead: project.lead ? project.lead.displayName : 'Unknown',
      projectTypeKey: project.projectTypeKey,
      category: project.projectCategory ? project.projectCategory.name : 'Uncategorized'
    }));
    return { success: true, data: transformedProjects };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Format assignments data for Excel
function formatAssignmentsForExcel(assignments, users, projects) {
  const data = [];
  
  Object.entries(assignments).forEach(([userId, assignment]) => {
    const user = users.find(u => u.id === userId || u.accountId === userId);
    const project = projects.find(p => p.id === assignment.projectId);
    
    data.push({
      'User ID': userId,
      'User Name': user ? user.name : 'Unknown User',
      'User Email': user ? user.email : '',
      'Epic ID': assignment.epicId || '',
      'Epic Name': assignment.epicName || '',
      'Project ID': assignment.projectId || '',
      'Project Name': project ? project.name : 'Unknown Project',
      'Project Key': project ? project.key : '',
      'Start Date': assignment.startDate || '',
      'End Date': assignment.endDate || '',
      'Assigned At': assignment.assignedAt || '',
      'Status': assignment.status || 'Active',
      'Role': user ? user.role : '',
      'Notes': assignment.notes || ''
    });
  });

  return data;
}

// Format mappings data for Excel
function formatMappingsForExcel(mappings, users, projects) {
  const data = [];
  
  Object.entries(mappings).forEach(([userId, mapping]) => {
    const user = users.find(u => u.id === userId || u.accountId === userId);
    
    // Handle multiple projects per user
    if (mapping.projectIds && Array.isArray(mapping.projectIds)) {
      mapping.projectIds.forEach(projectId => {
        const project = projects.find(p => p.id === projectId);
        data.push({
          'User ID': userId,
          'User Name': user ? user.name : 'Unknown User',
          'User Email': user ? user.email : '',
          'Project ID': projectId,
          'Project Name': project ? project.name : 'Unknown Project',
          'Project Key': project ? project.key : '',
          'User Role': mapping.role || '',
          'Department': mapping.department || '',
          'Manager': mapping.manager || '',
          'Updated At': mapping.updatedAt || '',
          'Access Level': mapping.accessLevel || 'Standard'
        });
      });
    } else {
      // Single project or no projects
      data.push({
        'User ID': userId,
        'User Name': user ? user.name : 'Unknown User',
        'User Email': user ? user.email : '',
        'Project ID': mapping.projectId || '',
        'Project Name': mapping.projectId ? (projects.find(p => p.id === mapping.projectId)?.name || 'Unknown Project') : '',
        'Project Key': mapping.projectId ? (projects.find(p => p.id === mapping.projectId)?.key || '') : '',
        'User Role': mapping.role || '',
        'Department': mapping.department || '',
        'Manager': mapping.manager || '',
        'Updated At': mapping.updatedAt || '',
        'Access Level': mapping.accessLevel || 'Standard'
      });
    }
  });

  return data;
}

// Format users data for Excel
function formatUsersForExcel(users) {
  return users.map(user => ({
    'User ID': user.id,
    'Account ID': user.accountId,
    'Display Name': user.name,
    'Email': user.email,
    'Role': user.role,
    'Active': user.active ? 'Yes' : 'No',
    'Avatar URL': user.avatarUrl || ''
  }));
}

// Format projects data for Excel
function formatProjectsForExcel(projects) {
  return projects.map(project => ({
    'Project ID': project.id,
    'Project Key': project.key,
    'Project Name': project.name,
    'Description': project.description,
    'Project Lead': project.lead,
    'Project Type': project.projectTypeKey,
    'Category': project.category,
    'Avatar URL': project.avatarUrl || ''
  }));
}

export const handler = resolver.getDefinitions();