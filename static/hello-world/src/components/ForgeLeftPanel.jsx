import React, { useState } from 'react';

const UserList = ({ title, users, isOpen, onToggle, status, onUserClick, searchTerm = '' }) => {
  // Filter and sort users based on search term
  const filteredUsers = users.filter(user => 
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort users: matching search terms first, then alphabetically
  const sortedUsers = filteredUsers.sort((a, b) => {
    if (searchTerm) {
      const aMatches = a.name.toLowerCase().includes(searchTerm.toLowerCase());
      const bMatches = b.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="user-list-section">
      <div className="panel-header" onClick={onToggle}>
        <h2>{title}</h2>
        <div className="header-controls">
          <div className="user-count-badge">{sortedUsers.length}/{users.length}</div>
          <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
        </div>
      </div>
      
      {isOpen && (
        <div className="users-container">
          {sortedUsers.map((user) => (
            <div
              key={user.id}
              className="user-card"
              onClick={() => onUserClick && onUserClick(user)}
            >
              <span className={`status-dot ${status}`}></span>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
                <div className="user-role">{user.role}</div>
              </div>
              {user.avatarUrl && (
                <img src={user.avatarUrl} alt={user.name} className="user-avatar" />
              )}
            </div>
          ))}
          
          {sortedUsers.length === 0 && users.length > 0 && (
            <div className="no-users">
              <p>No users match your search</p>
            </div>
          )}
          
          {users.length === 0 && (
            <div className="no-users">
              <p>No {title.toLowerCase()}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ForgeLeftPanel = ({ availableUsers, assignedUsers, loading, onUserClick, onUserAssign }) => {
  const [isAvailableOpen, setAvailableOpen] = useState(true);
  const [isAssignedOpen, setAssignedOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <div className="left-panel">
        <div className="loading-users">
          <div className="skeleton-user"></div>
          <div className="skeleton-user"></div>
          <div className="skeleton-user"></div>
        </div>
      </div>
    );
  }

  const handleUserClick = (user) => {
    if (onUserClick) {
      onUserClick(user);
    }
    // For available users, trigger assignment flow
    if (availableUsers.includes(user) && onUserAssign) {
      onUserAssign(user);
    }
  };

  return (
    <div className="left-panel">
      <div className="panel-header">
        <h2>Users</h2>
        <div className="user-count-badge">{availableUsers.length + assignedUsers.length}</div>
      </div>
      
      <div className="search-input-container">
        <input
          type="text"
          placeholder="Search by name..."
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
      
      <UserList
        title="Available Users"
        users={availableUsers}
        isOpen={isAvailableOpen}
        onToggle={() => setAvailableOpen(!isAvailableOpen)}
        status="available"
        searchTerm={searchTerm}
        onUserClick={handleUserClick}
      />
      <UserList
        title="Assigned Users"
        users={assignedUsers}
        isOpen={isAssignedOpen}
        onToggle={() => setAssignedOpen(!isAssignedOpen)}
        status="assigned"
        onUserClick={onUserClick}
        searchTerm={searchTerm}
      />
    </div>
  );
};

export default ForgeLeftPanel;