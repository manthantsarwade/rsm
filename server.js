const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Jira API configuration
const JIRA_BASE_URL = process.env.REACT_APP_JIRA_BASE_URL;
const JIRA_EMAIL = process.env.REACT_APP_JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.REACT_APP_JIRA_API_TOKEN;

// Create axios instance for Jira API
const jiraClient = axios.create({
  baseURL: JIRA_BASE_URL,
  auth: {
    username: JIRA_EMAIL,
    password: JIRA_API_TOKEN
  },
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    const response = await jiraClient.get('/rest/api/3/myself');
    res.json({
      success: true,
      message: 'Jira connection successful',
      user: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to connect to Jira',
      error: error.message
    });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const response = await jiraClient.get('/rest/api/3/users/search', {
      params: {
        maxResults: 100
      }
    });
    
    const users = response.data.map(user => ({
      id: user.accountId,
      name: user.displayName,
      email: user.emailAddress,
      avatar: user.avatarUrls ? user.avatarUrls['48x48'] : null,
      role: 'Developer', // Default role, can be enhanced
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({
      error: 'Failed to fetch users',
      details: error.message
    });
  }
});

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const response = await jiraClient.get('/rest/api/3/project', {
      params: {
        expand: 'lead,description'
      }
    });
    
    const projects = await Promise.all(response.data.map(async (project) => {
      let projectLead = 'Unknown';
      
      // Try to get project lead information
      if (project.lead && project.lead.accountId) {
        try {
          const leadResponse = await jiraClient.get(`/rest/api/3/user?accountId=${project.lead.accountId}`);
          projectLead = leadResponse.data.displayName;
        } catch (leadError) {
          console.warn(`Could not fetch lead for project ${project.key}:`, leadError.message);
          projectLead = project.lead.displayName || 'Unknown';
        }
      }
      
      return {
        id: project.id,
        key: project.key,
        name: project.name,
        description: project.description || '',
        lead: projectLead,
        startDate: null, // Will be calculated from epics
        endDate: null    // Will be calculated from epics
      };
    }));
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error.message);
    res.status(500).json({
      error: 'Failed to fetch projects',
      details: error.message
    });
  }
});

// Get epics for a project
app.get('/api/projects/:projectKey/epics', async (req, res) => {
  try {
    const { projectKey } = req.params;
    const response = await jiraClient.get('/rest/api/3/search', {
      params: {
        jql: `project = "${projectKey}" AND type = Epic`,
        fields: 'summary,key,status,created,duedate,customfield_10015,customfield_10016', // Add custom fields for start date
        maxResults: 50
      }
    });
    
    const epics = response.data.issues.map(epic => {
      // Try to get actual start date from custom fields or use created date as fallback
      let startDate = epic.fields.customfield_10015 || epic.fields.customfield_10016; // Common start date fields
      if (!startDate) {
        startDate = epic.fields.created ? new Date(epic.fields.created).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      } else if (startDate.includes('T')) {
        startDate = startDate.split('T')[0];
      }
      
      let endDate = epic.fields.duedate;
      if (!endDate) {
        endDate = new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0];
      } else if (endDate.includes('T')) {
        endDate = endDate.split('T')[0];
      }
      
      return {
        id: epic.id,
        key: epic.key,
        name: epic.fields.summary,
        status: epic.fields.status.name,
        startDate: startDate,
        endDate: endDate
      };
    });
    
    res.json(epics);
  } catch (error) {
    console.error('Error fetching epics:', error.message);
    res.status(500).json({
      error: 'Failed to fetch epics',
      details: error.message
    });
  }
});

// Get issues for an epic
app.get('/api/epics/:epicKey/issues', async (req, res) => {
  try {
    const { epicKey } = req.params;
    const response = await jiraClient.get('/rest/api/3/search', {
      params: {
        jql: `"Epic Link" = "${epicKey}"`,
        fields: 'summary,key,status,assignee,created,duedate',
        maxResults: 100
      }
    });
    
    const issues = response.data.issues.map(issue => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      assignee: issue.fields.assignee ? {
        id: issue.fields.assignee.accountId,
        name: issue.fields.assignee.displayName,
        email: issue.fields.assignee.emailAddress
      } : null,
      startDate: issue.fields.created ? new Date(issue.fields.created).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: issue.fields.duedate || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
    }));
    
    res.json(issues);
  } catch (error) {
    console.error('Error fetching epic issues:', error.message);
    res.status(500).json({
      error: 'Failed to fetch epic issues',
      details: error.message
    });
  }
});

// Update issue assignee
app.put('/api/issues/:issueKey/assignee', async (req, res) => {
  try {
    const { issueKey } = req.params;
    const { assigneeId } = req.body;
    
    const response = await jiraClient.put(`/rest/api/3/issue/${issueKey}/assignee`, {
      accountId: assigneeId
    });
    
    res.json({
      success: true,
      message: 'Assignee updated successfully'
    });
  } catch (error) {
    console.error('Error updating assignee:', error.message);
    res.status(500).json({
      error: 'Failed to update assignee',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Jira Proxy Server running on port ${PORT}`);
  console.log(`📡 Connecting to Jira: ${JIRA_BASE_URL}`);
});
