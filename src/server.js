const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const bookingsRouter = require('./routes/bookings');
const contactsRouter = require('./routes/contacts');
const servicesRouter = require('./routes/services');
const shopsRouter = require('./routes/shops');

const app = express();
app.use(express.json());

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API routes
app.use('/api/bookings', bookingsRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/shops', shopsRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
