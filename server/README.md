# Horilla HRMS Attendance API Server

This is the backend API server for the Horilla HRMS Attendance module.

## Local Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   npm install dotenv --save
   ```

3. The `.env` file in the root directory contains the PostgreSQL database connection details.

4. For local development, use the `local-db.js` file:
   ```javascript
   // In server.js
   const db = require('./local-db');
   ```

5. Start the server:
   ```
   node server/server.js
   ```

The server will run on port 3000 by default. You can access the API at `http://localhost:3000/api`.

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/attendance/records` - Get attendance records with optional filtering
- `POST /api/attendance/records` - Add a new attendance record
- `POST /api/attendance/records/bulk` - Bulk upload attendance records
- `DELETE /api/attendance/records/:id` - Delete an attendance record
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get a specific department
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get a specific employee
- `GET /api/attendance/statuses` - Get all attendance statuses

## Database Schema

The database includes the following tables:
- `attendance` - Attendance records
- `departments` - Department information
- `employees` - Employee information
- `attendance_statuses` - Attendance status types