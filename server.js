const express = require('express');
const mongoose = require('mongoose');
const { Resend } = require('resend');
require('dotenv').config();

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Submission Schema
const submissionSchema = new mongoose.Schema({
  accreditationId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  studentId: String,
  department: String,
  level: String,
  phoneNumber: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  votingConfirmed: {
    type: Boolean,
    default: false
  },
  emailId: String,
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const Submission = mongoose.model('Submission', submissionSchema);

// Election Configuration
const electionConfig = {
  name: "University of Ibadan Student Union Election 2025",
  date: "2025-12-01",
  time: "8:00 AM - 5:00 PM",
  venue: "Student Union Building",
  reminderDaysBefore: 2
};

// Generate unique accreditation ID
function generateAccreditationId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `UI-SUG-${timestamp}-${random}`.toUpperCase();
}

// ==================== PROFESSIONAL EMAIL TEMPLATES ====================

// 1. Confirmation Email (Blue) - Sent after form submission
function confirmationEmailTemplate(submission) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6; 
          color: #333333;
          margin: 0;
          padding: 0;
          background-color: #f8f9fa;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
          color: white; 
          padding: 40px 20px; 
          text-align: center;
          border-bottom: 4px solid #f59e0b;
        }
        .header h1 { 
          margin: 0; 
          font-size: 28px; 
          font-weight: 600; 
          font-family: Tahoma, Geneva, Verdana, sans-serif;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
          font-size: 16px;
        }
        .content { 
          padding: 40px 30px; 
        }
        .accreditation-box { 
          background: linear-gradient(135deg, #3b82f615 0%, #1e40af15 100%);
          padding: 25px; 
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
          margin: 25px 0;
          text-align: center;
        }
        .accreditation-id {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
          letter-spacing: 1px;
          margin: 10px 0;
          font-family: Tahoma, Geneva, Verdana, sans-serif;
        }
        .info-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 25px 0;
          background-color: #f8f9fa;
          border-radius: 8px;
          overflow: hidden;
          font-size: 14px;
        }
        .info-table td { 
          padding: 12px 20px; 
          border-bottom: 1px solid #e5e7eb; 
        }
        .info-table tr:last-child td { border-bottom: none; }
        .info-table td:first-child { 
          font-weight: 600; 
          width: 40%; 
          color: #4b5563; 
        }
        .next-steps {
          background-color: #f0f9ff;
          padding: 25px;
          border-radius: 8px;
          margin: 25px 0;
          border-left: 4px solid #0ea5e9;
        }
        .next-steps h3 { 
          margin-top: 0; 
          color: #0369a1; 
          font-size: 18px;
          font-family: Tahoma, Geneva, Verdana, sans-serif;
        }
        .next-steps ul { 
          margin: 15px 0; 
          padding-left: 20px; 
        }
        .next-steps li { 
          margin: 8px 0; 
          color: #475569; 
        }
        .important-note {
          background-color: #fffbeb;
          border: 1px solid #f59e0b;
          padding: 20px;
          margin: 25px 0;
          border-radius: 8px;
        }
        .footer { 
          text-align: center; 
          padding: 30px 20px; 
          color: #6b7280; 
          font-size: 13px;
          background-color: #f8f9fa;
          border-top: 1px solid #e5e7eb;
        }
        .university-logo {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ ACCREDITATION CONFIRMED</h1>
          <p>University of Ibadan Student Union Election</p>
        </div>
        
        <div class="content">
          <h2 style="color: #1e40af; font-family: Tahoma, Geneva, Verdana, sans-serif;">Dear ${submission.name},</h2>
          <p>Thank you for registering for the University of Ibadan Student Union Election. Your accreditation request has been received and is currently under review.</p>
          
          <div class="accreditation-box">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">YOUR ACCREDITATION ID</div>
            <div class="accreditation-id">${submission.accreditationId}</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 12px;">Keep this ID safe - you'll need it on election day</div>
          </div>

          <h3 style="color: #1e40af; font-size: 18px; font-family: Tahoma, Geneva, Verdana, sans-serif;">Registration Details</h3>
          <table class="info-table">
            <tr>
              <td>Full Name</td>
              <td>${submission.name}</td>
            </tr>
            <tr>
              <td>Matric Number</td>
              <td>${submission.studentId || 'Not provided'}</td>
            </tr>
            <tr>
              <td>Department</td>
              <td>${submission.department || 'Not provided'}</td>
            </tr>
            <tr>
              <td>Level</td>
              <td>${submission.level || 'Not provided'}</td>
            </tr>
            <tr>
              <td>Email Address</td>
              <td>${submission.email}</td>
            </tr>
            <tr>
              <td>Phone Number</td>
              <td>${submission.phoneNumber || 'Not provided'}</td>
            </tr>
            <tr>
              <td>Registration Date</td>
              <td>${new Date(submission.submittedAt).toLocaleString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</td>
            </tr>
          </table>

          <div class="next-steps">
            <h3>Next Steps in the Process</h3>
            <ul>
              <li><strong>Verification:</strong> Your details will be verified within 24-48 hours</li>
              <li><strong>Approval Notification:</strong> You'll receive an email once your accreditation is approved</li>
              <li><strong>Election Reminder:</strong> We'll send a reminder 2 days before the election</li>
              <li><strong>Voting Day:</strong> Bring your Accreditation ID and valid UI Student ID card</li>
            </ul>
          </div>

          <div class="important-note">
            <strong style="color: #d97706;">Important Notice:</strong> 
            <p style="margin: 8px 0 0 0; color: #92400e;">
              If you did not register for this election or believe this email was sent in error, 
              please contact the Electoral Commission immediately by replying to this email.
            </p>
          </div>

          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>UI Student Union Electoral Commission</strong><br>
            University of Ibadan
          </p>
        </div>
        
        <div class="footer">
          <div class="university-logo">UNIVERSITY OF IBADAN</div>
          <p><strong>Student Union Electoral Commission</strong></p>
          <p>Ibadan, Oyo State, Nigeria</p>
          <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
            &copy; ${new Date().getFullYear()} University of Ibadan Student Union. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 2. Reminder Email (Orange) - Sent before election
function reminderEmailTemplate(submission) {
  const daysUntil = Math.ceil((new Date(electionConfig.date) - new Date()) / (1000 * 60 * 60 * 24));
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6; 
          color: #333333;
          margin: 0;
          padding: 0;
          background-color: #f8f9fa;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
          color: white; 
          padding: 40px 20px; 
          text-align: center;
          border-bottom: 4px solid #1e40af;
        }
        .header h1 { 
          margin: 0; 
          font-size: 28px; 
          font-weight: 600;
          font-family: Tahoma, Geneva, Verdana, sans-serif;
        }
        .content { 
          padding: 40px 30px; 
        }
        .countdown-box {
          background: linear-gradient(135deg, #ea580c15 0%, #c2410c15 100%);
          padding: 30px;
          border-radius: 8px;
          text-align: center;
          margin: 25px 0;
          border-left: 4px solid #ea580c;
        }
        .countdown-number {
          font-size: 48px;
          font-weight: bold;
          color: #c2410c;
          line-height: 1;
          font-family: Tahoma, Geneva, Verdana, sans-serif;
        }
        .countdown-text {
          font-size: 16px;
          color: #6b7280;
          margin-top: 8px;
          font-weight: 600;
        }
        .checklist {
          background-color: #fffbeb;
          padding: 25px;
          border-radius: 8px;
          margin: 25px 0;
          border: 1px solid #f59e0b;
        }
        .checklist h3 { 
          margin-top: 0; 
          color: #d97706; 
          font-family: Tahoma, Geneva, Verdana, sans-serif;
        }
        .checklist-item {
          padding: 10px 0;
          border-bottom: 1px solid #fde68a;
        }
        .checklist-item:last-child { border-bottom: none; }
        .accreditation-highlight {
          background-color: #1e40af;
          color: white;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
          text-align: center;
        }
        .footer { 
          text-align: center; 
          padding: 30px 20px; 
          color: #6b7280; 
          font-size: 13px;
          background-color: #f8f9fa;
          border-top: 1px solid #e5e7eb;
        }
        .university-logo {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ ELECTION DAY REMINDER</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">University of Ibadan Student Union Election</p>
        </div>
        
        <div class="content">
          <h2 style="color: #c2410c; font-family: Tahoma, Geneva, Verdana, sans-serif;">Dear ${submission.name},</h2>
          
          <div class="countdown-box">
            <div class="countdown-number">${daysUntil}</div>
            <div class="countdown-text">${daysUntil === 1 ? 'DAY' : 'DAYS'} UNTIL ELECTION</div>
          </div>
          
          <p>This is a reminder that the University of Ibadan Student Union Election is approaching. Your participation is crucial in shaping the future leadership of our student union.</p>
          
          <div class="accreditation-highlight">
            <h3 style="margin: 0 0 10px 0; color: white;">YOUR ACCREDITATION ID</h3>
            <div style="font-size: 22px; font-weight: bold; letter-spacing: 1px;">${submission.accreditationId}</div>
          </div>

          <div class="checklist">
            <h3>Election Day Requirements</h3>
            <div class="checklist-item">
              <strong>📅 Election Date:</strong> ${new Date(electionConfig.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div class="checklist-item">
              <strong>🕐 Voting Hours:</strong> ${electionConfig.time}
            </div>
            <div class="checklist-item">
              <strong>📍 Polling Venue:</strong> ${electionConfig.venue}
            </div>
            <div class="checklist-item">
              <strong>📋 Required Documents:</strong> Accreditation ID + Valid UI Student ID Card
            </div>
          </div>

          <h3 style="color: #c2410c; font-family: Tahoma, Geneva, Verdana, sans-serif;">Voting Procedure</h3>
          <ul style="color: #475569;">
            <li>Proceed to your assigned polling station</li>
            <li>Present your Accreditation ID and Student ID for verification</li>
            <li>Receive your ballot paper after successful verification</li>
            <li>Cast your vote in the provided voting booth</li>
            <li>Deposit your ballot in the designated ballot box</li>
          </ul>

          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0ea5e9;">
            <strong style="color: #0369a1;">Important Notice:</strong>
            <p style="margin: 8px 0 0 0; color: #475569;">
              To ensure smooth voting process, we recommend arriving at the polling station during off-peak hours 
              (10:00 AM - 12:00 PM or 2:00 PM - 4:00 PM) to avoid long queues.
            </p>
          </div>

          <p>Your vote is your voice. Exercise your democratic right responsibly.</p>
        </div>
        
        <div class="footer">
          <div class="university-logo">UNIVERSITY OF IBADAN</div>
          <p><strong>Student Union Electoral Commission</strong></p>
          <p>Ibadan, Oyo State, Nigeria</p>
          <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
            &copy; ${new Date().getFullYear()} University of Ibadan Student Union. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 3. Voting Confirmation Email (Green) - Sent after voting
function votingConfirmationTemplate(submission, votingData = {}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6; 
          color: #333333;
          margin: 0;
          padding: 0;
          background-color: #f8f9fa;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: white; 
          padding: 40px 20px; 
          text-align: center;
          border-bottom: 4px solid #f59e0b;
        }
        .header h1 { 
          margin: 0; 
          font-size: 28px; 
          font-weight: 600;
          font-family: Tahoma, Geneva, Verdana, sans-serif;
        }
        .content { 
          padding: 40px 30px; 
        }
        .success-icon {
          text-align: center;
          font-size: 64px;
          margin: 20px 0;
          color: #059669;
        }
        .confirmation-box {
          background: linear-gradient(135deg, #05966915 0%, #04785715 100%);
          padding: 25px;
          border-radius: 8px;
          text-align: center;
          margin: 25px 0;
          border-left: 4px solid #059669;
        }
        .verification-code {
          font-size: 20px;
          font-weight: bold;
          color: #047857;
          letter-spacing: 1px;
          margin: 10px 0;
          font-family: Tahoma, Geneva, Verdana, sans-serif;
        }
        .voting-details {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .footer { 
          text-align: center; 
          padding: 30px 20px; 
          color: #6b7280; 
          font-size: 13px;
          background-color: #f8f9fa;
          border-top: 1px solid #e5e7eb;
        }
        .university-logo {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ VOTE SUCCESSFULLY CAST</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">University of Ibadan Student Union Election</p>
        </div>
        
        <div class="content">
          <div class="success-icon">✓</div>
          
          <h2 style="text-align: center; color: #047857; font-family: Tahoma, Geneva, Verdana, sans-serif;">Thank You for Voting!</h2>
          
          <p>Dear ${submission.name},</p>
          
          <p>Your vote in the University of Ibadan Student Union Election has been successfully recorded. We appreciate you taking the time to participate in this important democratic process.</p>
          
          <div class="confirmation-box">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">TRANSACTION REFERENCE</div>
            <div class="verification-code">${votingData.verificationCode || 'VOTE-' + Date.now().toString(36).toUpperCase().substring(0, 8)}</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 12px;">Keep this reference for your records</div>
          </div>

          <div class="voting-details">
            <h3 style="margin-top: 0; color: #047857; font-family: Tahoma, Geneva, Verdana, sans-serif;">Voting Details</h3>
            <p style="margin: 8px 0;"><strong>Voter Name:</strong> ${submission.name}</p>
            <p style="margin: 8px 0;"><strong>Accreditation ID:</strong> ${submission.accreditationId}</p>
            <p style="margin: 8px 0;"><strong>Voting Time:</strong> ${new Date().toLocaleString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p style="margin: 8px 0;"><strong>Polling Location:</strong> ${votingData.pollingStation || electionConfig.venue}</p>
          </div>

          <h3 style="color: #047857; font-family: Tahoma, Geneva, Verdana, sans-serif;">Next Steps</h3>
          <ul style="color: #475569;">
            <li>Election results will be announced after the voting period ends</li>
            <li>Official results will be published on university notice boards and official channels</li>
            <li>All election-related announcements will be communicated via official email</li>
          </ul>

          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center; border: 1px solid #a7f3d0;">
            <strong style="color: #047857;">Your participation strengthens our student union democracy!</strong>
          </div>
        </div>
        
        <div class="footer">
          <div class="university-logo">UNIVERSITY OF IBADAN</div>
          <p><strong>Student Union Electoral Commission</strong></p>
          <p>Ibadan, Oyo State, Nigeria</p>
          <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
            &copy; ${new Date().getFullYear()} University of Ibadan Student Union. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 4. Approval Email (Green)
function approvalEmailTemplate(submission) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6; 
          color: #333333;
          margin: 0;
          padding: 0;
          background-color: #f8f9fa;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: white; 
          padding: 40px 20px; 
          text-align: center;
          border-bottom: 4px solid #f59e0b;
        }
        .header h1 { 
          margin: 0; 
          font-size: 28px; 
          font-weight: 600;
          font-family: Tahoma, Geneva, Verdana, sans-serif;
        }
        .content { 
          padding: 40px 30px; 
        }
        .success-badge { 
          text-align: center; 
          font-size: 48px; 
          margin: 20px 0; 
          color: #059669;
        }
        .accreditation-id {
          background: linear-gradient(135deg, #05966915 0%, #04785715 100%);
          padding: 25px;
          border-radius: 8px;
          text-align: center;
          margin: 25px 0;
          border-left: 4px solid #059669;
        }
        .instructions {
          background-color: #f0f9ff;
          padding: 25px;
          border-radius: 8px;
          margin: 25px 0;
          border-left: 4px solid #0ea5e9;
        }
        .footer { 
          text-align: center; 
          padding: 30px 20px; 
          color: #6b7280; 
          font-size: 13px;
          background-color: #f8f9fa;
          border-top: 1px solid #e5e7eb;
        }
        .university-logo {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ ACCREDITATION APPROVED</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">University of Ibadan Student Union Election</p>
        </div>
        
        <div class="content">
          <div class="success-badge">🎉</div>
          
          <h2 style="text-align: center; color: #047857; font-family: Tahoma, Geneva, Verdana, sans-serif;">Eligibility Confirmed</h2>
          
          <p>Dear ${submission.name},</p>
          <p>We are pleased to inform you that your accreditation for the University of Ibadan Student Union Election has been <strong>approved</strong>. You are now officially eligible to vote in the upcoming election.</p>
          
          <div class="accreditation-id">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">YOUR ACCREDITATION ID</div>
            <div style="font-size: 22px; font-weight: bold; color: #047857; letter-spacing: 1px;">${submission.accreditationId}</div>
          </div>

          <div class="instructions">
            <h3 style="color: #0369a1; font-family: Tahoma, Geneva, Verdana, sans-serif;">Election Day Requirements</h3>
            <ul style="color: #475569;">
              <li><strong>Digital or Printed Copy:</strong> This approval email (on your phone or printed)</li>
              <li><strong>Student Identification:</strong> Valid UI Student ID Card</li>
              <li><strong>Accreditation ID:</strong> <strong>${submission.accreditationId}</strong></li>
            </ul>
            
            <h3 style="color: #0369a1; font-family: Tahoma, Geneva, Verdana, sans-serif;">Election Information</h3>
            <ul style="color: #475569;">
              <li><strong>Date:</strong> ${new Date(electionConfig.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
              <li><strong>Time:</strong> ${electionConfig.time}</li>
              <li><strong>Venue:</strong> ${electionConfig.venue}</li>
            </ul>
          </div>

          <p style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 25px 0;">
            <strong>Note:</strong> You will receive a reminder email 2 days before the election. Please ensure you bring all required documents to avoid any delays.
          </p>
          
          <p>
            Best regards,<br>
            <strong>UI Student Union Electoral Commission</strong><br>
            University of Ibadan
          </p>
        </div>
        
        <div class="footer">
          <div class="university-logo">UNIVERSITY OF IBADAN</div>
          <p><strong>Student Union Electoral Commission</strong></p>
          <p>Ibadan, Oyo State, Nigeria</p>
          <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
            &copy; ${new Date().getFullYear()} University of Ibadan Student Union. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 5. Rejection Email (Red)
function rejectionEmailTemplate(submission) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6; 
          color: #333333;
          margin: 0;
          padding: 0;
          background-color: #f8f9fa;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white; 
          padding: 40px 20px; 
          text-align: center;
          border-bottom: 4px solid #f59e0b;
        }
        .header h1 { 
          margin: 0; 
          font-size: 28px; 
          font-weight: 600;
          font-family: Tahoma, Geneva, Verdana, sans-serif;
        }
        .content { 
          padding: 40px 30px; 
        }
        .notice-box {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          padding: 25px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .contact-info {
          background-color: #f0f9ff;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
          border-left: 4px solid #0ea5e9;
        }
        .footer { 
          text-align: center; 
          padding: 30px 20px; 
          color: #6b7280; 
          font-size: 13px;
          background-color: #f8f9fa;
          border-top: 1px solid #e5e7eb;
        }
        .university-logo {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ACCORDITATION STATUS UPDATE</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">University of Ibadan Student Union Election</p>
        </div>
        
        <div class="content">
          <p>Dear ${submission.name},</p>
          
          <div class="notice-box">
            <h3 style="margin-top: 0; color: #dc2626; font-family: Tahoma, Geneva, Verdana, sans-serif;">Accreditation Not Approved</h3>
            <p style="color: #7f1d1d;">
              After careful review of your accreditation application, we regret to inform you that we are unable to approve your registration for the University of Ibadan Student Union Election at this time.
            </p>
          </div>

          <p>This decision may be due to one of the following reasons:</p>
          <ul style="color: #475569;">
            <li>Incomplete or inaccurate registration information</li>
            <li>Verification issues with student records</li>
            <li>Eligibility criteria not met</li>
            <li>Duplicate registration detected</li>
          </ul>

          <div class="contact-info">
            <h3 style="margin-top: 0; color: #0369a1; font-family: Tahoma, Geneva, Verdana, sans-serif;">Appeal Process</h3>
            <p style="margin: 8px 0;">
              If you believe this decision was made in error, you may appeal by:
            </p>
            <ul style="color: #475569;">
              <li>Visiting the Electoral Commission office in person</li>
              <li>Bringing your original student ID and any relevant documents</li>
              <li>Appealing within 48 hours of receiving this notification</li>
            </ul>
            <p style="margin: 15px 0 0 0;">
              <strong>Reference ID:</strong> ${submission.accreditationId}
            </p>
          </div>

          <p>
            For further clarification or to inquire about the specific reason for this decision, 
            please contact the Electoral Commission office during working hours.
          </p>

          <p>
            Sincerely,<br>
            <strong>UI Student Union Electoral Commission</strong><br>
            University of Ibadan
          </p>
        </div>
        
        <div class="footer">
          <div class="university-logo">UNIVERSITY OF IBADAN</div>
          <p><strong>Student Union Electoral Commission</strong></p>
          <p>Ibadan, Oyo State, Nigeria</p>
          <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
            &copy; ${new Date().getFullYear()} University of Ibadan Student Union. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ==================== EMAIL SENDING FUNCTIONS ====================

async function sendConfirmationEmail(submission) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'UI Electoral Commission <noreply@iykevisualsdev.me>',
      to: [submission.email],
      subject: 'UI Student Union Election - Accreditation Confirmed',
      html: confirmationEmailTemplate(submission)
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, id: data.id };

  } catch (error) {
    console.error('Resend API error:', error);
    return { success: false, error: error.message };
  }
}

async function sendReminderEmail(submission) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'UI Electoral Commission <noreply@iykevisualsdev.me>',
      to: [submission.email],
      subject: '⏰ Reminder: UI Student Union Election Tomorrow!',
      html: reminderEmailTemplate(submission)
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, id: data.id };

  } catch (error) {
    console.error('Resend API error:', error);
    return { success: false, error: error.message };
  }
}

async function sendVotingConfirmation(submission, votingData) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'UI Electoral Commission <noreply@iykevisualsdev.me>',
      to: [submission.email],
      subject: '✅ Vote Confirmed - UI Student Union Election',
      html: votingConfirmationTemplate(submission, votingData)
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, id: data.id };

  } catch (error) {
    console.error('Resend API error:', error);
    return { success: false, error: error.message };
  }
}

async function sendApprovalEmail(submission) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'UI Electoral Commission <noreply@iykevisualsdev.me>',
      to: [submission.email],
      subject: '✅ Accreditation Approved - UI Student Union Election',
      html: approvalEmailTemplate(submission)
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, id: data.id };

  } catch (error) {
    console.error('Resend API error:', error);
    return { success: false, error: error.message };
  }
}

async function sendRejectionEmail(submission) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'UI Electoral Commission <noreply@iykevisualsdev.me>',
      to: [submission.email],
      subject: 'Accreditation Update - UI Student Union Election',
      html: rejectionEmailTemplate(submission)
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, id: data.id };

  } catch (error) {
    console.error('Resend API error:', error);
    return { success: false, error: error.message };
  }
}

