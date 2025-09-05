const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM services ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { service_name, description, price } = req.body;
    if (!service_name) return res.status(400).json({ error: 'Missing fields' });
    await pool.query(
      'INSERT INTO services (service_name, description, price) VALUES (?,?,?)',
      [service_name, description, price]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
