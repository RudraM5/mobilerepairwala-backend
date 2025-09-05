const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { customer, device, services, shopId, totalAmount, pickupPreferred, description } = req.body;
    if (!customer || !device) return res.status(400).json({ error: 'Invalid booking data' });
    await conn.beginTransaction();

    // upsert customer
    let [rows] = await conn.query(
      'SELECT id FROM customers WHERE phone = ? OR email = ?',
      [customer.phone, customer.email]
    );
    let customerId;
    if (rows.length > 0) {
      customerId = rows[0].id;
    } else {
      let [resInsert] = await conn.query(
        'INSERT INTO customers (name, phone, email, address) VALUES (?,?,?,?)',
        [customer.name, customer.phone, customer.email, customer.address]
      );
      customerId = resInsert.insertId;
    }

    // booking
    let [resBooking] = await conn.query(
      'INSERT INTO bookings (customer_id, shop_id, device_brand, device_model, total_amount, pickup_preferred, description) VALUES (?,?,?,?,?,?,?)',
      [customerId, shopId, device.brand, device.model, totalAmount, pickupPreferred ? 1 : 0, description]
    );
    const bookingId = resBooking.insertId;

    if (services && services.length) {
      for (let s of services) {
        await conn.query(
          'INSERT INTO booking_items (booking_id, service_name, price, quantity) VALUES (?,?,?,?)',
          [bookingId, s.name, s.price, s.quantity || 1]
        );
      }
    }

    await conn.commit();
    res.json({ id: bookingId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Booking failed' });
  } finally {
    conn.release();
  }
});

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 20');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
