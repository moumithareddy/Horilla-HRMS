const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Root endpoint for testing
app.get('/', (req, res) => {
  res.send('Horilla HRMS Attendance API is running');
});

// Special test endpoint to get all attendance records without filtering
app.get('/test-records', async (req, res) => {
  try {
    console.log('TEST: Fetching all attendance records');
    const result = await db.query('SELECT * FROM attendance ORDER BY attendance_date DESC');
    console.log(`TEST: Found ${result.rows.length} records`);
    res.json(result.rows);
  } catch (err) {
    console.error('TEST: Error fetching records:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const dbResult = await db.query('SELECT NOW()');
    
    // Get table counts
    const deptCount = await db.query('SELECT COUNT(*) FROM departments');
    const empCount = await db.query('SELECT COUNT(*) FROM employees');
    const attendanceCount = await db.query('SELECT COUNT(*) FROM attendance');
    const statusCount = await db.query('SELECT COUNT(*) FROM attendance_statuses');
    
    res.json({
      status: 'healthy',
      timestamp: dbResult.rows[0].now,
      database: 'connected',
      tables: {
        departments: parseInt(deptCount.rows[0].count),
        employees: parseInt(empCount.rows[0].count),
        attendance: parseInt(attendanceCount.rows[0].count),
        attendance_statuses: parseInt(statusCount.rows[0].count)
      }
    });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({ 
      status: 'unhealthy',
      error: err.message
    });
  }
});

// API endpoints
const apiRouter = express.Router();

// Test API endpoint to get all attendance records without filtering
apiRouter.get('/attendance/test', async (req, res) => {
  try {
    console.log('API TEST: Fetching all attendance records');
    const result = await db.query('SELECT * FROM attendance ORDER BY attendance_date DESC LIMIT 100');
    console.log(`API TEST: Found ${result.rows.length} records`);
    res.json(result.rows);
  } catch (err) {
    console.error('API TEST: Error fetching records:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all attendance records with optional filtering
apiRouter.get('/attendance/records', async (req, res) => {
  try {
    console.log('Attendance records query params:', req.query);
    const { 
      start_date, end_date, department_id, employee_id, status, 
      startDate, endDate, departmentId, employeeId 
    } = req.query;
    
    // Convert frontend params to backend format if needed
    const actualStartDate = startDate || start_date;
    const actualEndDate = endDate || end_date;
    const actualDepartmentId = departmentId || department_id;
    const actualEmployeeId = employeeId || employee_id;
    
    console.log('Using date range:', { actualStartDate, actualEndDate });
    
    let queryText = 'SELECT * FROM attendance WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;
    
    // Add date range filter if provided
    if (actualStartDate && actualEndDate) {
      queryText += ` AND attendance_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      queryParams.push(actualStartDate, actualEndDate);
      paramIndex += 2;
    } else if (actualStartDate) {
      queryText += ` AND attendance_date >= $${paramIndex}`;
      queryParams.push(actualStartDate);
      paramIndex += 1;
    } else if (actualEndDate) {
      queryText += ` AND attendance_date <= $${paramIndex}`;
      queryParams.push(actualEndDate);
      paramIndex += 1;
    }
    
    // Add department filter if provided
    if (actualDepartmentId) {
      // First get the department name
      const deptResult = await db.query('SELECT department_name FROM departments WHERE id = $1', [actualDepartmentId]);
      if (deptResult.rows.length > 0) {
        const departmentName = deptResult.rows[0].department_name;
        queryText += ` AND department_name = $${paramIndex}`;
        queryParams.push(departmentName);
        paramIndex += 1;
      }
    }
    
    // Add employee filter if provided
    if (actualEmployeeId) {
      queryText += ` AND employee_id = $${paramIndex}`;
      queryParams.push(actualEmployeeId);
      paramIndex += 1;
    }
    
    // Add status filter if provided
    if (status) {
      queryText += ` AND attendance_status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex += 1;
    }
    
    // Add ordering
    queryText += ' ORDER BY attendance_date DESC';
    
    const result = await db.query(queryText, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching attendance records:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Department endpoints
apiRouter.get('/departments', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM departments WHERE is_active = true');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Employee endpoints
apiRouter.get('/employees', async (req, res) => {
  try {
    const { department_id, status } = req.query;
    let queryText = `
      SELECT e.*, d.department_name 
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.is_active = true
    `;
    const queryParams = [];
    let paramIndex = 1;
    
    if (department_id) {
      queryText += ` AND e.department_id = $${paramIndex}`;
      queryParams.push(department_id);
      paramIndex++;
    }
    
    if (status) {
      queryText += ` AND e.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    queryText += ' ORDER BY e.employee_name';
    
    const result = await db.query(queryText, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.get('/employees/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query(`
      SELECT e.*, d.department_name 
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching employee:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Attendance statuses endpoint
apiRouter.get('/attendance/statuses', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM attendance_statuses WHERE is_active = true');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching attendance statuses:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get department attendance summary
apiRouter.get('/attendance/summary/department/:id', async (req, res) => {
  const departmentId = req.params.id;
  // Support both startDate/endDate and start_date/end_date
  const { start_date, end_date, startDate, endDate } = req.query;
  const actualStartDate = startDate || start_date;
  const actualEndDate = endDate || end_date;
  
  console.log('Department summary query params:', { departmentId, actualStartDate, actualEndDate });
  
  try {
    // Get department name if ID is provided
    let departmentName = null;
    if (departmentId && departmentId !== '0') {
      const deptResult = await db.query('SELECT department_name FROM departments WHERE id = $1', [departmentId]);
      if (deptResult.rows.length > 0) {
        departmentName = deptResult.rows[0].department_name;
      }
    }
    
    // Build the query
    let queryText = `
      SELECT 
        attendance_status, 
        COUNT(*) as count
      FROM attendance
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    // Add department filter if provided
    if (departmentName) {
      queryText += ` AND department_name = $${paramIndex}`;
      queryParams.push(departmentName);
      paramIndex++;
    }
    
    // Add date range filter if provided
    if (actualStartDate && actualEndDate) {
      queryText += ` AND attendance_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      queryParams.push(actualStartDate, actualEndDate);
      paramIndex += 2;
    } else if (actualStartDate) {
      queryText += ` AND attendance_date >= $${paramIndex}`;
      queryParams.push(actualStartDate);
      paramIndex++;
    } else if (actualEndDate) {
      queryText += ` AND attendance_date <= $${paramIndex}`;
      queryParams.push(actualEndDate);
      paramIndex++;
    }
    
    // Group by status
    queryText += ' GROUP BY attendance_status';
    
    console.log('Executing query:', queryText, 'with params:', queryParams);
    const result = await db.query(queryText, queryParams);
    console.log(`Query returned ${result.rows.length} status groups`);
    
    // Get total count
    let totalCount = 0;
    result.rows.forEach(row => {
      totalCount += parseInt(row.count);
    });
    
    // Calculate percentages and build response
    const summary = {
      department_id: departmentId,
      department_name: departmentName || 'All Departments',
      total: totalCount,
      status_counts: result.rows.map(row => ({
        status: row.attendance_status,
        count: parseInt(row.count),
        percentage: totalCount > 0 ? Math.round((parseInt(row.count) / totalCount) * 100) : 0
      })),
      date_range: {
        start_date: actualStartDate || null,
        end_date: actualEndDate || null
      }
    };
    
    console.log('Returning department summary:', summary);
    res.json(summary);
  } catch (err) {
    console.error('Error fetching department attendance summary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.get('/departments/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query('SELECT * FROM departments WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching department:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new attendance record
apiRouter.post('/attendance/records', async (req, res) => {
  const { employee_id, employee_name, employee_position, department_name, attendance_date, attendance_clock_in_time, 
          attendance_clock_out_time, attendance_worked_hour, attendance_status } = req.body;
  
  try {
    // Check for duplicates based on employee ID, name, and date
    const checkQuery = `
      SELECT id FROM attendance 
      WHERE employee_id = $1 
      AND attendance_date = $2
      AND employee_name = $3
    `;
    
    const duplicateCheck = await db.query(checkQuery, [employee_id, attendance_date, employee_name]);
    
    // If duplicate found, return error
    if (duplicateCheck.rows.length > 0) {
      console.log(`Duplicate record found for employee ${employee_name} (ID: ${employee_id}) on ${attendance_date}`);
      return res.status(409).json({ 
        error: 'Duplicate record', 
        message: `Attendance record already exists for ${employee_name} on ${attendance_date}`,
        existingRecordId: duplicateCheck.rows[0].id
      });
    }
    
    // No duplicate found, proceed with insertion
    const result = await db.query(
      'INSERT INTO attendance (employee_id, employee_name, employee_position, department_name, attendance_date, attendance_clock_in_time, attendance_clock_out_time, attendance_worked_hour, attendance_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [employee_id, employee_name, employee_position, department_name, attendance_date, attendance_clock_in_time, attendance_clock_out_time, attendance_worked_hour, attendance_status]
    );
    
    console.log(`New attendance record created for ${employee_name} on ${attendance_date}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding attendance record:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk upload attendance records
apiRouter.post('/attendance/records/bulk', async (req, res) => {
  const attendances = req.body;
  
  console.log('Received bulk upload request with', attendances.length, 'records at', new Date().toISOString());
  
  try {
    const results = [];
    const duplicates = [];
    
    // Use a transaction for bulk insert
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      console.log('Transaction BEGIN at', new Date().toISOString());
      
      for (const attendance of attendances) {
        const { employee_id, employee_name, employee_position, department_name, attendance_date, attendance_clock_in_time, 
                attendance_clock_out_time, attendance_worked_hour, attendance_status } = attendance;
        
        console.log('Processing attendance record:', {
          employee_id, 
          employee_name, 
          department_name, 
          attendance_date
        });
        
        // Check for duplicates first
        const checkQuery = `
          SELECT id FROM attendance 
          WHERE employee_id = $1 
          AND attendance_date = $2
          AND employee_name = $3
        `;
        
        const duplicateCheck = await client.query(checkQuery, [employee_id, attendance_date, employee_name]);
        
        // If duplicate found, track it but continue with other records
        if (duplicateCheck.rows.length > 0) {
          console.log(`Duplicate record found for employee ${employee_name} (ID: ${employee_id}) on ${attendance_date}`);
          duplicates.push({
            employee_id,
            employee_name,
            attendance_date,
            existingRecordId: duplicateCheck.rows[0].id,
            message: `Attendance record already exists for ${employee_name} on ${attendance_date}`
          });
          continue; // Skip to next record
        }
        
        // No duplicate, proceed with insertion
        const result = await client.query(
          'INSERT INTO attendance (employee_id, employee_name, employee_position, department_name, attendance_date, attendance_clock_in_time, attendance_clock_out_time, attendance_worked_hour, attendance_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
          [employee_id, employee_name, employee_position || '', department_name, attendance_date, attendance_clock_in_time, attendance_clock_out_time, attendance_worked_hour, attendance_status]
        );
        
        console.log('Record inserted successfully, ID:', result.rows[0].id);
        results.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      console.log('Transaction COMMITTED at', new Date().toISOString(), 'inserted', results.length, 'records');
      
      // Check how many records we have in total now
      const countResult = await db.query('SELECT COUNT(*) FROM attendance');
      console.log('Total attendance records in database:', countResult.rows[0].count);
      
      // Return both successful inserts and duplicates
      res.status(201).json({
        inserted: results,
        duplicates: duplicates,
        summary: {
          total: attendances.length,
          inserted: results.length,
          duplicates: duplicates.length
        }
      });
    } catch (e) {
      console.error('Transaction error, rolling back:', e.message);
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error bulk uploading attendance records:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// Delete an attendance record
apiRouter.delete('/attendance/records/:id', async (req, res) => {
  const id = req.params.id;
  
  try {
    await db.query('DELETE FROM attendance WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting attendance record:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mount API router
app.use('/api', apiRouter);

// Create tables if they don't exist
async function initializeDatabase() {
  try {
    // Create attendance table
    await db.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        employee_position VARCHAR(255),
        department_name VARCHAR(255) NOT NULL,
        attendance_date DATE NOT NULL,
        attendance_clock_in_time VARCHAR(10),
        attendance_clock_out_time VARCHAR(10),
        attendance_worked_hour NUMERIC(5,2),
        attendance_status VARCHAR(50),
        attendance_overtime_hour NUMERIC(5,2) DEFAULT 0,
        attendance_clock_in_location VARCHAR(50),
        attendance_clock_out_location VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create departments table
    await db.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        department_name VARCHAR(255) NOT NULL,
        department_code VARCHAR(50),
        department_company_id INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert sample departments if none exist
    const deptCount = await db.query('SELECT COUNT(*) FROM departments');
    if (parseInt(deptCount.rows[0].count) === 0) {
      await db.query(`
        INSERT INTO departments (department_name, department_code, is_active) VALUES
        ('HR', 'HR-001', true),
        ('Engineering', 'ENG-001', true),
        ('Finance', 'FIN-001', true),
        ('Marketing', 'MKT-001', true),
        ('Sales', 'SLS-001', true),
        ('IT', 'IT-001', true),
        ('Administration', 'ADM-001', true),
        ('Customer Support', 'CS-001', true),
        ('Accounting', 'ACC-001', true),
        ('Human Resources', 'HR-002', false)
      `);
      console.log('Sample departments data inserted');
    }
    
    // Create employees table
    await db.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        employee_name VARCHAR(255) NOT NULL,
        employee_position VARCHAR(255),
        department_id INTEGER,
        email VARCHAR(255),
        phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert sample employees if none exist
    const empCount = await db.query('SELECT COUNT(*) FROM employees');
    if (parseInt(empCount.rows[0].count) === 0) {
      // Get department IDs
      const hrDept = await db.query("SELECT id FROM departments WHERE department_name = 'HR' LIMIT 1");
      const engDept = await db.query("SELECT id FROM departments WHERE department_name = 'Engineering' LIMIT 1");
      const finDept = await db.query("SELECT id FROM departments WHERE department_name = 'Finance' LIMIT 1");
      const mktDept = await db.query("SELECT id FROM departments WHERE department_name = 'Marketing' LIMIT 1");
      const salesDept = await db.query("SELECT id FROM departments WHERE department_name = 'Sales' LIMIT 1");
      
      // Default to 1 if no departments found
      const hrId = hrDept.rows.length > 0 ? hrDept.rows[0].id : 1;
      const engId = engDept.rows.length > 0 ? engDept.rows[0].id : 2;
      const finId = finDept.rows.length > 0 ? finDept.rows[0].id : 3;
      const mktId = mktDept.rows.length > 0 ? mktDept.rows[0].id : 4;
      const salesId = salesDept.rows.length > 0 ? salesDept.rows[0].id : 5;
      
      await db.query(`
        INSERT INTO employees (employee_name, employee_position, department_id, email, status) VALUES
        ('John Doe', 'HR Manager', $1, 'john.doe@example.com', 'active'),
        ('Sarah Johnson', 'HR Specialist', $2, 'sarah.johnson@example.com', 'active'),
        ('Michael Brown', 'Recruiter', $3, 'michael.brown@example.com', 'active'),
        ('Emma Wilson', 'HR Assistant', $4, 'emma.wilson@example.com', 'active'),
        ('Robert Taylor', 'HR Coordinator', $5, 'robert.taylor@example.com', 'active'),
        ('Lisa Martinez', 'Payroll Specialist', $6, 'lisa.martinez@example.com', 'active'),
        ('Daniel Adams', 'Compensation Analyst', $7, 'daniel.adams@example.com', 'active'),
        ('Jennifer White', 'Training Coordinator', $8, 'jennifer.white@example.com', 'active'),
        ('Kevin Harris', 'Benefits Administrator', $9, 'kevin.harris@example.com', 'active'),
        ('Michelle Jackson', 'HR Business Partner', $10, 'michelle.jackson@example.com', 'active')
      `, [hrId, hrId, hrId, hrId, hrId, hrId, hrId, hrId, hrId, hrId]);
      
      await db.query(`
        INSERT INTO employees (employee_name, employee_position, department_id, email, status) VALUES
        ('Emily Chen', 'Lead Developer', $1, 'emily.chen@example.com', 'active'),
        ('David Wilson', 'Backend Developer', $2, 'david.wilson@example.com', 'active'),
        ('Sophia Martinez', 'Frontend Developer', $3, 'sophia.martinez@example.com', 'active'),
        ('James Taylor', 'DevOps Engineer', $4, 'james.taylor@example.com', 'active')
      `, [engId, engId, engId, engId]);
      
      await db.query(`
        INSERT INTO employees (employee_name, employee_position, department_id, email, status) VALUES
        ('Robert Garcia', 'Finance Director', $1, 'robert.garcia@example.com', 'active'),
        ('Amanda Lee', 'Financial Analyst', $2, 'amanda.lee@example.com', 'active')
      `, [finId, finId]);
      
      await db.query(`
        INSERT INTO employees (employee_name, employee_position, department_id, email, status) VALUES
        ('Jessica White', 'Marketing Manager', $1, 'jessica.white@example.com', 'active'),
        ('Daniel Harris', 'Content Strategist', $2, 'daniel.harris@example.com', 'active'),
        ('Lisa Thompson', 'Social Media Specialist', $3, 'lisa.thompson@example.com', 'active')
      `, [mktId, mktId, mktId]);
      
      await db.query(`
        INSERT INTO employees (employee_name, employee_position, department_id, email, status) VALUES
        ('Kevin Clark', 'Sales Director', $1, 'kevin.clark@example.com', 'active'),
        ('Michelle Scott', 'Account Manager', $2, 'michelle.scott@example.com', 'active'),
        ('Thomas Anderson', 'Sales Representative', $3, 'thomas.anderson@example.com', 'active')
      `, [salesId, salesId, salesId]);
      
      console.log('Sample employees data inserted');
    }
    
    // Create attendance_statuses table
    await db.query(`
      CREATE TABLE IF NOT EXISTS attendance_statuses (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        color VARCHAR(20) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);
    
    // Insert sample attendance statuses if none exist
    const statusCount = await db.query('SELECT COUNT(*) FROM attendance_statuses');
    if (parseInt(statusCount.rows[0].count) === 0) {
      await db.query(`
        INSERT INTO attendance_statuses (id, name, color) VALUES
        ('PRESENT', 'Present', '#4CAF50'),
        ('LATE', 'Late', '#FF9800'),
        ('ABSENT', 'Absent', '#F44336'),
        ('LEAVE', 'On Leave', '#9C27B0'),
        ('HOLIDAY', 'Holiday', '#3F51B5'),
        ('HALF_DAY', 'Half Day', '#00BCD4')
      `);
      console.log('Sample attendance statuses data inserted');
    }
    
    // Insert sample attendance records if none exist
    const attendanceCount = await db.query('SELECT COUNT(*) FROM attendance');
    if (parseInt(attendanceCount.rows[0].count) === 0) {
      // Get employees
      const employees = await db.query(`
        SELECT e.id, e.employee_name, e.employee_position, d.department_name
        FROM employees e
        JOIN departments d ON e.department_id = d.id
        WHERE e.is_active = true
      `);
      
      if (employees.rows.length > 0) {
        // Current date for sample data
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Format dates for SQL
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        // Insert attendance records for today
        for (const employee of employees.rows) {
          // Randomize clock in time slightly (8:45 - 9:15)
          const randomMinutes = Math.floor(Math.random() * 30) - 15;
          const baseHour = 9;
          const baseMinute = 0;
          
          let clockInHour = baseHour;
          let clockInMinute = baseMinute + randomMinutes;
          
          // Adjust hour if minutes overflow
          if (clockInMinute < 0) {
            clockInHour -= 1;
            clockInMinute += 60;
          } else if (clockInMinute >= 60) {
            clockInHour += 1;
            clockInMinute -= 60;
          }
          
          // Format clock times
          const clockInTime = `${clockInHour.toString().padStart(2, '0')}:${clockInMinute.toString().padStart(2, '0')}`;
          const clockOutTime = '17:00';
          
          // Calculate work hours (approximate)
          const workHours = (17 - clockInHour) - (clockInMinute / 60);
          
          // Determine status
          let status = 'PRESENT';
          if (clockInHour > 9 || (clockInHour === 9 && clockInMinute > 5)) {
            status = 'LATE';
          }
          
          // Insert the record
          await db.query(`
            INSERT INTO attendance (
              employee_id, 
              employee_name, 
              employee_position,
              department_name, 
              attendance_date, 
              attendance_clock_in_time, 
              attendance_clock_out_time, 
              attendance_worked_hour, 
              attendance_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            employee.id,
            employee.employee_name,
            employee.employee_position,
            employee.department_name,
            todayStr,
            clockInTime,
            clockOutTime,
            parseFloat(workHours.toFixed(2)),
            status
          ]);
          
          // Also insert a record for yesterday (with different times)
          const yesterdayRandomMinutes = Math.floor(Math.random() * 20) - 10;
          let yesterdayClockInHour = baseHour;
          let yesterdayClockInMinute = baseMinute + yesterdayRandomMinutes;
          
          // Adjust hour if minutes overflow
          if (yesterdayClockInMinute < 0) {
            yesterdayClockInHour -= 1;
            yesterdayClockInMinute += 60;
          }
          
          const yesterdayClockInTime = `${yesterdayClockInHour.toString().padStart(2, '0')}:${yesterdayClockInMinute.toString().padStart(2, '0')}`;
          const yesterdayClockOutTime = '17:30';
          const yesterdayWorkHours = (17.5 - yesterdayClockInHour) - (yesterdayClockInMinute / 60);
          
          // For yesterday, most are present
          let yesterdayStatus = 'PRESENT';
          if (Math.random() < 0.1) {
            yesterdayStatus = 'LATE';
          } else if (Math.random() > 0.95) {
            yesterdayStatus = 'ABSENT';
          }
          
          // Skip inserting absent records
          if (yesterdayStatus !== 'ABSENT') {
            await db.query(`
              INSERT INTO attendance (
                employee_id, 
                employee_name, 
                employee_position,
                department_name, 
                attendance_date, 
                attendance_clock_in_time, 
                attendance_clock_out_time, 
                attendance_worked_hour, 
                attendance_status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
              employee.id,
              employee.employee_name,
              employee.employee_position,
              employee.department_name,
              yesterdayStr,
              yesterdayClockInTime,
              yesterdayClockOutTime,
              parseFloat(yesterdayWorkHours.toFixed(2)),
              yesterdayStatus
            ]);
          }
        }
        
        console.log('Sample attendance records inserted');
      }
    }
    
    console.log('Database tables initialized successfully');
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
}

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  initializeDatabase();
});