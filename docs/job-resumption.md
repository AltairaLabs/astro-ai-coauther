# Job Resumption Feature

## Overview

The batch source context detection system now supports **job resumption** across page navigations. Users can safely navigate away from the dashboard while a detection job is running and return later to see the results.

## How It Works

### 1. **Job Persistence**
When a batch detection job starts, the job ID is stored in the browser's `sessionStorage`:

```javascript
sessionStorage.setItem('activeDetectionJob', jobId);
```

This persists the job reference for the duration of the browser session (until the tab is closed).

### 2. **Automatic Resume on Page Load**
When the dashboard loads, it checks for any active jobs:

1. **First**: Check sessionStorage for a stored job ID
2. **Verify**: Query the server to confirm the job still exists and is active
3. **Resume**: If active, automatically reconnect and start polling for status

```javascript
const storedJobId = sessionStorage.getItem('activeDetectionJob');
if (storedJobId) {
  // Verify job is still active
  const response = await fetch(`/_ai-coauthor/job-status?jobId=${storedJobId}`);
  if (job.status === 'running' || job.status === 'pending') {
    resumeJob(storedJobId);
  }
}
```

### 3. **Recent Jobs List**
The dashboard now shows a collapsible "Recent Jobs" section that displays:

- **Active jobs**: Currently running or pending
- **Status badges**: Visual indicators (running, completed, failed)
- **Progress bars**: Real-time progress for running jobs
- **Actions**: "View Results" button for completed jobs, "Watch" button for active jobs

### 4. **Clean State Management**
The sessionStorage is automatically cleared when:
- A job completes successfully
- A job fails
- The server returns a 404 (job expired from queue)

## User Experience

### Scenario 1: Normal Flow
1. User clicks "🔍 Detect All Pages"
2. Progress displays: "Analyzing... 5/20 pages (25%)"
3. User waits for completion
4. Results appear automatically

### Scenario 2: Navigation Away
1. User clicks "🔍 Detect All Pages"
2. Job starts (stored in sessionStorage)
3. User navigates to another site/page
4. User returns to dashboard
5. Dashboard automatically resumes job display
6. Progress updates continue seamlessly

### Scenario 3: Multiple Active Jobs
1. Dashboard shows all active jobs in "Recent Jobs" section
2. User can "Watch" any active job to monitor its progress
3. Previously watched job is remembered via sessionStorage

## Technical Details

### SessionStorage vs LocalStorage
We use **sessionStorage** (not localStorage) because:
- Jobs have a 1-hour TTL on the server
- Jobs are tied to a specific browser session
- Prevents stale job IDs from persisting indefinitely
- Automatically cleared when tab/window closes

### Job Queue TTL
The server maintains jobs for **1 hour** with automatic cleanup:
```typescript
private readonly MAX_AGE_MS = 60 * 60 * 1000; // 1 hour
```

### Polling Strategy
- Poll interval: **1 second**
- Automatic stop on completion/failure
- Refreshes active jobs list on each poll
- Updates sessionStorage with current job ID

## API Endpoints

### `GET /_ai-coauthor/job-status?jobId=xxx`
Returns the status of a specific job:
```json
{
  "id": "job-12345",
  "status": "running",
  "progress": {
    "completed": 5,
    "total": 20,
    "current": "docs/api/components.md"
  },
  "results": [...],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### `GET /_ai-coauthor/job-status` (no params)
Returns all jobs (active + recent):
```json
{
  "jobs": [
    { "id": "job-12345", "status": "running", ... },
    { "id": "job-12344", "status": "completed", ... }
  ]
}
```

## Error Handling

### Job Not Found
If the stored job ID is no longer on the server (expired):
1. Dashboard receives 404 or job with different status
2. SessionStorage is cleared
3. User sees "Recent Jobs" section with available jobs

### Network Errors
If polling fails:
1. Error displayed to user
2. SessionStorage cleared
3. Button re-enabled for retry

### Browser Session Ends
When user closes the tab:
1. SessionStorage automatically cleared by browser
2. Job continues running on server until completion or TTL
3. Can be viewed in "Recent Jobs" if returning within TTL window

## Benefits

✅ **No Lost Work**: Jobs continue running even if user navigates away
✅ **Transparent Progress**: Real-time updates when user returns
✅ **Multiple Job Support**: Can monitor any active job
✅ **Clean State**: Automatic cleanup prevents clutter
✅ **Session-Based**: No pollution of persistent storage

## Future Enhancements

Possible improvements:
- **LocalStorage option**: For jobs that should persist across browser sessions
- **Job history**: View completed jobs from previous sessions
- **Email notifications**: Alert when long-running jobs complete
- **Job cancellation**: Stop running jobs from UI
- **Job retry**: Restart failed jobs with one click
