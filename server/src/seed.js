require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./models/Service');
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
    console.log('[Seed] Connected to database. Seeding services...');

    // Clear existing services to ensure fresh clean state for demo
    await Service.deleteMany({});
    const createdServices = await Service.insertMany(demoServices);

    console.log(`[Seed] Successfully seeded ${createdServices.length} demo services:`);
    createdServices.forEach((svc) => {
      console.log(` - [${svc.prefix}] ${svc.name} (~${svc.avgServiceMinutes}m per customer) id: ${svc._id}`);
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

