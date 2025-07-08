# HR Resource Manager

A modern, colorful React application for managing HR resources, projects, and team assignments with Jira integration.

## Features

- **Three-Panel Layout**: 
  - Left Panel: Available users with drag-and-drop functionality
  - Middle Panel: Project epics with calendar view and user assignments
  - Right Panel: Projects list with details and progress tracking

- **Jira Integration**: 
  - Fetch users, projects, and epics from Jira API
  - Sync assignments back to Jira
  - Real-time data synchronization

- **Modern UI**:
  - Colorful gradient backgrounds
  - Glass morphism effects
  - Smooth animations and transitions
  - Responsive design
  - Drag and drop functionality

- **Resource Management**:
  - Visual user assignment to epics
  - Timeline tracking with calendar view
  - Automatic availability detection
  - Excel-like data management

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Jira API

Update the `.env` file with your Jira credentials:

```env
REACT_APP_JIRA_BASE_URL=https://your-domain.atlassian.net
REACT_APP_JIRA_EMAIL=your-email@company.com
REACT_APP_JIRA_API_TOKEN=your-api-token
REACT_APP_JIRA_PROJECT_KEY=your-project-key
```

To get your Jira API token:
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create a new API token
3. Copy the token to your `.env` file

### 3. Run the Application

```bash
npm start
```

The application will open at `http://localhost:3000`

## Usage Guide

### Initial Setup

1. **Configure Jira API**: Add your Jira credentials to the `.env` file
2. **Import Excel Data**: For the first run, manually assign employees to epics based on your Excel sheet
3. **Save Assignments**: All assignments are automatically saved to localStorage

### Managing Resources

1. **Select a Project**: Click on a project in the right panel to view its epics
2. **Assign Users**: Drag users from the left panel to epics in the middle panel
3. **View Calendar**: Use the horizontal calendar to see timeline planning
4. **Remove Assignments**: Click the 'x' button on assigned users to remove them

### Features Overview

#### Left Panel - Available Users
- Shows all users currently available for assignment
- Users appear here when their current assignments end
- Drag users to assign them to epics
- Shows user role, availability dates, and status

#### Middle Panel - Epics & Calendar
- Displays epics for the selected project
- Horizontal calendar view for timeline planning
- Drop zones for user assignments
- Remove users from assignments

#### Right Panel - Projects
- Lists all projects with details
- Shows project timeline and progress
- Click to select and view project epics
- Project lead and status information

### Data Management

- **Local Storage**: All assignments are saved automatically
- **Jira Sync**: Use the sync button to update Jira with assignments
- **Export/Import**: Data can be exported and imported as needed

## Technical Details

### Dependencies

- **React 19**: Core framework
- **@hello-pangea/dnd**: Drag and drop functionality
- **axios**: HTTP client for Jira API
- **date-fns**: Date manipulation and formatting
- **react-calendar**: Calendar component

### File Structure

```
src/
├── components/
│   ├── LeftPanel.js       # Available users panel
│   ├── MiddlePanel.js     # Epics and calendar panel
│   └── RightPanel.js      # Projects panel
├── services/
│   ├── jiraAPI.js         # Jira API integration
│   └── storageService.js  # Local storage management
├── App.js                 # Main application component
└── App.css                # Global styles
```

### Styling

- **CSS Gradients**: Modern gradient backgrounds
- **Flexbox Layout**: Responsive three-panel design
- **Custom Scrollbars**: Styled scrollbars for better UX
- **Animations**: Smooth transitions and hover effects
- **Glass Morphism**: Translucent glass-like elements

## Development

### Building for Production

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Code Quality

The application follows React best practices:
- Functional components with hooks
- Proper state management
- Error handling
- Responsive design
- Accessibility considerations

## Troubleshooting

### Common Issues

1. **Jira API Connection Error**:
   - Check your API credentials in `.env`
   - Ensure your Jira domain is correct
   - Verify API token permissions

2. **Users Not Loading**:
   - Application will show mock data if Jira API fails
   - Check browser console for error messages

3. **Drag and Drop Not Working**:
   - Ensure users are available (not already assigned)
   - Check that epic drop zones are properly configured

### Support

For issues or questions, check the browser console for error messages and ensure all dependencies are properly installed.

## Future Enhancements

- [ ] Real-time collaboration with WebSocket
- [ ] Email notifications for assignments
- [ ] Advanced reporting and analytics
- [ ] Mobile app version
- [ ] Integration with other project management tools
- [ ] Automated workload balancing
- [ ] Time tracking integration
- [ ] Approval workflows