// ==================== API ENDPOINTS ====================

// Webhook endpoint - receives form submissions from Google Apps Script
app.post('/form-submission', async (req, res) => {
  try {
    console.log('Received form submission:', req.body);

    const { name, email, studentId, department, level, phoneNumber } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Name and email are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid email format' 
      });
    }

    // Generate accreditation ID
    const accreditationId = generateAccreditationId();

    // Create submission document
    const submission = new Submission({
      accreditationId,
      name,
      email,
      studentId: studentId || 'Not provided',
      department: department || 'Not provided',
      level: level || 'Not provided',
      phoneNumber: phoneNumber || 'Not provided',
      status: 'pending'
    });

    // Save to MongoDB
    await submission.save();
    console.log('Submission saved to database:', accreditationId);

    // Send confirmation email
    const emailResult = await sendConfirmationEmail(submission);

    if (emailResult.success) {
      submission.emailSent = true;
      submission.emailId = emailResult.id;
      await submission.save();

      console.log('Email sent successfully:', emailResult.id);
      res.json({ 
        status: 'success', 
        message: 'Accreditation registered and confirmation email sent',
        accreditationId 
      });
    } else {
      console.error('Email sending failed:', emailResult.error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Registration saved but email failed to send',
        accreditationId 
      });
    }

  } catch (error) {
    console.error('Error processing form submission:', error);
    
    if (error.code === 11000) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Duplicate submission detected. Please try again.' 
      });
    }
    
    res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error' 
    });
  }
});

