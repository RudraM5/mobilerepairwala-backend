const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM shops WHERE is_active = 1 ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, owner_name, phone, email, address, area } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing fields' });
    await pool.query(
      'INSERT INTO shops (name, owner_name, phone, email, address, area) VALUES (?,?,?,?,?,?)',
      [name, owner_name, phone, email, address, area]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
