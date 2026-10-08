import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Group from '../models/Group.js';
import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import Notification from '../models/Notification.js';
import { calculateSplit } from './splitCalculator.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/splitease';

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Connected.');

    // Clear existing data
    console.log('[Seed] Cleaning old demo collections...');
    await Promise.all([
      User.deleteMany({}),
      Group.deleteMany({}),
      Expense.deleteMany({}),
      Settlement.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('[Seed] Creating demo users...');
    // Create Users: Akash, Rahul, Jay, Dev
    const usersData = [
      {
        name: 'Akash Sharma',
        email: 'akash@splitease.dev',
        password: 'Password123!',
        defaultCurrency: 'INR',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      },
      {
        name: 'Rahul Verma',
        email: 'rahul@splitease.dev',
        password: 'Password123!',
        defaultCurrency: 'INR',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      },
      {
        name: 'Jay Patel',
        email: 'jay@splitease.dev',
        password: 'Password123!',
        defaultCurrency: 'INR',
        avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150',
      },
      {
        name: 'Dev Malhotra',
        email: 'dev@splitease.dev',
        password: 'Password123!',
        defaultCurrency: 'INR',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      },
    ];

    const createdUsers = [];
    for (const u of usersData) {
      const user = await User.create(u);
      createdUsers.push(user);
    }

    const [akash, rahul, jay, dev] = createdUsers;
    console.log(`[Seed] Created ${createdUsers.length} users successfully.`);

    // Create Groups: "Goa Trip 2026" and "Hostel Expenses"
    console.log('[Seed] Creating groups...');
    const goaGroup = await Group.create({
      name: 'Goa Trip 2026',
      description: 'Annual college batch trip to North & South Goa beach resort',
      currency: 'INR',
      image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=500',
      createdBy: akash._id,
      members: [
        { user: akash._id, role: 'admin' },
        { user: rahul._id, role: 'member' },
        { user: jay._id, role: 'member' },
        { user: dev._id, role: 'member' },
      ],
    });

    const hostelGroup = await Group.create({
      name: 'Hostel Expenses',
      description: 'Monthly flat grocery, WiFi, water jars and shared utilities',
      currency: 'INR',
      createdBy: rahul._id,
      members: [
        { user: rahul._id, role: 'admin' },
        { user: akash._id, role: 'member' },
        { user: dev._id, role: 'member' },
      ],
    });

    console.log('[Seed] Creating realistic expenses for Goa Trip 2026...');

    // Expense 1: Beach Villa & Resort Booking (Paid by Akash: ₹18,000, Equal split among all 4)
    const exp1 = await Expense.create({
      groupId: goaGroup._id,
      title: 'Beachside Villa & Resort (3 Nights)',
      amount: 18000,
      paidBy: akash._id,
      category: 'Hotel',
      splitType: 'equal',
      participants: calculateSplit({
        amount: 18000,
        splitType: 'equal',
        participants: [
          { user: akash._id },
          { user: rahul._id },
          { user: jay._id },
          { user: dev._id },
        ],
      }),
      notes: 'Luxury private pool villa in Candolim with breakfast included',
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      createdBy: akash._id,
    });

    // Expense 2: Seafood Dinner & Drinks at Curlies (Paid by Rahul: ₹4,800, Equal split)
    const exp2 = await Expense.create({
      groupId: goaGroup._id,
      title: 'Dinner at Fisherman’s Wharf',
      amount: 4800,
      paidBy: rahul._id,
      category: 'Food',
      splitType: 'equal',
      participants: calculateSplit({
        amount: 4800,
        splitType: 'equal',
        participants: [
          { user: akash._id },
          { user: rahul._id },
          { user: jay._id },
          { user: dev._id },
        ],
      }),
      notes: 'Lobster platter, butter garlic naan, and drinks',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      createdBy: rahul._id,
    });

    // Expense 3: Airport Cab & Self-Drive SUV (Paid by Jay: ₹6,400, Exact split)
    const exp3 = await Expense.create({
      groupId: goaGroup._id,
      title: 'Self-Drive Thar & Airport Pickups',
      amount: 6400,
      paidBy: jay._id,
      category: 'Travel',
      splitType: 'exact',
      participants: calculateSplit({
        amount: 6400,
        splitType: 'exact',
        participants: [
          { user: akash._id, inputValue: 1600 },
          { user: rahul._id, inputValue: 1600 },
          { user: jay._id, inputValue: 1600 },
          { user: dev._id, inputValue: 1600 },
        ],
      }),
      notes: 'Fuel included for 3 days of traveling along coast',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdBy: jay._id,
    });

    // Expense 4: Scuba Diving & Water Sports Tickets (Paid by Akash: ₹8,000, Shares split: Akash 1, Rahul 1, Jay 1, Dev 1)
    const exp4 = await Expense.create({
      groupId: goaGroup._id,
      title: 'Scuba Diving & Jet Ski Tickets',
      amount: 8000,
      paidBy: akash._id,
      category: 'Entertainment',
      splitType: 'shares',
      participants: calculateSplit({
        amount: 8000,
        splitType: 'shares',
        participants: [
          { user: akash._id, inputValue: 1 },
          { user: rahul._id, inputValue: 1 },
          { user: jay._id, inputValue: 1 },
          { user: dev._id, inputValue: 1 },
        ],
      }),
      notes: 'Instructor-led dive with video recording',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      createdBy: akash._id,
    });

    // Expense 5: Flea Market Souvenirs & Snacks (Paid by Dev: ₹3,200, Percentage split: Akash 30%, Rahul 30%, Jay 20%, Dev 20%)
    const exp5 = await Expense.create({
      groupId: goaGroup._id,
      title: 'Anjuna Flea Market Souvenirs',
      amount: 3200,
      paidBy: dev._id,
      category: 'Shopping',
      splitType: 'percentage',
      participants: calculateSplit({
        amount: 3200,
        splitType: 'percentage',
        participants: [
          { user: akash._id, inputValue: 30 },
          { user: rahul._id, inputValue: 30 },
          { user: jay._id, inputValue: 20 },
          { user: dev._id, inputValue: 20 },
        ],
      }),
      notes: 'Handmade crafts, spices, and cashew boxes',
      date: new Date(),
      createdBy: dev._id,
    });

    // Hostel group expense
    await Expense.create({
      groupId: hostelGroup._id,
      title: 'High-speed Fiber WiFi (Quarterly)',
      amount: 2400,
      paidBy: rahul._id,
      category: 'Utilities',
      splitType: 'equal',
      participants: calculateSplit({
        amount: 2400,
        splitType: 'equal',
        participants: [
          { user: rahul._id },
          { user: akash._id },
          { user: dev._id },
        ],
      }),
      notes: 'Airtel Xstream Fiber 200Mbps bill',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      createdBy: rahul._id,
    });

    console.log('[Seed] Creating demo settlement...');
    // Rahul settled ₹1,500 with Akash
    await Settlement.create({
      groupId: goaGroup._id,
      from: rahul._id,
      to: akash._id,
      amount: 1500,
      status: 'PAID',
      notes: 'UPI payment via Google Pay for Villa advance',
      settledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdBy: rahul._id,
    });

    console.log('[Seed] Creating demo notifications...');
    await Notification.create([
      {
        userId: akash._id,
        title: 'Settlement Received',
        message: 'Rahul Verma settled ₹1,500 with you in "Goa Trip 2026".',
        type: 'SETTLEMENT_PAID',
        relatedId: goaGroup._id,
        isRead: false,
      },
      {
        userId: akash._id,
        title: 'New Expense Added',
        message: 'Dev Malhotra added "Anjuna Flea Market Souvenirs" (₹3,200).',
        type: 'EXPENSE_ADDED',
        relatedId: exp5._id,
        isRead: true,
      },
      {
        userId: rahul._id,
        title: 'New Expense Added',
        message: 'Akash Sharma added "Beachside Villa & Resort" (₹18,000).',
        type: 'EXPENSE_ADDED',
        relatedId: exp1._id,
        isRead: false,
      },
    ]);

    console.log('[Seed] Data seeded successfully!');
    console.log('--------------------------------------------------');
    console.log('DEMO ACCOUNTS:');
    console.log('1. akash@splitease.dev / Password123!');
    console.log('2. rahul@splitease.dev / Password123!');
    console.log('3. jay@splitease.dev   / Password123!');
    console.log('4. dev@splitease.dev   / Password123!');
    console.log('--------------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