// Send reminder emails to approved voters
app.post('/send-reminders', async (req, res) => {
  try {
    // Find all approved submissions who haven't received reminder
    const submissions = await Submission.find({
      status: 'approved',
      reminderSent: false
    });

    console.log(`Sending reminders to ${submissions.length} approved voters...`);

    let successCount = 0;
    let failCount = 0;

    for (const submission of submissions) {
      const result = await sendReminderEmail(submission);
      
      if (result.success) {
        submission.reminderSent = true;
        await submission.save();
        successCount++;
      } else {
        failCount++;
        console.error(`Failed to send reminder to ${submission.email}`);
      }
    }

    res.json({
      status: 'success',
      message: `Reminders sent: ${successCount} successful, ${failCount} failed`,
      total: submissions.length,
      successful: successCount,
      failed: failCount
    });

  } catch (error) {
    console.error('Error sending reminders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to send reminders' });
  }
});

// Record voting confirmation (called by external voting system)
app.post('/voting-confirmation', async (req, res) => {
  try {
    const { accreditationId, verificationCode, pollingStation } = req.body;

    if (!accreditationId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Accreditation ID is required' 
      });
    }

    const submission = await Submission.findOne({ 
      accreditationId: accreditationId.toUpperCase() 
    });

    if (!submission) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Accreditation ID not found' 
      });
    }

    // Send voting confirmation email
    const votingData = { verificationCode, pollingStation };
    const emailResult = await sendVotingConfirmation(submission, votingData);

    if (emailResult.success) {
      submission.votingConfirmed = true;
      await submission.save();

      res.json({ 
        status: 'success', 
        message: 'Voting confirmation email sent' 
      });
    } else {
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to send voting confirmation email' 
      });
    }

  } catch (error) {
    console.error('Error sending voting confirmation:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'UI Election Accreditation System Running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    electionDate: electionConfig.date,
    timestamp: new Date().toISOString()
  });
});

