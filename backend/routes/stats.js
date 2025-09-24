<<<<<<< HEAD
// backend/routes/stats.js
const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const statsQuery = `
      SELECT
        COUNT(*) AS "totalAccess",
        COUNT(CASE WHEN "Allow" = true THEN 1 END) AS "successfulAccess",
        COUNT(CASE WHEN "Allow" = false THEN 1 END) AS "deniedAccess",
        COUNT(DISTINCT "Card Name") AS "uniqueUsers"
      FROM "public"."real_log_analyze"
    `;
    const statsResult = await query(statsQuery);
    
    const stats = {
      totalAccess: parseInt(statsResult.rows[0].totalAccess, 10) || 0,
      successfulAccess: parseInt(statsResult.rows[0].successfulAccess, 10) || 0,
      deniedAccess: parseInt(statsResult.rows[0].deniedAccess, 10) || 0,
      uniqueUsers: parseInt(statsResult.rows[0].uniqueUsers, 10) || 0
    };
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary stats' });
  }
});

module.exports = router;
=======
// backend/routes/stats.js

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Helper function to calculate time span between two dates
const getTimeSpan = (startDate, endDate) => {
  if (!startDate || !endDate) return 'N/A';
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffInMinutes = Math.floor((end - start) / (1000 * 60));

  if (diffInMinutes < 60) return `${diffInMinutes} นาที`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} ชั่วโมง`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} วัน`;
};


// GET /api/stats/summary - Get basic overall statistics
router.get('/summary', async (req, res) => {
  try {
    const summaryQuery = `
      SELECT
        COUNT(*) AS "total_records",
        COUNT(CASE WHEN "Allow" = true THEN 1 END) AS "success_count",
        COUNT(CASE WHEN "Allow" = false THEN 1 END) AS "denied_count",
        COUNT(DISTINCT "Card Name") AS "unique_cards"
      FROM "public"."real_log_analyze"
    `;
    const { rows } = await query(summaryQuery);
    const stats = rows[0];

    res.json({
      total_records: parseInt(stats.total_records, 10) || 0,
      success_count: parseInt(stats.success_count, 10) || 0,
      denied_count: parseInt(stats.denied_count, 10) || 0,
      unique_cards: parseInt(stats.unique_cards, 10) || 0
    });
  } catch (err) {
    console.error('❌ Error fetching summary stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /api/stats - Get comprehensive Thai access log data
router.get('/', async (req, res) => {
  try {
    console.log('📊 Calculating Thai access log statistics...');

    const statsQuery = `
      SELECT
        COUNT(*) as total_records,
        COUNT(CASE WHEN "Allow" = true THEN 1 END) as success_count,
        COUNT(CASE WHEN "Allow" = false THEN 1 END) as denied_count,
        COUNT(DISTINCT "Location") as unique_locations,
        COUNT(DISTINCT "Card Name") as unique_cards,
        COUNT(DISTINCT "User Type") as unique_user_types,
        COUNT(DISTINCT "Device") as unique_devices,
        MIN("Date Time") as earliest_date,
        MAX("Date Time") as latest_date,
        ROUND(
          (COUNT(CASE WHEN "Allow" = true THEN 1 END)::DECIMAL /
           NULLIF(COUNT(*), 0) * 100), 2
        ) as success_rate
      FROM "public"."real_log_analyze"
      WHERE "Date Time" IS NOT NULL
    `;

    const statsResult = await query(statsQuery);
    const stats = statsResult.rows[0];

    const peakHourQuery = `
      SELECT
        EXTRACT(hour FROM "Date Time") as hour,
        COUNT(*) as access_count
      FROM "public"."real_log_analyze"
      WHERE "Date Time" IS NOT NULL
      GROUP BY 1
      ORDER BY access_count DESC
      LIMIT 1
    `;

    const peakHourResult = await query(peakHourQuery);
    const peakHour = peakHourResult.rows[0]?.hour;

    const busiestLocationQuery = `
      SELECT "Location", COUNT(*) as access_count
      FROM "public"."real_log_analyze"
      WHERE "Location" IS NOT NULL AND "Location" != ''
      GROUP BY "Location"
      ORDER BY access_count DESC
      LIMIT 1
    `;

    const busiestLocationResult = await query(busiestLocationQuery);
    const busiestLocation = busiestLocationResult.rows[0]?.Location || 'Unknown';

    const activeDayQuery = `
      SELECT
        CASE EXTRACT(dow FROM "Date Time")
          WHEN 0 THEN 'อาทิตย์'
          WHEN 1 THEN 'จันทร์'
          WHEN 2 THEN 'อังคาร'
          WHEN 3 THEN 'พุธ'
          WHEN 4 THEN 'พฤหัสบดี'
          WHEN 5 THEN 'ศุกร์'
          WHEN 6 THEN 'เสาร์'
        END as day_name,
        COUNT(*) as access_count
      FROM "public"."real_log_analyze"
      WHERE "Date Time" IS NOT NULL
      GROUP BY 1
      ORDER BY access_count DESC
      LIMIT 1
    `;

    const activeDayResult = await query(activeDayQuery);
    const mostActiveDay = activeDayResult.rows[0]?.day_name || 'N/A';

    const topUsersQuery = `
      SELECT
        "Card Name" as card_name,
        "User Type" as user_type,
        COUNT(*) as access_count,
        COUNT(CASE WHEN "Allow" = true THEN 1 END) as success_count
      FROM "public"."real_log_analyze"
      WHERE "Card Name" IS NOT NULL AND "Card Name" != ''
      GROUP BY "Card Name", "User Type"
      ORDER BY access_count DESC
      LIMIT 10
    `;

    const topUsersResult = await query(topUsersQuery);
    const topUsers = topUsersResult.rows.map(row => ({
      cardName: row.card_name,
      userType: row.user_type,
      accessCount: parseInt(row.access_count),
      successCount: parseInt(row.success_count),
      successRate: ((parseInt(row.success_count) / (parseInt(row.access_count) || 1)) * 100).toFixed(1)
    }));

    const userTypeStatsQuery = `
      SELECT
        "User Type" as user_type,
        COUNT(*) as count
      FROM "public"."real_log_analyze"
      WHERE "User Type" IS NOT NULL AND "User Type" != ''
      GROUP BY "User Type"
      ORDER BY count DESC
    `;

    const userTypeStatsResult = await query(userTypeStatsQuery);
    const userTypeStats = userTypeStatsResult.rows.map(row => ({
      userType: row.user_type,
      count: parseInt(row.count),
      percentage: ((parseInt(row.count) / (parseInt(stats.total_records) || 1)) * 100).toFixed(1)
    }));

    const finalStats = {
      total_records: parseInt(stats.total_records) || 0,
      success_count: parseInt(stats.success_count) || 0,
      denied_count: parseInt(stats.denied_count) || 0,
      unique_locations: parseInt(stats.unique_locations) || 0,
      unique_cards: parseInt(stats.unique_cards) || 0,
      unique_user_types: parseInt(stats.unique_user_types) || 0,
      unique_devices: parseInt(stats.unique_devices) || 0,
      earliest_date: stats.earliest_date ? stats.earliest_date.toISOString().split('T')[0] : null,
      latest_date: stats.latest_date ? stats.latest_date.toISOString().split('T')[0] : null,
      success_rate: parseFloat(stats.success_rate) || 0,
      peak_hour: peakHour !== undefined ? parseInt(peakHour) : null,
      busiest_location: busiestLocation,
      most_active_day: mostActiveDay,
      top_users: topUsers,
      user_type_distribution: userTypeStats,
      total_records_formatted: (parseInt(stats.total_records) || 0).toLocaleString('th-TH'),
      success_rate_formatted: `${parseFloat(stats.success_rate) || 0}%`,
      last_updated: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
    };

    console.log(`✅ Calculated Thai statistics: ${finalStats.total_records_formatted} รายการทั้งหมด`);
    res.json(finalStats);

  } catch (error) {
    console.error('❌ Thai stats calculation error:', error);
    res.status(500).json({
      error: 'Failed to calculate Thai access statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/stats/daily - Get daily statistics (Thai format)
router.get('/daily', async (req, res) => {
  try {
    console.log(`📊 Fetching Thai daily stats for all data...`);

    // CORRECTED: Query now groups all data by date, and shows the 30 most recent days with activity.
    const dailyStatsQuery = `
      SELECT
        DATE("Date Time") as date,
        COUNT(*) as total,
        COUNT(CASE WHEN "Allow" = true THEN 1 END) as success
      FROM "public"."real_log_analyze"
      WHERE "Date Time" IS NOT NULL
      GROUP BY 1
      ORDER BY date DESC
      LIMIT 30
    `;

    const result = await query(dailyStatsQuery);

    // Reverse to show oldest to newest for the chart
    const dailyStats = result.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      dateFormatted: new Date(row.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
      total: parseInt(row.total),
      success: parseInt(row.success),
      denied: parseInt(row.total) - parseInt(row.success),
    })).reverse();

    res.json(dailyStats);

  } catch (error) {
    console.error('❌ Thai daily stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch Thai daily statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/stats/hourly - Get hourly statistics (24-hour Thai format)
router.get('/hourly', async (req, res) => {
  try {
    console.log('📊 Fetching Thai hourly statistics for all data...');

    // CORRECTED: Query now gets hourly totals across all data.
    const hourlyStatsQuery = `
      SELECT
        EXTRACT(hour FROM "Date Time") as hour,
        COUNT(*) as count,
        COUNT(CASE WHEN "Allow" = true THEN 1 END) as success
      FROM "public"."real_log_analyze"
      WHERE "Date Time" IS NOT NULL
      GROUP BY 1
      ORDER BY 1
    `;

    const result = await query(hourlyStatsQuery);
    const dataByHour = new Map(result.rows.map(row => [parseInt(row.hour), row]));

    const hourlyStats = Array.from({ length: 24 }, (_, hour) => {
      const data = dataByHour.get(hour);
      return {
        hour,
        hourFormatted: `${hour.toString().padStart(2, '0')}:00`,
        count: data ? parseInt(data.count) : 0,
        success: data ? parseInt(data.success) : 0,
        denied: data ? (parseInt(data.count) - parseInt(data.success)) : 0,
      };
    });

    res.json(hourlyStats);

  } catch (error) {
    console.error('❌ Thai hourly stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch Thai hourly statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/stats/locations - Get Thai location-based statistics
router.get('/locations', async (req, res) => {
  try {
    console.log('📊 Fetching Thai location statistics...');

    const locationStatsQuery = `
      SELECT
        "Location" as location,
        COUNT(*) as total_access,
        ROUND(
          (COUNT(CASE WHEN "Allow" = true THEN 1 END)::DECIMAL /
           NULLIF(COUNT(*), 0) * 100), 1
        ) as success_rate
      FROM "public"."real_log_analyze"
      WHERE "Location" IS NOT NULL AND "Location" != ''
      GROUP BY "Location"
      ORDER BY total_access DESC
      LIMIT 10;
    `;

    const result = await query(locationStatsQuery);

    const locationStats = result.rows.map(row => ({
      location: row.location,
      totalAccess: parseInt(row.total_access),
      successRate: parseFloat(row.success_rate) || 0,
    }));

    res.json(locationStats);

  } catch (error) {
    console.error('❌ Thai location stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch Thai location statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// GET /api/stats/security-alerts - Get security alerts and suspicious activities
router.get('/security-alerts', async (req, res) => {
  try {
    console.log('🔐 Analyzing Thai security patterns for all data...');

    // CORRECTED: Query now checks all data for security patterns.
    const failedAttemptsQuery = `
      SELECT
        "Card Name" as card_name,
        "User Type" as user_type,
        COUNT(*) as failed_attempts,
        MAX("Date Time") as last_attempt
      FROM "public"."real_log_analyze"
      WHERE "Allow" = false 
      GROUP BY "Card Name", "User Type"
      HAVING COUNT(*) >= 5
      ORDER BY failed_attempts DESC
      LIMIT 10
    `;
    const failedAttemptsResult = await query(failedAttemptsQuery);

    const unusualTimeQuery = `
      SELECT
        "Card Name" as card_name,
        "Location" as location,
        "Date Time" as access_time
      FROM "public"."real_log_analyze"
      WHERE "Allow" = true
        AND (EXTRACT(hour FROM "Date Time") < 5 OR EXTRACT(hour FROM "Date Time") >= 23)
      ORDER BY "Date Time" DESC
      LIMIT 10
    `;
    const unusualTimeResult = await query(unusualTimeQuery);

    const securityAlerts = {
      suspicious_failed_attempts: failedAttemptsResult.rows.map(row => ({
        cardName: row.card_name,
        userType: row.user_type,
        failedAttempts: parseInt(row.failed_attempts),
        lastAttempt: row.last_attempt,
        lastAttemptFormatted: new Date(row.last_attempt).toLocaleString('th-TH'),
        severity: parseInt(row.failed_attempts) >= 10 ? 'สูง' : 'ปานกลาง'
      })),
      unusual_time_access: unusualTimeResult.rows.map(row => ({
        cardName: row.card_name,
        location: row.location,
        accessTime: row.access_time,
        timeFormatted: new Date(row.access_time).toLocaleString('th-TH'),
        severity: 'ปานกลาง'
      })),
    };

    res.json(securityAlerts);

  } catch (error) {
    console.error('❌ Security alerts error:', error);
    res.status(500).json({
      error: 'Failed to fetch security alerts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
>>>>>>> dccf88c7 (update case)
