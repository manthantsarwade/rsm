# Forge Storage API Explanation

## 🗄️ How Forge Storage Works

### Storage Location
- **NOT stored locally** - stored in Atlassian's cloud infrastructure
- **Persistent** - data survives app restarts, deployments, browser sessions
- **Secure** - encrypted and managed by Atlassian
- **Scoped** - each app has its own storage space

### Storage Code in `src/forge-backend.js`

```javascript
import { storage } from '@forge/api';

// SAVE data
await storage.set('userAssignments', assignments);

// GET data  
const assignments = await storage.get('userAssignments') || {};

// DELETE data
await storage.delete('userAssignments');
```

## 📋 Storage Functions We Created

### 1. User Assignments Storage
```javascript
// Save user assignments
resolver.define('saveUserAssignments', async (req) => {
  const { assignments } = req.payload;
  await storage.set('userAssignments', assignments);
  return { success: true };
});

// Get user assignments
resolver.define('getUserAssignments', async (req) => {
  const assignments = await storage.get('userAssignments') || {};
  return { success: true, data: assignments };
});
```

### 2. HR User Mappings Storage
```javascript
// Save HR mappings (which users belong to which projects)
resolver.define('saveUserMappings', async (req) => {
  const { mappings } = req.payload;
  await storage.set('userMappings', mappings);
  return { success: true };
});

// Get HR mappings
resolver.define('getUserMappings', async (req) => {
  const mappings = await storage.get('userMappings') || {};
  return { success: true, data: mappings };
});
```

## 🔄 How Frontend Uses Storage

In `static/hello-world/src/index.jsx`:

```javascript
// Save assignments
const handleUserAssignment = async (userId, epicId, startDate, endDate) => {
  const newAssignments = {
    ...assignments,
    [userId]: { epicId, startDate, endDate }
  };
  
  // This calls our backend storage function
  const result = await invoke('saveUserAssignments', { 
    assignments: newAssignments 
  });
  
  if (result.success) {
    setAssignments(newAssignments);
  }
};

// Load assignments on app start
useEffect(() => {
  const loadData = async () => {
    const result = await invoke('getUserAssignments');
    if (result.success) {
      setAssignments(result.data);
    }
  };
  loadData();
}, []);
```

## 💾 Data Structure Examples

### User Assignments
```javascript
{
  "user123": {
    "epicId": "EPIC-456", 
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "assignedAt": "2024-01-01T10:00:00Z"
  },
  "user456": {
    "epicId": "EPIC-789",
    "startDate": "2024-02-01", 
    "endDate": "2024-02-28",
    "assignedAt": "2024-01-15T14:30:00Z"
  }
}
```

### HR User Mappings
```javascript
{
  "user123": {
    "projectIds": ["10001", "10002"],
    "role": "Frontend Developer",
    "updatedAt": "2024-01-01T10:00:00Z"
  },
  "user456": {
    "projectIds": ["10003"],
    "role": "Backend Developer", 
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

## 🔍 Storage Limits & Features

### Limits
- **10MB per app** total storage
- **Individual key limit**: 1MB per key
- **No expiration** - data persists indefinitely

### Features
- **Automatic encryption** at rest
- **Backup & recovery** handled by Atlassian
- **Multi-region replication** for reliability
- **Atomic operations** - reads/writes are consistent

## 🛠️ Storage Management

### View Storage Usage
```javascript
// Get all storage keys
const keys = await storage.query().getMany();

// Get storage size (approximate)
const data = await storage.get('userAssignments');
const size = JSON.stringify(data).length;
```

### Clear Storage (for testing)
```javascript
resolver.define('clearAllData', async (req) => {
  await storage.delete('userAssignments');
  await storage.delete('userMappings');
  await storage.delete('projectSettings');
  return { success: true };
});
```

## 🔒 Security

- **App-scoped**: Only your app can access its storage
- **No cross-app access**: Other apps can't see your data  
- **Encrypted**: All data encrypted in transit and at rest
- **Audit logs**: Atlassian maintains access logs

## 🚀 Benefits vs localStorage

| Feature | localStorage | Forge Storage |
|---------|-------------|---------------|
| **Persistence** | Browser only | Cloud-based |
| **Sharing** | Single user | All app users |
| **Security** | Client-side | Server-side encrypted |
| **Backup** | Manual | Automatic |
| **Size Limit** | ~5-10MB | 10MB per app |
| **Reliability** | Can be cleared | Enterprise-grade |

The storage is completely automatic - you just call the functions and Forge handles all the infrastructure!