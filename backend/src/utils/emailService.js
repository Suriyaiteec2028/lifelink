/**
 * LifeLink / BloodDonor - Responsive Email Notification Service
 * Supports 10 core email notifications + OTP delivery with professional HTML templates.
 * Operates gracefully with Gmail SMTP, custom SMTP, or in-memory fallback.
 */

const nodemailer = require('nodemailer');

let transporter = null;
const sentEmailsLog = []; // In-memory audit log for inspection & testing

const getAppName = () => process.env.APP_NAME || 'BloodDonor';

const getTransporter = async () => {
  if (transporter) return transporter;

  const cleanPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

  if (
    process.env.SMTP_SERVICE === 'gmail' ||
    (process.env.SMTP_USER && process.env.SMTP_USER.endsWith('@gmail.com')) ||
    (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail'))
  ) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: cleanPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    console.log(`[EmailService] Configured with Gmail SMTP (${process.env.SMTP_USER})`);
  } else if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: cleanPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    console.log('[EmailService] Configured with custom SMTP:', process.env.SMTP_HOST);
  } else {
    // Development / test fallback transporter
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'windows',
      buffer: true
    });
    console.log('[EmailService] Running in Development Stream mode (emails logged to memory/console)');
  }

  return transporter;
};

/**
 * Base email layout wrapper with app branding
 */
