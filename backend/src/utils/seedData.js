require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');
const Invitation = require('../models/Invitation');
const DonationHistory = require('../models/DonationHistory');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const OTPRecord = require('../models/OTPRecord');
const { calculateNextEligibleDate } = require('../utils/cooldown');

const seedDatabase = async (connUri) => {
  const uri = connUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/lifelink';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }

  // Clear existing collections
  await User.deleteMany({});
  await BloodRequest.deleteMany({});
  await Invitation.deleteMany({});
  await DonationHistory.deleteMany({});
  await Notification.deleteMany({});
  await AuditLog.deleteMany({});
  await OTPRecord.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Password@123', salt);

  const now = new Date();

  // 1. Suriya (Requester, 20 yrs old, Ramapuram, Chennai)
  const suriyaDob = new Date();
  suriyaDob.setFullYear(now.getFullYear() - 20);
  suriyaDob.setMonth(3);
  suriyaDob.setDate(15);

  const suriya = await User.create({
    fullName: 'Suriya',
    email: 'suriya@example.com',
    phone: '+91 98401 23456',
    passwordHash: defaultPasswordHash,
    bloodGroup: 'O+',
    dateOfBirth: suriyaDob,
    ageEligibilityVerified: true,
    locationAddress: 'Ramapuram, Chennai, Tamil Nadu',
    latitude: 13.0315,
    longitude: 80.1818,
    donorStatus: 'Active',
    isAvailable: true,
    totalDonations: 0,
    emailVerified: true
  });

  // 2. Ranjith (Donor from prompt, 24 yrs old, O+, Tambaram, Chennai - approx 14.5 km from Ramapuram)
  const ranjithDob = new Date();
  ranjithDob.setFullYear(now.getFullYear() - 24);
  ranjithDob.setMonth(7);
  ranjithDob.setDate(20);

  const ranjith = await User.create({
    fullName: 'Ranjith',
    email: 'ranjith@example.com',
    phone: '+91 98402 34567',
    passwordHash: defaultPasswordHash,
    bloodGroup: 'O+',
    dateOfBirth: ranjithDob,
    ageEligibilityVerified: true,
    locationAddress: 'Tambaram, Chennai, Tamil Nadu',
    latitude: 12.9249,
    longitude: 80.1000,
    donorStatus: 'Active',
    isAvailable: true,
    totalDonations: 2,
    lastDonationDate: new Date(now.getTime() - 240 * 24 * 60 * 60 * 1000), // 8 months ago
    nextEligibleDate: null,
    emailVerified: true
  });

  // 3. Vignesh (Universal donor O-, Guindy, Chennai - ~7 km from Ramapuram)
  const vigneshDob = new Date();
  vigneshDob.setFullYear(now.getFullYear() - 26);
  const vignesh = await User.create({
    fullName: 'Vignesh',
    email: 'vignesh@example.com',
    phone: '+91 98403 45678',
    passwordHash: defaultPasswordHash,
    bloodGroup: 'O-', // Compatible with O+
    dateOfBirth: vigneshDob,
    ageEligibilityVerified: true,
    locationAddress: 'Guindy, Chennai, Tamil Nadu',
    latitude: 13.0067,
    longitude: 80.2025,
    donorStatus: 'Active',
    isAvailable: true,
    totalDonations: 4,
    emailVerified: true
  });

  // 4. Priya (Donor A+, Chennai Central - ~13 km, NOT compatible with O+ request)
  const priyaDob = new Date();
  priyaDob.setFullYear(now.getFullYear() - 22);
  const priya = await User.create({
    fullName: 'Priya',
    email: 'priya@example.com',
    phone: '+91 98404 56789',
    passwordHash: defaultPasswordHash,
    bloodGroup: 'A+', // Incompatible with O+
    dateOfBirth: priyaDob,
    ageEligibilityVerified: true,
    locationAddress: 'Chennai Central, Chennai, Tamil Nadu',
    latitude: 13.0827,
    longitude: 80.2707,
    donorStatus: 'Active',
    isAvailable: true,
    totalDonations: 1,
    emailVerified: true
  });

  // 5. Divya (O+ Donor in Kanchipuram - ~62 km from Ramapuram, outside 50 km radius)
  const divyaDob = new Date();
  divyaDob.setFullYear(now.getFullYear() - 23);
  const divya = await User.create({
    fullName: 'Divya',
    email: 'divya@example.com',
    phone: '+91 98405 67890',
    passwordHash: defaultPasswordHash,
    bloodGroup: 'O+',
    dateOfBirth: divyaDob,
    ageEligibilityVerified: true,
    locationAddress: 'Kanchipuram, Tamil Nadu',
    latitude: 12.8342,
    longitude: 79.7036, // ~62 km from Ramapuram
    donorStatus: 'Active',
    isAvailable: true,
    totalDonations: 1,
    emailVerified: true
  });

  // 6. Arun (O+ Donor in Donation Cooldown - within 50 km but in cooldown)
  const arunDob = new Date();
  arunDob.setFullYear(now.getFullYear() - 25);
  const arunDonationDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const arunNextEligible = calculateNextEligibleDate(arunDonationDate, 6);

  const arun = await User.create({
    fullName: 'Arun',
    email: 'arun@example.com',
    phone: '+91 98406 78901',
    passwordHash: defaultPasswordHash,
    bloodGroup: 'O+',
    dateOfBirth: arunDob,
    ageEligibilityVerified: true,
    locationAddress: 'Porur, Chennai, Tamil Nadu',
    latitude: 13.0382,
    longitude: 80.1565,
    donorStatus: 'Donation Cooldown',
    isAvailable: false,
    totalDonations: 3,
    lastDonationDate: arunDonationDate,
    nextEligibleDate: arunNextEligible,
    emailVerified: true
  });

  // Sample donation history for Ranjith
  await DonationHistory.create({
    donorId: ranjith._id,
    requesterId: suriya._id,
    requestId: new mongoose.Types.ObjectId(),
    invitationId: new mongoose.Types.ObjectId(),
    bloodGroup: 'O+',
    units: 1,
    requestLocation: 'Government Hospital, Chennai',
    recordType: 'Confirmed Actual Donation',
    recordedDate: ranjith.lastDonationDate,
    actualDonationConfirmed: true,
    nextEligibleDate: calculateNextEligibleDate(ranjith.lastDonationDate, 6),
    status: 'Completed'
  });

  return { suriya, ranjith, vignesh, priya, divya, arun };
};

if (require.main === module) {
  seedDatabase().then(() => {
    console.log('[LifeLink Seeder] Finished.');
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seedDatabase };
