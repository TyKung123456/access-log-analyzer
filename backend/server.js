<<<<<<< HEAD
// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const { query } = require('./config/database');
const logsRoutes = require('./routes/logs');
const statsRoutes = require('./routes/stats');

app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/logs', logsRoutes);
app.use('/api/stats', statsRoutes);

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await query(`
      SELECT
        NOW() as current_time,
        COUNT(*) as total_records,
        MAX("Date Time") as latest_access
      FROM "public"."real_log_analyze"
    `);
    res.json({ status: 'ok', database: 'connected', data: dbResult.rows[0] });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected', message: error.message });
  }
});

/**
 * Chart Data Endpoint
 * ✅ FIXED: Queries now include 'success' and 'denied' counts for charts.
 * The response is wrapped in a { data: ... } object as expected by the frontend.
 */
app.get('/api/charts/:type', async (req, res) => {
    try {
        const { type } = req.params;
        let chartQuery;
        switch (type) {
            case 'hourly':
                chartQuery = `
                    SELECT
                        EXTRACT(hour FROM "Date Time") as hour,
                        COUNT(*) as count,
                        COUNT(CASE WHEN "Allow" = true THEN 1 END) as success,
                        COUNT(CASE WHEN "Allow" = false THEN 1 END) as denied
                    FROM "public"."real_log_analyze"
                    WHERE "Date Time" IS NOT NULL
                    GROUP BY 1 ORDER BY 1;
                `;
                break;
            case 'location':
                chartQuery = `
                    SELECT
                        "Location" as location,
                        COUNT(*) as count,
                        COUNT(CASE WHEN "Allow" = true THEN 1 END) as success,
                        COUNT(CASE WHEN "Allow" = false THEN 1 END) as denied
                    FROM "public"."real_log_analyze"
                    WHERE "Location" IS NOT NULL AND "Location" != ''
                    GROUP BY 1 ORDER BY 2 DESC LIMIT 10;
                `;
                break;
            case 'direction':
                chartQuery = `
                    SELECT "Direction" as direction, COUNT(*) as count
                    FROM "public"."real_log_analyze"
                    WHERE "Direction" IS NOT NULL AND "Direction" != ''
                    GROUP BY 1 ORDER BY 2 DESC;
                `;
                break;
            default:
                return res.status(400).json({ error: 'Invalid chart type' });
        }
        const result = await query(chartQuery);
        // Wrap the database rows in a 'data' key
        res.json({ data: result.rows });
    } catch (error) {
        console.error(`❌ Error fetching chart data for type '${req.params.type}':`, error);
        res.status(500).json({ error: 'Failed to fetch chart data' });
    }
});


// Global Error Handler
app.use((error, req, res, next) => {
    console.error('💥 Unhandled Error:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
});

const startServer = async () => {
  try {
    await query('SELECT NOW()');
    console.log('✅ Database connection successful.');
    app.listen(PORT, () => {
      console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Could not start server. Database connection failed:', error.message);
    process.exit(1);
  }
};

=======
// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const { query } = require('./config/database');
const logsRoutes = require('./routes/logs');
const statsRoutes = require('./routes/stats');

app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/logs', logsRoutes);
app.use('/api/stats', statsRoutes);

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await query(`
      SELECT
        NOW() as current_time,
        COUNT(*) as total_records,
        MAX("Date Time") as latest_access
      FROM "public"."real_log_analyze"
    `);
    res.json({ status: 'ok', database: 'connected', data: dbResult.rows[0] });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected', message: error.message });
  }
});

/**
 * Chart Data Endpoint
 * ✅ FIXED: Queries now include 'success' and 'denied' counts for charts.
 * The response is wrapped in a { data: ... } object as expected by the frontend.
 */
app.get('/api/charts/:type', async (req, res) => {
    try {
        const { type } = req.params;
        let chartQuery;
        switch (type) {
            case 'hourly':
                chartQuery = `
                    SELECT
                        EXTRACT(hour FROM "Date Time") as hour,
                        COUNT(*) as count,
                        COUNT(CASE WHEN "Allow" = true THEN 1 END) as success,
                        COUNT(CASE WHEN "Allow" = false THEN 1 END) as denied
                    FROM "public"."real_log_analyze"
                    WHERE "Date Time" IS NOT NULL
                    GROUP BY 1 ORDER BY 1;
                `;
                break;
            case 'location':
                chartQuery = `
                    SELECT
                        "Location" as location,
                        COUNT(*) as count,
                        COUNT(CASE WHEN "Allow" = true THEN 1 END) as success,
                        COUNT(CASE WHEN "Allow" = false THEN 1 END) as denied
                    FROM "public"."real_log_analyze"
                    WHERE "Location" IS NOT NULL AND "Location" != ''
                    GROUP BY 1 ORDER BY 2 DESC LIMIT 10;
                `;
                break;
            case 'direction':
                chartQuery = `
                    SELECT "Direction" as direction, COUNT(*) as count
                    FROM "public"."real_log_analyze"
                    WHERE "Direction" IS NOT NULL AND "Direction" != ''
                    GROUP BY 1 ORDER BY 2 DESC;
                `;
                break;
            default:
                return res.status(400).json({ error: 'Invalid chart type' });
        }
        const result = await query(chartQuery);
        // Wrap the database rows in a 'data' key
        res.json({ data: result.rows });
    } catch (error) {
        console.error(`❌ Error fetching chart data for type '${req.params.type}':`, error);
        res.status(500).json({ error: 'Failed to fetch chart data' });
    }
});


// Global Error Handler
app.use((error, req, res, next) => {
    console.error('💥 Unhandled Error:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
});

const startServer = async () => {
  try {
    await query('SELECT NOW()');
    console.log('✅ Database connection successful.');
    app.listen(PORT, () => {
      console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Could not start server. Database connection failed:', error.message);
    process.exit(1);
  }
};

>>>>>>> dccf88c7 (update case)
startServer();