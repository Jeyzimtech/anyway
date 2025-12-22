require('dotenv').config();
const express = require('express');
const cors = require('cors');
const productsRouter = require('./routes/products');
const profilesRouter = require('./routes/profiles');
const authRouter = require('./routes/auth');
const ordersRouter = require('./routes/orders');
const returnsRouter = require('./routes/returns');
const employeesRouter = require('./routes/employees');
const settingsRouter = require('./routes/settings');
const usersRouter = require('./routes/users');

const app = express();
app.use(cors());
// Increase payload limit to 50MB for base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use('/api/products', productsRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/returns', returnsRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/users', usersRouter);

const port = process.env.SERVER_PORT || 4000;
app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
