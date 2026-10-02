# LifeLink – Hospital Geofence Attendance System Integration Architecture

## 1. Executive Summary

This document specifies the integration architecture designed to connect **LifeLink (Blood Donor & Blood Request Portal)** into the existing **Hospital Geofence Attendance System**.

In compliance with the project guidelines:
> *The portal must initially operate independently. It should be developed, tested and deployed as a separate application. Design its architecture so that it can later be integrated into an existing Hospital Geofence Attendance System through a new Blood Donation menu in the Doctor Dashboard.*
>
> *Important: Do not build, recreate, modify or replace any existing hospital geofencing, biometric authentication, doctor attendance, CMO, Admin or hospital management features. This project is only for the new Blood Donor Portal.*

---

## 2. Decoupled Architecture Design

```
+-------------------------------------------------------------+
|        EXISTING HOSPITAL GEOFENCE ATTENDANCE SYSTEM         |
|                                                             |
|  [Doctor Attendance] [Biometrics] [Geofencing] [CMO Portal]  |
|                                                             |
|                      Doctor Dashboard                       |
|               +-----------------------------+               |
|               |  NEW: Blood Donation Menu   |               |
+---------------+--------------+--------------+---------------+
                               |
                               | Authenticated REST / Iframe / Microfrontend
                               v
+-------------------------------------------------------------+
|                   LIFELINK STANDALONE PORTAL                |
|                                                             |
|  [Haversine Donor Matching] [RBC Compatibility Engine]      |
|  [Multi-Donor Invitations]  [6-Month Cooldown Manager]      |
|  [Email/In-App Alert Queue] [Donation & Request Auditing]   |
|                                                             |
|                     MongoDB Database                        |
|   (Users, BloodRequests, Invitations, DonationHistories)    |
+-------------------------------------------------------------+
```

### Key Architectural Boundaries
1. **Isolated Datastore**: LifeLink maintains its own dedicated MongoDB database (`lifelink`), completely independent of the hospital's relational/attendance database.
2. **Zero Biometric Impact**: No attendance timestamps, geofence coordinates, biometric records, or shift rules in the hospital application are touched or altered.
3. **Dual Operation Modes**: LifeLink operates both as an independent web application for civilian donors/requesters and as an embedded headless or modal micro-application for doctors on duty.

---

## 3. Integration Mechanism: Doctor Dashboard "Blood Donation" Menu

When the hospital system is ready to enable the Blood Donation feature:

### Option A: Direct REST API Integration (Recommended)
The existing Doctor Dashboard frontend calls LifeLink's secured REST endpoints using a hospital service token or doctor proxy session.

#### 1. Doctor Location Detection
The hospital system passes the Doctor's active Primary Health Centre (PHC) / Hospital coordinates:
```json
{
  "requestAddress": "Government Taluk Hospital, Ramapuram",
  "requestLatitude": 13.0315,
  "requestLongitude": 80.1818,
  "requiredBloodGroup": "O+",
  "unitsRequired": 2,
  "searchRadiusKm": 30
}
```

#### 2. Querying Compatible Donors
Endpoint: `POST https://lifelink-api.hospital.domain/api/requests/search-donors`
- Evaluates red-blood-cell compatibility (e.g. O+ patient receives O+ and O- donors).
- Executes the Haversine formula against registered civilian donors.
- Filters out donors in active 6-month cooldown or already matched requests.
- Returns list of compatible donors sorted by nearest distance in kilometres.

#### 3. Dispatching Urgent Invitations
Endpoint: `POST https://lifelink-api.hospital.domain/api/requests/:id/invitations`
- Sends transactional email and in-app alerts to selected donors.
- Creates audit log entries with the Doctor's hospital ID snapshot.

#### 4. Receiving Acceptance & Revealing Contact
Endpoint: `GET https://lifelink-api.hospital.domain/api/requests/:id`
- Once a donor clicks "Accept", the request moves atomically to `Matched`.
- The doctor dashboard receives a real-time event / status update.
- The accepted donor's registered mobile number is revealed to the doctor to coordinate arrival at the hospital blood bank.

---

## 4. API Endpoints Reference for Doctor Dashboard

| HTTP Method | Route | Description | Doctor Dashboard Action |
|-------------|-------|-------------|-------------------------|
| `POST` | `/api/requests/search-donors` | Searches compatible donors within custom radius (km) | Doctor inputs patient blood group & search radius |
| `POST` | `/api/requests` | Creates a new emergency blood request | Submits surgery/trauma blood requirement |
| `POST` | `/api/requests/:id/invitations` | Dispatches invitations to selected donors | Doctor selects 1 or more donors to invite |
| `GET` | `/api/requests/:id` | Fetches request status & accepted donor details | Displays accepted donor's mobile number and name |
| `POST` | `/api/requests/:id/cancel` | Cancels blood request | Closes request if blood obtained from internal blood bank |

---

## 5. Security & Isolation Guarantee

1. **Patient & Donor Confidentiality**:
   - Civilian donors' private phone numbers and exact street addresses are **never** exposed in search results.
   - Contact numbers are only made accessible after an explicit, authenticated donor acceptance.
2. **Atomic Single-Acceptance Protocol**:
   - Even if multiple emergency hospital requests are dispatched across the district, MongoDB atomic conditional operations guarantee that only one donor is committed per unit request, preventing double-booking and instantly closing other open invitations.
3. **Medical Safety Notice**:
   - All integration points display clinical disclaimers reminding hospital staff that LifeLink matching is based on patient-reported blood groups and RBC tables; physical cross-matching and laboratory screening remain mandatory before blood transfusion.