// Get all submissions with pagination
app.get('/submissions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = status ? { status } : {};
    const total = await Submission.countDocuments(filter);
    const submissions = await Submission.find(filter)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ 
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      submissions 
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch submissions' });
  }
});

// Get single submission by accreditation ID
app.get('/submission/:id', async (req, res) => {
  try {
    const submission = await Submission.findOne({ 
      accreditationId: req.params.id.toUpperCase() 
    });
    
    if (!submission) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Accreditation ID not found' 
      });
    }
    
    res.json({ status: 'success', submission });
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch submission' });
  }
});

// Update submission status and send appropriate email
app.patch('/submission/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid status. Must be: pending, approved, or rejected' 
      });
    }
    
    const submission = await Submission.findOneAndUpdate(
      { accreditationId: req.params.id.toUpperCase() },
      { status },
      { new: true }
    );
    
    if (!submission) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Accreditation ID not found' 
      });
    }
    
    // Send appropriate email based on status
    if (status === 'approved') {
      await sendApprovalEmail(submission);
    } else if (status === 'rejected') {
      await sendRejectionEmail(submission);
    }
    
    res.json({ status: 'success', submission });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update submission' });
  }
});

// Statistics endpoint
app.get('/stats', async (req, res) => {
  try {
    const total = await Submission.countDocuments();
    const pending = await Submission.countDocuments({ status: 'pending' });
    const approved = await Submission.countDocuments({ status: 'approved' });
    const rejected = await Submission.countDocuments({ status: 'rejected' });
    const emailsSent = await Submission.countDocuments({ emailSent: true });
    const remindersSent = await Submission.countDocuments({ reminderSent: true });
    const votingConfirmed = await Submission.countDocuments({ votingConfirmed: true });

    res.json({
      total,
      pending,
      approved,
      rejected,
      emailsSent,
      remindersSent,
      votingConfirmed,
      emailsFailed: total - emailsSent,
      electionDate: electionConfig.date
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch statistics' });
  }
});

// Update election configuration
app.patch('/election-config', async (req, res) => {
  try {
    const { name, date, time, venue, reminderDaysBefore } = req.body;
    
    if (name) electionConfig.name = name;
    if (date) electionConfig.date = date;
    if (time) electionConfig.time = time;
    if (venue) electionConfig.venue = venue;
    if (reminderDaysBefore) electionConfig.reminderDaysBefore = reminderDaysBefore;
    
    res.json({ 
      status: 'success', 
      message: 'Election configuration updated',
      config: electionConfig 
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update configuration' });
  }
});

// Get election configuration
app.get('/election-config', (req, res) => {
  res.json({ status: 'success', config: electionConfig });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    status: 'error', 
    message: 'Internal server error' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    status: 'error', 
    message: 'Endpoint not found' 
  });
});

// Start server
const PORT = process.env.PORT || 3500;
app.listen(PORT, () => {
  console.log(`🎓 UI Election Accreditation System`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 Webhook: http://localhost:${PORT}/form-submission`);
  console.log(`📅 Election Date: ${electionConfig.date}`);
  console.log(`✅ MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
});