const renderBaseLayout = ({ title, preheader, content, actionUrl, actionText }) => {
  const appName = getAppName();
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
    .container { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
    .logo { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
    .logo-sub { font-size: 13px; opacity: 0.9; margin-top: 4px; font-weight: 400; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .headline { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    .button-container { text-align: center; margin: 30px 0; }
    .btn { display: inline-block; background-color: #dc2626; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: 700; font-size: 14px; background: #fee2e2; color: #991b1b; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .footer { background: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .disclaimer { font-size: 11px; color: #94a3b8; margin-top: 12px; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader || title}
  </div>
  <div class="container">
    <div class="header">
      <div class="logo">🩸 ${appName}</div>
      <div class="logo-sub">Location-Based Blood Donor & Blood Request Portal</div>
    </div>
    <div class="content">
      <div class="headline">${title}</div>
      ${content}
      ${
        actionUrl && actionText
          ? `<div class="button-container">
               <a href="${actionUrl}" class="btn" target="_blank">${actionText}</a>
             </div>`
          : ''
      }
    </div>
    <div class="footer">
      <div>${appName} Blood Donation Network &bull; Standalone Portal</div>
      <div class="disclaimer">
        Important Medical Notice: ${appName} connects blood donors with requests based on reported eligibility and RBC compatibility. Actual donor suitability and transfusion safety must always be evaluated and confirmed by licensed medical professionals and certified blood banks.
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generic email sender
 */
const sendMail = async ({ to, subject, html, text, purpose }) => {
  const appName = getAppName();
  try {
    const mailClient = await getTransporter();
    const fromAddress = process.env.EMAIL_FROM || `"${appName}" <${process.env.SMTP_USER || 'notifications@lifelink.local'}>`;

    const mailOptions = {
      from: fromAddress,
      to,
      subject,
      text: text || subject,
      html
    };

    const info = await mailClient.sendMail(mailOptions);

    // Save to in-memory audit log
    sentEmailsLog.push({
      to,
      subject,
      purpose,
      timestamp: new Date(),
      messageId: info.messageId,
      preview: text || subject
    });

    console.log(`[EmailService] Sent '${subject}' to ${to} (${purpose}) - ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService Error] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 1. Registration OTP Email
 */
const sendRegistrationOTPEmail = async (email, otp, fullName) => {
  const appName = getAppName();
  const title = `Verify Your Email Address - ${appName}`;
  const content = `
    <p>Hello <strong>${fullName}</strong>,</p>
    <p>Thank you for registering with <strong>${appName}</strong> to help save lives. Please use the following One-Time Password (OTP) to complete your account registration:</p>
    <div style="text-align: center; margin: 24px 0;">
      <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 12px 28px; background: #fee2e2; color: #b91c1c; border-radius: 8px; display: inline-block;">${otp}</span>
    </div>
    <p>This OTP is valid for <strong>5 minutes</strong>. For your security, never share this code with anyone.</p>
    <p>If you did not initiate this registration, please disregard this email.</p>
  `;
  const html = renderBaseLayout({ title, content, preheader: `Your ${appName} verification code is ${otp}` });
  return sendMail({ to: email, subject: `Your ${appName} Verification Code: ${otp}`, html, purpose: 'REGISTRATION_OTP' });
};

/**
 * 2. Password Reset OTP Email
 */
const sendPasswordResetOTPEmail = async (email, otp, fullName) => {
  const appName = getAppName();
  const title = `Reset Your ${appName} Password`;
  const content = `
    <p>Hello <strong>${fullName || 'User'}</strong>,</p>
    <p>We received a request to reset the password for your ${appName} account. Use the verification code below to proceed:</p>
    <div style="text-align: center; margin: 24px 0;">
      <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 12px 28px; background: #fee2e2; color: #b91c1c; border-radius: 8px; display: inline-block;">${otp}</span>
    </div>
    <p>This code expires in <strong>5 minutes</strong>. If you did not request a password reset, please secure your account immediately.</p>
  `;
  const html = renderBaseLayout({ title, content, preheader: `Your ${appName} password reset code is ${otp}` });
  return sendMail({ to: email, subject: `Password Reset Request - ${appName}`, html, purpose: 'PASSWORD_RESET_OTP' });
};

/**
 * 3. New Blood Request Invitation Email
 */
const sendBloodRequestInvitationEmail = async ({
  donorEmail,
  donorName,
  requesterName,
  requesterAge,
  requiredBloodGroup,
  unitsRequired,
  requestLocation,
  requiredDate,
  requiredTime,
  additionalInformation,
  invitationUrl
}) => {
  const appName = getAppName();
  const title = `Urgent Blood Donation Request – ${appName}`;
  const content = `
    <p>Dear <strong>${donorName}</strong>,</p>
    <p>An urgent blood donation request has been submitted near your location matching your blood group compatibility.</p>
    <div class="card">
      <div style="margin-bottom: 8px;"><strong>Requester:</strong> ${requesterName} (${requesterAge} yrs)</div>
      <div style="margin-bottom: 8px;"><strong>Required Blood Group:</strong> <span class="badge">${requiredBloodGroup}</span></div>
      <div style="margin-bottom: 8px;"><strong>Units Required:</strong> ${unitsRequired} unit(s)</div>
      <div style="margin-bottom: 8px;"><strong>Location:</strong> ${requestLocation}</div>
      <div style="margin-bottom: 8px;"><strong>Date & Time Required:</strong> ${requiredDate} at ${requiredTime}</div>
      ${additionalInformation ? `<div style="margin-top: 8px; color: #475569;"><strong>Notes:</strong> ${additionalInformation}</div>` : ''}
    </div>
    <p>Please review the request and accept if you are available and medically fit to donate.</p>
    <p style="font-size: 13px; color: #64748b;"><em>Notice: Under ${appName} portal guidelines, accepting a request begins a 6-month donation cooldown period to ensure donor health.</em></p>
  `;
  const html = renderBaseLayout({
    title,
    content,
    preheader: `Urgent ${requiredBloodGroup} blood request near your location`,
    actionUrl: invitationUrl || `${process.env.APP_URL || 'http://localhost:5173'}/invitations`,
    actionText: 'Review and Respond'
  });
  return sendMail({ to: donorEmail, subject: `Blood Donation Request – ${appName}`, html, purpose: 'REQUEST_INVITATION' });
};

/**
 * 4. Donor Accepts Request Email (to Requester)
 */
const sendRequestAcceptedEmail = async ({
  requesterEmail,
  requesterName,
  donorName,
  donorAge,
  donorBloodGroup,
  donorDonationCount,
  donorLocation,
  donorMobile,
  requiredBloodGroup,
  unitsRequired,
  acceptanceDate,
  requestUrl
}) => {
  const appName = getAppName();
  const title = `Your Blood Request Has Been Accepted – ${appName}`;
  const content = `
    <p>Dear <strong>${requesterName}</strong>,</p>
    <p>Good news! An eligible donor has accepted your blood request for <span class="badge">${requiredBloodGroup}</span>.</p>
    <div class="card" style="border-left: 4px solid #16a34a;">
      <h3 style="margin-top: 0; color: #166534;">Accepted Donor Details</h3>
      <div style="margin-bottom: 8px;"><strong>Donor Name:</strong> ${donorName}</div>
      <div style="margin-bottom: 8px;"><strong>Age:</strong> ${donorAge} years</div>
      <div style="margin-bottom: 8px;"><strong>Blood Group:</strong> ${donorBloodGroup}</div>
      <div style="margin-bottom: 8px;"><strong>Total Recorded Donations:</strong> ${donorDonationCount}</div>
      <div style="margin-bottom: 8px;"><strong>Approximate Area:</strong> ${donorLocation}</div>
      <div style="margin-bottom: 8px; font-size: 16px; color: #dc2626;"><strong>Registered Mobile:</strong> <a href="tel:${donorMobile}" style="color:#dc2626; font-weight:700;">${donorMobile}</a></div>
      <div style="margin-bottom: 0;"><strong>Accepted At:</strong> ${acceptanceDate}</div>
    </div>
    <p>Please contact the donor directly to coordinate hospital arrival and donation arrangements.</p>
  `;
  const html = renderBaseLayout({
    title,
    content,
    preheader: `${donorName} has accepted your ${requiredBloodGroup} blood request`,
    actionUrl: requestUrl || `${process.env.APP_URL || 'http://localhost:5173'}/my-requests`,
    actionText: 'View Request Details'
  });
  return sendMail({ to: requesterEmail, subject: `Your Blood Request Has Been Accepted – ${appName}`, html, purpose: 'DONOR_ACCEPTED' });
};

/**
 * 5. Donor Declines Request Email (to Requester)
 */
const sendRequestDeclinedEmail = async ({ requesterEmail, requesterName, requiredBloodGroup }) => {
  const appName = getAppName();
  const title = `Donor Update for Your Blood Request – ${appName}`;
  const content = `
    <p>Dear <strong>${requesterName}</strong>,</p>
    <p>One of the invited donors was unable to accept your request for <span class="badge">${requiredBloodGroup}</span> at this time.</p>
    <p>Other invited donors are still reviewing your request, or you can expand your search radius in the portal.</p>
  `;
  const html = renderBaseLayout({
    title,
    content,
    actionUrl: `${process.env.APP_URL || 'http://localhost:5173'}/my-requests`,
    actionText: 'Check Request Status'
  });
  return sendMail({ to: requesterEmail, subject: `Donor Update – ${appName}`, html, purpose: 'DONOR_DECLINED' });
};

/**
 * 6. Another Donor Accepted / Request Closed Email (to other invited donors)
 */
const sendRequestClosedNotificationEmail = async ({ donorEmail, donorName, requiredBloodGroup, requestLocation }) => {
  const appName = getAppName();
  const title = `Blood Request Fulfilled – ${appName}`;
  const content = `
    <p>Dear <strong>${donorName}</strong>,</p>
    <p>The blood request for <span class="badge">${requiredBloodGroup}</span> blood in <strong>${requestLocation}</strong> has been fulfilled by another donor.</p>
    <p>Thank you for your willingness to help! Your donor availability remains active for future matching requests.</p>
  `;
  const html = renderBaseLayout({ title, content, preheader: 'Blood request fulfilled by another donor' });
  return sendMail({ to: donorEmail, subject: `Blood Request Fulfilled – ${appName}`, html, purpose: 'REQUEST_CLOSED' });
};

/**
 * 7. Donor Requests Cancellation (Mistaken Acceptance Alert to Requester)
 */
const sendMistakenAcceptanceAlertEmail = async ({ requesterEmail, requesterName, donorName, reason, requestUrl }) => {
  const appName = getAppName();
  const title = `Mistaken Acceptance Reported – ${appName}`;
  const content = `
    <p>Dear <strong>${requesterName}</strong>,</p>
    <p>The donor <strong>${donorName}</strong> has reported that they accepted your blood request by mistake and has submitted a cancellation request.</p>
    <div class="card" style="border-left: 4px solid #f59e0b;">
      <div><strong>Reported Reason:</strong></div>
      <div style="font-style: italic; margin-top: 4px; color: #334155;">"${reason || 'No specific reason provided.'}"</div>
    </div>
    <p>Please review and approve or reject this cancellation in your dashboard so your request can be reopened for other donors if needed.</p>
  `;
  const html = renderBaseLayout({
    title,
    content,
    actionUrl: requestUrl || `${process.env.APP_URL || 'http://localhost:5173'}/my-requests`,
    actionText: 'Review Cancellation Request'
  });
  return sendMail({ to: requesterEmail, subject: `Donor Cancellation Request – ${appName}`, html, purpose: 'CANCELLATION_REQUESTED' });
};

/**
 * 8. Cancellation Decision Email (to Donor)
 */
const sendCancellationDecisionEmail = async ({ donorEmail, donorName, decision, requesterName }) => {
  const appName = getAppName();
  const isApproved = decision === 'Approved';
  const title = `Cancellation Request ${decision} – ${appName}`;
  const content = `
    <p>Dear <strong>${donorName}</strong>,</p>
    <p>The requester <strong>${requesterName}</strong> has <strong>${decision.toLowerCase()}</strong> your mistaken acceptance cancellation request.</p>
    ${
      isApproved
        ? `<div class="card" style="border-left: 4px solid #16a34a;">
             <p style="margin: 0; color: #166534;">Your acceptance-based record has been reversed, and your donor cooldown has been cleared. Your donor availability can now be reactivated according to eligibility rules.</p>
           </div>`
        : `<div class="card" style="border-left: 4px solid #dc2626;">
             <p style="margin: 0; color: #991b1b;">Your cancellation request was not approved. The acceptance record remains in effect.</p>
           </div>`
    }
  `;
  const html = renderBaseLayout({
    title,
    content,
    actionUrl: `${process.env.APP_URL || 'http://localhost:5173'}/availability`,
    actionText: 'View Availability'
  });
  return sendMail({ to: donorEmail, subject: `Cancellation Request ${decision} – ${appName}`, html, purpose: 'CANCELLATION_DECISION' });
};

/**
 * 9. Request Cancelled by Requester Email (to Invited Donors)
 */
const sendRequestCancelledByRequesterEmail = async ({ donorEmail, donorName, requiredBloodGroup, cancellationReason }) => {
  const appName = getAppName();
  const title = `Blood Request Cancelled – ${appName}`;
  const content = `
    <p>Dear <strong>${donorName}</strong>,</p>
    <p>The blood request for <span class="badge">${requiredBloodGroup}</span> has been cancelled by the requester.</p>
    ${cancellationReason ? `<p><strong>Reason provided:</strong> ${cancellationReason}</p>` : ''}
    <p>No further action is required from you. Thank you for being a part of ${appName}.</p>
  `;
  const html = renderBaseLayout({ title, content, preheader: 'Blood request was cancelled' });
  return sendMail({ to: donorEmail, subject: `Blood Request Cancelled – ${appName}`, html, purpose: 'REQUEST_CANCELLED' });
};

/**
 * 10. Donation Cooldown Ending Reminder Email (to Donor)
 */
const sendCooldownEndingEmail = async ({ donorEmail, donorName, nextEligibleDate }) => {
  const appName = getAppName();
  const title = `You Are Eligible to Donate Again – ${appName}`;
  const content = `
    <p>Dear <strong>${donorName}</strong>,</p>
    <p>Your 6-month donation cooldown period ends on <strong>${new Date(nextEligibleDate).toLocaleDateString()}</strong>.</p>
    <p>Thank you for your life-saving contributions. You can now log into ${appName} and switch your donor availability back to <strong>Active</strong> whenever you are ready to receive new blood requests.</p>
  `;
  const html = renderBaseLayout({
    title,
    content,
    actionUrl: `${process.env.APP_URL || 'http://localhost:5173'}/availability`,
    actionText: 'Activate Donor Status'
  });
  return sendMail({ to: donorEmail, subject: `Donation Cooldown Complete – ${appName}`, html, purpose: 'COOLDOWN_ENDED' });
};

module.exports = {
  sendMail,
  sentEmailsLog,
  sendRegistrationOTPEmail,
  sendPasswordResetOTPEmail,
  sendBloodRequestInvitationEmail,
  sendRequestAcceptedEmail,
  sendRequestDeclinedEmail,
  sendRequestClosedNotificationEmail,
  sendMistakenAcceptanceAlertEmail,
  sendCancellationDecisionEmail,
  sendRequestCancelledByRequesterEmail,
  sendCooldownEndingEmail
};
