import React, { useState } from 'react';
import './RightPanel.css';

const ProjectList = ({ title, projects, isOpen, onToggle, selectedProject, onProjectSelect, projectTimelines, searchTerm = '' }) => {
  // Filter and sort projects based on search term
  const filteredProjects = projects.filter(project => 
    (project.name && project.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (project.key && project.key.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (project.lead && project.lead.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort projects: matching search terms first, then alphabetically
  const sortedProjects = filteredProjects.sort((a, b) => {
    if (searchTerm) {
      const aMatches = a.name && a.name.toLowerCase().includes(searchTerm.toLowerCase());
      const bMatches = b.name && b.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
    }
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <div className="project-list-section">
      <div className="panel-header" onClick={onToggle}>
        <h2>{title}</h2>
        <div className="header-controls">
          <div className="project-count-badge">{sortedProjects.length}</div>
          <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
        </div>
      </div>
      
      {isOpen && (
        <div className="projects-container">
          {sortedProjects.length === 0 && projects.length > 0 && (
            <div className="no-projects">
              <div className="no-projects-icon">Search</div>
              <p>No projects match your search</p>
              <span>Try different keywords</span>
            </div>
          )}
          
          {sortedProjects.map((project) => {
            const timeline = projectTimelines[project.id];
            const displayStartDate = timeline?.startDate || project.startDate;
            const displayEndDate = timeline?.endDate || project.endDate;
            
            return (
              <div
                key={project.id}
                className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`}
                onClick={() => onProjectSelect(project)}
              >
                <div className="project-header">
                  <div className="project-key">{project.key}</div>
                  <div className="project-status">
                    <span className="status-dot active"></span>
                    <span className="status-text">Active</span>
                  </div>
                </div>
                
                <div className="project-name">{project.name}</div>
                
                <div className="project-lead">
                  <span className="lead-label">Lead:</span>
                  <span className="lead-name">{project.lead}</span>
                </div>
                
                <div className="project-timeline">
                  <div className="timeline-item">
                    <span className="timeline-label">Start:</span>
                    <span className="timeline-date">
                      {displayStartDate ? formatDate(displayStartDate) : 'TBD'}
                    </span>
                  </div>
                  <div className="timeline-item">
                    <span className="timeline-label">End:</span>
                    <span className="timeline-date">
                      {displayEndDate ? formatDate(displayEndDate) : 'TBD'}
                    </span>
                  </div>
                </div>
                
                <div className="project-actions">
                  <button className="action-btn primary">
                    View Details
                  </button>
                  <button className="action-btn secondary">
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
          
          {projects.length === 0 && (
            <div className="no-projects">
              <div className="no-projects-icon">Projects</div>
              <p>No {title.toLowerCase()} found</p>
              <span>Add your first project to get started</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RightPanel = ({ projects, selectedProject, onProjectSelect, projectTimelines, projectEpics = {} }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isActiveOpen, setActiveOpen] = useState(true);
  const [isUpcomingOpen, setUpcomingOpen] = useState(true);

  // Separate projects into active and upcoming based on epics
  const getActiveProjects = () => {
    return projects.filter(project => {
      const epics = projectEpics[project.id] || [];
      return epics.length > 0;
    });
  };

  const getUpcomingProjects = () => {
    return projects.filter(project => {
      const epics = projectEpics[project.id] || [];
      return epics.length === 0;
    });
  };

  const activeProjects = getActiveProjects();
  const upcomingProjects = getUpcomingProjects();

  return (
    <div className="right-panel">
      <div className="panel-header">
        <h2>Projects</h2>
        <div className="project-count-badge">{projects.length}</div>
      </div>
      
      <div className="search-input-container">
        <input
          type="text"
          placeholder="Search by project name or lead..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button 
            className="clear-search-btn"
            onClick={() => setSearchTerm('')}
          >
            ×
          </button>
        )}
      </div>
      
      <ProjectList
        title="Active Projects"
        projects={activeProjects}
        isOpen={isActiveOpen}
        onToggle={() => setActiveOpen(!isActiveOpen)}
        selectedProject={selectedProject}
        onProjectSelect={onProjectSelect}
        projectTimelines={projectTimelines}
        searchTerm={searchTerm}
      />
      
      <ProjectList
        title="Upcoming Projects"
        projects={upcomingProjects}
        isOpen={isUpcomingOpen}
        onToggle={() => setUpcomingOpen(!isUpcomingOpen)}
        selectedProject={selectedProject}
        onProjectSelect={onProjectSelect}
        projectTimelines={projectTimelines}
        searchTerm={searchTerm}
      />
      
      <div className="panel-footer">
        <button className="add-project-btn">
          <span className="add-icon">+</span>
          Add New Project
        </button>
      </div>
    </div>
  );
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

export default RightPanel;