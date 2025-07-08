import axios from 'axios';

// Create axios instance for our backend proxy
const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

export const jiraAPI = {
  // Get all users from Jira
  async getUsers() {
    try {
      const response = await apiClient.get('/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users from Jira:', error);
      throw error;
    }
  },

  // Get all projects from Jira
  async getProjects() {
    try {
      const response = await apiClient.get('/projects');
      return response.data;
    } catch (error) {
      console.error('Error fetching projects from Jira:', error);
      throw error;
    }
  },

  // Get epics for a specific project
  async getEpics(projectKey) {
    try {
      const response = await apiClient.get(`/projects/${projectKey}/epics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching epics from Jira:', error);
      throw error;
    }
  },

  // Get issues for a specific epic
  async getEpicIssues(epicKey) {
    try {
      const response = await apiClient.get(`/epics/${epicKey}/issues`);
      return response.data;
    } catch (error) {
      console.error('Error fetching epic issues from Jira:', error);
      throw error;
    }
  },

  // Update issue assignee
  async updateIssueAssignee(issueKey, assigneeId) {
    try {
      const response = await apiClient.put(`/issues/${issueKey}/assignee`, {
        assigneeId: assigneeId
      });
      return response.data;
    } catch (error) {
      console.error('Error updating issue assignee:', error);
      throw error;
    }
  },

  // Test connection to Jira
  async testConnection() {
    try {
      const response = await apiClient.get('/test');
      return response.data;
    } catch (error) {
      console.error('Error testing Jira connection:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default jiraAPI;
