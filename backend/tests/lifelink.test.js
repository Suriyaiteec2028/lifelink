const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const BloodRequest = require('../src/models/BloodRequest');
const Invitation = require('../src/models/Invitation');
const DonationHistory = require('../src/models/DonationHistory');
const { seedDatabase } = require('../src/utils/seedData');
const { calculateDistanceKm } = require('../src/utils/distance');
const { calculateAge, isAgeEligible } = require('../src/utils/age');
const { isBloodCompatible, getCompatibleDonorGroups } = require('../src/utils/compatibility');
const { calculateNextEligibleDate, isInCooldown } = require('../src/utils/cooldown');

beforeAll(async () => {
  const connUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifelink_test';
  await seedDatabase(connUri);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('1. Business Logic & Utilities', () => {
  test('RBC Compatibility Mapping matches prompt specification', () => {
    // O+ can receive O+, O-
    expect(getCompatibleDonorGroups('O+')).toEqual(['O+', 'O-']);
    expect(isBloodCompatible('O+', 'O+')).toBe(true);
    expect(isBloodCompatible('O+', 'O-')).toBe(true);
    expect(isBloodCompatible('O+', 'A+')).toBe(false);

    // O- can only receive O-
    expect(getCompatibleDonorGroups('O-')).toEqual(['O-']);
    expect(isBloodCompatible('O-', 'O-')).toBe(true);
    expect(isBloodCompatible('O-', 'O+')).toBe(false);

    // AB+ can receive all groups
    expect(isBloodCompatible('AB+', 'A+')).toBe(true);
    expect(isBloodCompatible('AB+', 'B-')).toBe(true);
    expect(isBloodCompatible('AB+', 'O-')).toBe(true);
    expect(isBloodCompatible('AB+', 'AB-')).toBe(true);

    // AB- receives AB-, A-, B-, O-
    expect(getCompatibleDonorGroups('AB-')).toEqual(['AB-', 'A-', 'B-', 'O-']);
  });

  test('Haversine distance calculation is accurate', () => {
    // Ramapuram (13.0315, 80.1818) to Tambaram (12.9249, 80.1000)
    const distTambaram = calculateDistanceKm(13.0315, 80.1818, 12.9249, 80.1000);
    expect(distTambaram).toBeGreaterThan(12);
    expect(distTambaram).toBeLessThan(17);

    // Ramapuram to Kanchipuram (12.8342, 79.7036) is approx 62 km
    const distKanchi = calculateDistanceKm(13.0315, 80.1818, 12.8342, 79.7036);
    expect(distKanchi).toBeGreaterThan(55);
    expect(distKanchi).toBeLessThan(70);

    // Same point is 0 km
    expect(calculateDistanceKm(13.0, 80.0, 13.0, 80.0)).toBe(0);
  });

  test('Age calculation accurately checks 18+ boundary', () => {
    const today = new Date();

    // Exactly 18 years ago today
    const exact18 = new Date(today);
    exact18.setFullYear(today.getFullYear() - 18);
    expect(calculateAge(exact18)).toBe(18);
    expect(isAgeEligible(exact18)).toBe(true);

    // 17 years and 364 days (tomorrow turns 18)
    const underage = new Date(today);
    underage.setFullYear(today.getFullYear() - 18);
    underage.setDate(today.getDate() + 1);
    expect(calculateAge(underage)).toBe(17);
    expect(isAgeEligible(underage)).toBe(false);
  });

  test('Cooldown correctly adds 6 calendar months', () => {
    const testDate = new Date('2026-10-01T00:00:00Z');
    const nextEligible = calculateNextEligibleDate(testDate, 6);
    expect(nextEligible.getFullYear()).toBe(2027);
    expect(nextEligible.getMonth()).toBe(3); // April is index 3
    expect(isInCooldown(nextEligible, testDate)).toBe(true);
  });
});

describe('2. Authentication & Age Restrictions', () => {
  test('Prevents registration of user under 18 years old', async () => {
    const under18Dob = new Date();
    under18Dob.setFullYear(new Date().getFullYear() - 16);

    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({
        fullName: 'Minor User',
        phone: '+91 99999 11111',
        email: 'minor@example.com',
        bloodGroup: 'O+',
        dateOfBirth: under18Dob.toISOString(),
        locationAddress: 'Chennai',
        latitude: 13.08,
        longitude: 80.27,
        password: 'Password@123',
        confirmPassword: 'Password@123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('You must be at least 18 years old to create an account.');
  });

  test('Generates OTP for eligible 18+ registration', async () => {
    const adultDob = new Date();
    adultDob.setFullYear(new Date().getFullYear() - 22);

    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({
        fullName: 'Test Adult',
        phone: '+91 99999 22222',
        email: 'adult_test@example.com',
        bloodGroup: 'B+',
        dateOfBirth: adultDob.toISOString(),
        locationAddress: 'Adyar, Chennai',
        latitude: 13.0012,
        longitude: 80.2565,
        password: 'Password@123',
        confirmPassword: 'Password@123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.devOtp).toBeDefined();

    // Verify OTP and create user
    const verifyRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({
        email: 'adult_test@example.com',
        otp: res.body.devOtp
      });

    expect(verifyRes.statusCode).toBe(201);
    expect(verifyRes.body.token).toBeDefined();
    expect(verifyRes.body.user.fullName).toBe('Test Adult');
  });
});

describe('3. End-to-End Test Scenario: Suriya & Ranjith', () => {
  let suriyaToken;
  let ranjithToken;
  let suriyaUser;
  let ranjithUser;
  let testRequestId;
  let ranjithInvitationId;

  beforeAll(async () => {
    // Log in as Suriya
    const suriyaLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'suriya@example.com', password: 'Password@123' });
    suriyaToken = suriyaLogin.body.token;
    suriyaUser = suriyaLogin.body.user;

    // Log in as Ranjith
    const ranjithLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ranjith@example.com', password: 'Password@123' });
    ranjithToken = ranjithLogin.body.token;
    ranjithUser = ranjithLogin.body.user;
  });

  test('Suriya searches for O+ donors within 50 km of Ramapuram', async () => {
    const res = await request(app)
      .post('/api/requests/search-donors')
      .set('Authorization', `Bearer ${suriyaToken}`)
      .send({
        requiredBloodGroup: 'O+',
        requestLatitude: 13.0315,
        requestLongitude: 80.1818,
        searchRadiusKm: 50
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const donorNames = res.body.donors.map((d) => d.fullName);

    // Ranjith (Tambaram, ~14.5 km) and Vignesh (Guindy, ~7 km) should appear
    expect(donorNames).toContain('Ranjith');
    expect(donorNames).toContain('Vignesh');

    // Priya (A+ - incompatible) should NOT appear
    expect(donorNames).not.toContain('Priya');

    // Divya (Kanchipuram, ~62 km - outside 50 km) should NOT appear
    expect(donorNames).not.toContain('Divya');

    // Arun (in 6-month cooldown) should NOT appear
    expect(donorNames).not.toContain('Arun');

    // Privacy: private phone & exact coordinates must NOT be exposed in search results
    res.body.donors.forEach((d) => {
      expect(d.phone).toBeUndefined();
      expect(d.passwordHash).toBeUndefined();
    });
  });

  test('Suriya creates a Blood Request for 2 units of O+ blood', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);

    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${suriyaToken}`)
      .send({
        requiredBloodGroup: 'O+',
        unitsRequired: 2,
        requestAddress: 'MIOT Hospital, Ramapuram, Chennai',
        requestLatitude: 13.0315,
        requestLongitude: 80.1818,
        searchRadiusKm: 50,
        requiredDate: futureDate.toISOString().split('T')[0],
        requiredTime: '14:30',
        contactPhone: '+91 98401 23456',
        additionalInformation: 'Urgent surgery required'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.request.status).toBe('Searching');
    testRequestId = res.body.request._id;
  });

  test('Suriya sends invitations to Ranjith and Vignesh', async () => {
    const vignesh = await User.findOne({ email: 'vignesh@example.com' });

    const res = await request(app)
      .post(`/api/requests/${testRequestId}/invitations`)
      .set('Authorization', `Bearer ${suriyaToken}`)
      .send({
        donorIds: [ranjithUser.id, vignesh._id]
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.sentCount).toBe(2);

    // Verify invitation records
    const invitations = await Invitation.find({ requestId: testRequestId });
    expect(invitations.length).toBe(2);

    const ranjithInv = invitations.find((i) => i.donorId.toString() === ranjithUser.id.toString());
    expect(ranjithInv).toBeDefined();
    ranjithInvitationId = ranjithInv._id;
  });

  test('Ranjith accepts the blood request: Atomic match, closes others, and starts 6-month cooldown', async () => {
    const res = await request(app)
      .post(`/api/invitations/${ranjithInvitationId}/accept`)
      .set('Authorization', `Bearer ${ranjithToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // 1. Request status must be Matched
    const reqDoc = await BloodRequest.findById(testRequestId);
    expect(reqDoc.status).toBe('Matched');
    expect(reqDoc.acceptedDonorId.toString()).toBe(ranjithUser.id.toString());

    // 2. Ranjith invitation is Accepted
    const ranjithInv = await Invitation.findById(ranjithInvitationId);
    expect(ranjithInv.status).toBe('Accepted');

    // 3. Other pending invitations for this request must be Closed
    const otherInvs = await Invitation.find({
      requestId: testRequestId,
      _id: { $ne: ranjithInvitationId }
    });
    otherInvs.forEach((inv) => {
      expect(inv.status).toBe('Closed');
    });

    // 4. Ranjith status is Donation Cooldown, availability is false, cooldown date set
    const updatedRanjith = await User.findById(ranjithUser.id);
    expect(updatedRanjith.donorStatus).toBe('Donation Cooldown');
    expect(updatedRanjith.isAvailable).toBe(false);
    expect(updatedRanjith.nextEligibleDate).toBeDefined();

    // 5. Suriya can now view Ranjith registered phone number on request details
    const suriyaViewReq = await request(app)
      .get(`/api/requests/${testRequestId}`)
      .set('Authorization', `Bearer ${suriyaToken}`);

    expect(suriyaViewReq.statusCode).toBe(200);
    expect(suriyaViewReq.body.request.acceptedDonorId.phone).toBe('+91 98402 34567');
  });

  test('Prevents another donor from accepting an already matched request (Concurrency guard)', async () => {
    const vignesh = await User.findOne({ email: 'vignesh@example.com' });
    const vigneshLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'vignesh@example.com', password: 'Password@123' });

    const vigneshInv = await Invitation.findOne({ requestId: testRequestId, donorId: vignesh._id });

    const raceRes = await request(app)
      .post(`/api/invitations/${vigneshInv._id}/accept`)
      .set('Authorization', `Bearer ${vigneshLogin.body.token}`);

    expect(raceRes.statusCode).toBe(400); // Already closed
  });

  test('Ranjith cannot bypass the 6-month cooldown by toggling availability', async () => {
    const res = await request(app)
      .put('/api/donors/availability')
      .set('Authorization', `Bearer ${ranjithToken}`)
      .send({ status: 'Active' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('cooldown period');
  });

  test('Mistaken Acceptance Workflow: Ranjith reports, Suriya approves, cooldown reversed', async () => {
    // 1. Ranjith reports mistaken acceptance
    const reportRes = await request(app)
      .post(`/api/invitations/${ranjithInvitationId}/request-cancellation`)
      .set('Authorization', `Bearer ${ranjithToken}`)
      .send({ reason: 'Clicked accept by mistake while traveling' });

    expect(reportRes.statusCode).toBe(200);
    expect(reportRes.body.invitation.status).toBe('Cancellation Requested');

    // 2. Suriya approves cancellation
    const approveRes = await request(app)
      .post(`/api/invitations/${ranjithInvitationId}/approve-cancellation`)
      .set('Authorization', `Bearer ${suriyaToken}`);

    expect(approveRes.statusCode).toBe(200);
    expect(approveRes.body.success).toBe(true);

    // 3. Ranjith cooldown is cleared and status is restored to Active
    const restoredRanjith = await User.findById(ranjithUser.id);
    expect(restoredRanjith.donorStatus).toBe('Active');
    expect(restoredRanjith.isAvailable).toBe(true);
    expect(restoredRanjith.nextEligibleDate).toBeNull();

    // 4. Donation history marked reversed
    const donation = await DonationHistory.findOne({ invitationId: ranjithInvitationId });
    expect(donation.status).toBe('Reversed - Mistaken Acceptance');

    // 5. Request is reopened
    const reopenedReq = await BloodRequest.findById(testRequestId);
    expect(reopenedReq.status).toBe('Searching');
    expect(reopenedReq.acceptedDonorId).toBeNull();
  });
});
