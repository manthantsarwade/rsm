# Jira Forge App Setup Guide

This guide will help you convert your existing HR Resource Manager React app into a Jira Forge app.

## Prerequisites

1. **Atlassian Developer Account**: You need an Atlassian developer account
2. **Forge CLI**: Install the Forge CLI globally
3. **Node.js**: Version 14 or higher

## Step 1: Install Forge CLI

```bash
npm install -g @forge/cli
```

## Step 2: Login to Forge

```bash
forge login
```

Follow the prompts to authenticate with your Atlassian account.

## Step 3: Create New Forge App

```bash
forge create
```

Choose:
- **Template**: Custom UI (React)
- **App name**: hr-resource-manager
- **Product**: Jira

## Step 4: Replace Generated Files

After creating the Forge app, replace the generated files with our converted files:

### 1. Replace manifest.yml
Copy the content from `manifest.yml` in this project to your Forge app's `manifest.yml`

### 2. Replace package.json
Copy the content from `package-forge.json` to your Forge app's `package.json`

### 3. Replace Backend Code
Copy `src/forge-backend.js` to your Forge app's `src/index.js`

### 4. Replace Frontend Code
Copy the entire `static/hello-world/src/` directory to your Forge app's `static/hello-world/src/`

## Step 5: Install Dependencies

```bash
cd your-forge-app-directory
npm install
```

## Step 6: Build and Deploy

```bash
# Build the app
forge build

# Deploy to development environment
forge deploy

# Install the app in your Jira site
forge install
```

## Step 7: Configure Permissions

The app requires these permissions (already configured in manifest.yml):
- `read:jira-user` - To read user information
- `read:jira-work` - To read projects, epics, and issues
- `write:jira-work` - To update issue assignments
- `storage:app` - To store user mappings and assignments

## Key Features of the Forge Version

### 1. **Automatic Jira Integration**
- No need for API tokens or manual configuration
- Direct access to current Jira instance data
- Automatic authentication using Forge's built-in auth

### 2. **Forge Storage API**
- Persistent storage for user assignments
- HR user mappings stored securely
- Project settings and configurations

### 3. **Native Jira Experience**
- Appears as a project page in Jira
- Consistent with Jira's UI/UX
- No external hosting required

## Usage Guide

### Initial Setup (HR Admin)

1. **Access the App**: Go to any project in Jira and look for "HR Resource Manager" in the project sidebar
2. **First Launch**: The app will automatically load all users and projects from your Jira instance
3. **Map Users to Projects**: HR can manually assign employees to their respective projects
4. **Save Mappings**: All assignments are automatically saved using Forge storage

### Daily Operations

1. **View Projects**: All Jira projects are automatically loaded
2. **Select Project**: Click on a project to view its epics
3. **Assign Users**: Use the assignment interface to assign users to epics with date ranges
4. **Track Assignments**: View current assignments and availability

## Data Storage Structure

### User Assignments
```javascript
{
  "userId": {
    "epicId": "EPIC-123",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "assignedAt": "2024-01-01T10:00:00Z"
  }
}
```

### User Mappings (HR Configuration)
```javascript
{
  "userId": {
    "projectIds": ["10001", "10002"],
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

### Project Settings
```javascript
{
  "projectId": {
    "customSettings": {},
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

## Development and Testing

### Local Development
```bash
# Start tunnel for local development
forge tunnel

# View logs
forge logs
```

### Production Deployment
```bash
# Deploy to production
forge deploy --environment production

# Install in production
forge install --environment production
```

## Troubleshooting

### Common Issues

1. **Permission Errors**
   - Ensure all required scopes are in manifest.yml
   - Redeploy after permission changes

2. **Storage Issues**
   - Check Forge storage limits
   - Verify data structure matches expected format

3. **UI Not Loading**
   - Check browser console for errors
   - Verify all component imports are correct

### Debugging

```bash
# View app logs
forge logs

# Check app status
forge list

# Uninstall and reinstall
forge uninstall
forge install
```

## Migration from Current App

### Data Migration
1. Export data from current localStorage-based app
2. Transform data to match Forge storage structure
3. Import using Forge storage API

### User Training
1. The interface remains largely the same
2. Data is now automatically synced with Jira
3. No need for manual API configuration

## Benefits of Forge Version

1. **Security**: No API tokens to manage
2. **Integration**: Native Jira experience
3. **Scalability**: Forge handles hosting and scaling
4. **Maintenance**: Automatic updates and security patches
5. **Compliance**: Meets Atlassian's security standards

## Next Steps

1. Test the app in development environment
2. Train HR team on new interface
3. Migrate existing data if needed
4. Deploy to production
5. Monitor usage and gather feedback

## Support

For issues with the Forge app:
1. Check Forge documentation: https://developer.atlassian.com/platform/forge/
2. Review app logs using `forge logs`
3. Contact your development team for custom modifications