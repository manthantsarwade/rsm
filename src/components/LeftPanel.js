import React, { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import './LeftPanel.css';

const UserList = ({ title, users, isOpen, onToggle, droppableId, status, onUserClick, isDraggable = true, searchTerm = '' }) => {
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
          <div className="user-count-badge">{sortedUsers.length}</div>
          <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
        </div>
      </div>
      
      {isOpen && (
        <Droppable droppableId={droppableId}>
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`users-container ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
            >
              {sortedUsers.map((user, index) => (
                <Draggable key={user.id} draggableId={String(user.id)} index={index} isDragDisabled={!isDraggable}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`user-card ${snapshot.isDragging ? 'dragging' : ''} ${!isDraggable ? 'no-drag' : ''} ${status === 'becoming-available' ? 'becoming-available-card' : ''}`}
                      onClick={() => onUserClick && onUserClick(user)}
                    >
                      <span className={`status-dot ${status}`}></span>
                      <div className="user-info">
                        <div className="user-name">{user.name}</div>
                        <div className="user-email">{user.email}</div>
                        <div className="user-role">{user.role}</div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
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
        </Droppable>
      )}
    </div>
  );
};

const LeftPanel = ({ availableUsers, assignedUsers, usersBecomingAvailable, loading, onUserClick }) => {
  const [isAvailableOpen, setAvailableOpen] = useState(true);
  const [isAssignedOpen, setAssignedOpen] = useState(true);
  const [isBecomingAvailableOpen, setBecomingAvailableOpen] = useState(true);
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

  return (
    <div className="left-panel">
      <div className="panel-header">
        <h2>Users</h2>
        <div className="user-count-badge">{availableUsers.length + assignedUsers.length + usersBecomingAvailable.length}</div>
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
        title="Users Becoming Available"
        users={usersBecomingAvailable}
        isOpen={isBecomingAvailableOpen}
        onToggle={() => setBecomingAvailableOpen(!isBecomingAvailableOpen)}
        droppableId="becoming-available-users"
        status="becoming-available"
        onUserClick={onUserClick}
        isDraggable={true}
        searchTerm={searchTerm}
      />
      <UserList
        title="Available Users"
        users={availableUsers}
        isOpen={isAvailableOpen}
        onToggle={() => setAvailableOpen(!isAvailableOpen)}
        droppableId="available-users"
        status="available"
        searchTerm={searchTerm}
      />
      <UserList
        title="Assigned Users"
        users={assignedUsers}
        isOpen={isAssignedOpen}
        onToggle={() => setAssignedOpen(!isAssignedOpen)}
        droppableId="assigned-users"
        status="assigned"
        onUserClick={onUserClick}
        isDraggable={true}
        searchTerm={searchTerm}
      />
    </div>
  );
};

export default LeftPanel;