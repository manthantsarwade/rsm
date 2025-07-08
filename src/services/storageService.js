const STORAGE_KEY = process.env.REACT_APP_STORAGE_KEY || 'hr_resource_manager_data';

export const storageService = {
  // Save data to localStorage
  saveData(data) {
    try {
      const existingData = this.loadData();
      const updatedData = { ...existingData, ...data };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      return true;
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
      return false;
    }
  },

  // Load data from localStorage
  loadData() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      return {};
    }
  },

  // Save user assignments
  saveAssignments(assignments) {
    return this.saveData({ assignments });
  },

  // Load user assignments
  loadAssignments() {
    const data = this.loadData();
    return data.assignments || {};
  },

  // Save user data
  saveUsers(users) {
    return this.saveData({ users });
  },

  // Load user data
  loadUsers() {
    const data = this.loadData();
    return data.users || [];
  },

  // Save project data
  saveProjects(projects) {
    return this.saveData({ projects });
  },

  // Load project data
  loadProjects() {
    const data = this.loadData();
    return data.projects || [];
  },

  // Save epic data
  saveEpics(epics) {
    return this.saveData({ epics });
  },

  // Load epic data
  loadEpics() {
    const data = this.loadData();
    return data.epics || [];
  },

  // Save user availability settings
  saveUserAvailability(userId, startDate, endDate) {
    const data = this.loadData();
    const userAvailability = data.userAvailability || {};
    
    userAvailability[userId] = {
      startDate,
      endDate,
      updatedAt: new Date().toISOString()
    };

    return this.saveData({ userAvailability });
  },

  // Load user availability settings
  loadUserAvailability(userId) {
    const data = this.loadData();
    const userAvailability = data.userAvailability || {};
    return userAvailability[userId] || null;
  },

  // Check if user is available on a specific date
  isUserAvailable(userId, date) {
    const availability = this.loadUserAvailability(userId);
    if (!availability) return false;

    const checkDate = new Date(date);
    const startDate = new Date(availability.startDate);
    const endDate = new Date(availability.endDate);

    return checkDate >= startDate && checkDate <= endDate;
  },

  // Get all available users for a specific date
  getAvailableUsers(date) {
    const users = this.loadUsers();
    return users.filter(user => this.isUserAvailable(user.id, date));
  },

  // Save project settings
  saveProjectSettings(projectId, settings) {
    const data = this.loadData();
    const projectSettings = data.projectSettings || {};
    
    projectSettings[projectId] = {
      ...settings,
      updatedAt: new Date().toISOString()
    };

    return this.saveData({ projectSettings });
  },

  // Load project settings
  loadProjectSettings(projectId) {
    const data = this.loadData();
    const projectSettings = data.projectSettings || {};
    return projectSettings[projectId] || {};
  },

  // Export data to JSON
  exportData() {
    const data = this.loadData();
    return JSON.stringify(data, null, 2);
  },

  // Import data from JSON
  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  },

  // Clear all data
  clearData() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  },

  // Get data size
  getDataSize() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? new Blob([data]).size : 0;
  },

  // Get data statistics
  getDataStats() {
    const data = this.loadData();
    return {
      users: (data.users || []).length,
      projects: (data.projects || []).length,
      epics: (data.epics || []).length,
      assignments: Object.keys(data.assignments || {}).length,
      userAvailability: Object.keys(data.userAvailability || {}).length,
      projectSettings: Object.keys(data.projectSettings || {}).length,
      dataSize: this.getDataSize(),
      lastUpdated: data.lastUpdated || null
    };
  }
};

export default storageService;
