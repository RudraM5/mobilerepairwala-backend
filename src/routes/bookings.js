const express = require("express");
const router = express.Router();
const pool = require("../db");

// Create a new booking
router.post("/", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      customer,
      device,
      services,
      shopId,
      totalAmount,
      pickupPreferred,
      description,
    } = req.body;

    if (!customer || !device || !shopId || !totalAmount) {
      return res.status(400).json({ error: "Missing booking data" });
    }

    await conn.beginTransaction();

    // 🔹 Upsert customer
    const [existing] = await conn.query(
      "SELECT id FROM customers WHERE phone = ? OR email = ?",
      [customer.phone, customer.email]
    );

    let customerId;
    if (existing.length > 0) {
      customerId = existing[0].id;
    } else {
      const [insertCustomer] = await conn.query(
        "INSERT INTO customers (name, phone, email, address) VALUES (?,?,?,?)",
        [customer.name, customer.phone, customer.email, customer.address || ""]
      );
      customerId = insertCustomer.insertId;
    }

    // 🔹 Insert booking
    const [insertBooking] = await conn.query(
      "INSERT INTO bookings (customer_id, shop_id, device_brand, device_model, total_amount, pickup_preferred, description) VALUES (?,?,?,?,?,?,?)",
      [
        customerId,
        shopId,
        device.brand,
        device.model,
        totalAmount,
        pickupPreferred ? 1 : 0,
        description || "",
      ]
    );
    const bookingId = insertBooking.insertId;

    // 🔹 Insert booking services
    if (services && services.length > 0) {
      for (let s of services) {
        await conn.query(
          "INSERT INTO booking_items (booking_id, service_name, price, quantity) VALUES (?,?,?,?)",
          [bookingId, s.name, s.price, s.quantity || 1]
        );
      }
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      bookingId,
      message: "Booking created successfully",
    });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Booking Error:", err);
    res.status(500).json({ error: "Booking failed" });
  } finally {
    conn.release();
  }
});

// Get latest bookings (admin)
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, c.name AS customer_name, c.phone, c.email
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       ORDER BY b.created_at DESC
       LIMIT 20`
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch Bookings Error:", err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// Get bookings by customer phone/email
router.get("/customer/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier;
    const [rows] = await pool.query(
      `SELECT b.*, c.name AS customer_name, c.phone, c.email
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       WHERE c.phone = ? OR c.email = ?
       ORDER BY b.created_at DESC`,
      [identifier, identifier]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch Customer Bookings Error:", err);
    res.status(500).json({ error: "Failed to fetch customer bookings" });
  }
});

module.exports = router;
