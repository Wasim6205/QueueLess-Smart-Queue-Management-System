const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Service = require('./models/Service');
const User = require('./models/User');
const connectDB = require('./config/db');

const demoServices = [
  {
    name: 'General Consultation',
    prefix: 'A',
    avgServiceMinutes: 5,
    isActive: true,
    isOpen: true,
    maxTokensPerDay: 50,
  },
  {
    name: 'Dental Checkup',
    prefix: 'B',
    avgServiceMinutes: 10,
    isActive: true,
    isOpen: true,
    maxTokensPerDay: 50,
  },
  {
    name: 'Salon — Haircut',
    prefix: 'C',
    avgServiceMinutes: 15,
    isActive: true,
    isOpen: true,
    maxTokensPerDay: 50,
  },
  {
    name: 'Service Centre — Repair',
    prefix: 'D',
    avgServiceMinutes: 20,
    isActive: true,
    isOpen: true,
    maxTokensPerDay: 50,
  },
];

async function seed() {
  try {
    await connectDB();
    console.log('[Seed] Connected to database.');

    // 1. Seed Services
    await Service.deleteMany({});
    const createdServices = await Service.insertMany(demoServices);
    console.log(`[Seed] Seeded ${createdServices.length} demo services:`);
    createdServices.forEach((svc) => {
      console.log(` - [${svc.prefix}] ${svc.name} (~${svc.avgServiceMinutes}m) id: ${svc._id}`);
    });

    // 2. Seed Users
    const ownerEmail = process.env.OWNER_EMAIL || 'owner@queueless.com';
    const ownerPassword = process.env.OWNER_PASSWORD || 'OwnerSecurePass123!';
    const staffEmail = process.env.STAFF_EMAIL || 'staff@queueless.com';
    const staffPassword = process.env.STAFF_PASSWORD || 'StaffSecurePass123!';

    if (!ownerEmail || !ownerPassword || !staffEmail || !staffPassword) {
      throw new Error('OWNER_EMAIL, OWNER_PASSWORD, STAFF_EMAIL, and STAFF_PASSWORD env vars are required.');
    }

    const saltRounds = 10;
    const ownerHash = await bcrypt.hash(ownerPassword, saltRounds);
    const staffHash = await bcrypt.hash(staffPassword, saltRounds);

    await User.deleteMany({});

    const users = await User.insertMany([
      {
        name: 'Clinic Owner',
        email: ownerEmail.toLowerCase(),
        passwordHash: ownerHash,
        role: 'owner',
        isActive: true,
      },
      {
        name: 'Reception Staff',
        email: staffEmail.toLowerCase(),
        passwordHash: staffHash,
        role: 'staff',
        isActive: true,
      },
    ]);

    console.log(`[Seed] Seeded ${users.length} users:`);
    users.forEach((u) => {
      console.log(` - ${u.name} (${u.email}) [role: ${u.role}]`);
    });

    await mongoose.connection.close();
    console.log('[Seed] Done. Connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
}

seed();
