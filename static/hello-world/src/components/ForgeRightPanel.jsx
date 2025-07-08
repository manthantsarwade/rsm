import React, { useState } from 'react';

const ForgeRightPanel = ({ projects, selectedProject, onProjectSelect, projectTimelines }) => {
  const [searchTerm, setSearchTerm] = useState('');

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

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="right-panel">
      <div className="panel-header">
        <h2>Projects</h2>
        <div className="project-count-badge">{sortedProjects.length}/{projects.length}</div>
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
      
      <div className="projects-container">
        {sortedProjects.length === 0 && projects.length > 0 && (
          <div className="no-projects">
            <div className="no-projects-icon">🔍</div>
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
              
              {project.description && (
                <div className="project-description">
                  {project.description.length > 100 
                    ? `${project.description.substring(0, 100)}...` 
                    : project.description
                  }
                </div>
              )}
              
              <div className="project-lead">
                <span className="lead-label">Lead:</span>
                <span className="lead-name">{project.lead}</span>
              </div>
              
              <div className="project-timeline">
                <div className="timeline-item">
                  <span className="timeline-label">Start:</span>
                  <span className="timeline-date">
                    {formatDate(displayStartDate)}
                  </span>
                </div>
                <div className="timeline-item">
                  <span className="timeline-label">End:</span>
                  <span className="timeline-date">
                    {formatDate(displayEndDate)}
                  </span>
                </div>
              </div>
              
              <div className="project-category">
                <span className="category-label">Category:</span>
                <span className="category-name">{project.category}</span>
              </div>
              
              <div className="project-actions">
                <button 
                  className="action-btn primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProjectSelect(project);
                  }}
                >
                  View Epics
                </button>
              </div>
            </div>
          );
        })}
        
        {projects.length === 0 && (
          <div className="no-projects">
            <div className="no-projects-icon">📁</div>
            <p>No projects found</p>
            <span>Projects will appear here once loaded from Jira</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgeRightPanel;