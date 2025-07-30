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