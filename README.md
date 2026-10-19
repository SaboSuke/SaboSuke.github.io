# Wolvo Plan - Data Sharing Guide

## How to Share Data Between Users

The Wolvo Plan uses a JSON file to persist and share all data between team members. All data including calculator inputs, scorecard, configuration, and tasks are stored in a single JSON file.

## File Structure

The `wolvo-plan-data.json` file contains:

```json
{
  "version": "1.0",
  "exportedAt": "2026-10-19T00:00:00.000Z",
  "exportedBy": "Wolvo Team",
  "calculator": {
    "fee": "1",
    "orders": "80",
    "cost": "320",
    "clients": "1",
    "target": "500",
    "manualRevenue": ""
  },
  "scorecard": {
    "cashOnHand": "0",
    "collected": "80",
    "invoiced": "80",
    "pipeline": "0"
  },
  "config": {
    "server": "834.238",
    "tax": "30",
    "premises": "600",
    "vatRate": "19",
    "returnedFee": "0.500",
    "exchangeFee": "0.500"
  },
  "tasks": []
}
```

## Data Sections

### 1. Calculator (`calculator`)
- Fee per delivered order
- Average delivered orders per client/month
- Monthly operating cost
- Current paying clients
- Target monthly revenue
- Manual revenue override (optional)

### 2. Scorecard (`scorecard`)
- Cash available (DT)
- Revenue collected this month (DT)
- Revenue invoiced this month (DT)
- Qualified prospects in pipeline

### 3. Configuration (`config`)
- Server cost (DT/6 months)
- Monthly tax estimate (DT)
- Premises cost (DT/3-6 months)
- VAT rate (%)
- Fee per returned order (DT)
- Fee per exchange order (DT)

### 4. Tasks (`tasks`)
Array of all tasks with:
- Task ID
- Title
- Assignee (issam/jawher/nasim)
- Priority (urgent/next/normal)
- Notes/clarifications
- Completion status
- Creation date
- Subtasks array

## Sharing Workflow

### Option 1: Email/File Sharing
1. **Export**: Click "Export all data (JSON)" button
2. **Share**: Send the `wolvo-plan-data.json` file via email, WhatsApp, or other messaging
3. **Import**: Other users click "Import data (JSON)" and select the file
4. **Result**: Everyone sees the same data

### Option 2: Version Control (Git)
1. Export data to JSON file
2. Commit to repository: `git add wolvo-plan-data.json && git commit -m "Update plan data"`
3. Team members pull: `git pull`
4. Import the file to sync data
5. After making changes, export and commit again

### Option 3: Cloud Storage
1. Upload `wolvo-plan-data.json` to Google Drive, Dropbox, or OneDrive
2. Share the folder/link with team members
3. Anyone can download and import the latest version
4. Designate one person (CEO) to maintain the master file

## Recommended Workflow

**Designated Data Owner (CEO)**
1. Export data regularly (daily/weekly)
2. Share with Jawher and Nasim
3. They import to see the latest state
4. They can make changes locally, but you control the master file
5. For tasks, they can add their own tasks and export back to you

**Team Members (Jawher/Nasim)**
1. Import the JSON file to sync with latest data
2. Add tasks specific to their responsibilities
3. Export their changes
4. Send back to CEO for integration

## LocalStorage vs JSON File

- **LocalStorage**: Automatically saves data for YOUR browser only
- **JSON File**: Used to share data BETWEEN users

Both work together:
- LocalStorage gives you persistence across page refreshes
- JSON file lets you share data with the team

## Important Notes

⚠️ **Not Real-Time**: This is manual import/export, not real-time sync
⚠️ **Conflict Resolution**: If multiple people edit the same data, the last import wins
⚠️ **Backup**: Keep copies of important JSON files before major changes
⚠️ **Version Control**: The JSON file includes a version number and export timestamp

## Troubleshooting

**Import fails?**
- Ensure the file is valid JSON
- Check that the file has the correct structure
- Look for error messages in the browser console

**Data missing after import?**
- Verify the JSON file contains all sections
- Check browser console for errors
- Try re-exporting and re-importing

**Tasks not showing?**
- Ensure the tasks array is present in the JSON
- Check that each task has required fields (id, title, assignee, priority)
- Verify the JSON syntax is correct

## File Structure

```
wolvo-plan/
├── index.html              # Main HTML file
├── styles.css              # All CSS styles
├── app.js                  # JavaScript logic
├── translations.js         # English/French translations
├── wolvo-plan-data.json    # Shared data file
└── README.md               # This file
```
