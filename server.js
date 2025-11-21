const express = require('express');
const mongoose = require('mongoose');
const { Resend } = require('resend');
require('dotenv').config();

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - Allow Google Apps Script
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// MongoDB Connection with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    setTimeout(connectDB, 5000); // Retry after 5 seconds
  }
};

connectDB();

// Dev Mode Configuration
const DEV_MODE = process.env.DEV_MODE === 'true';
const DEV_EMAILS = process.env.DEV_EMAILS ? process.env.DEV_EMAILS.split(',').map(email => email.trim().toLowerCase()) : [];

console.log('🔧 Dev Mode Configuration:');
console.log('   DEV_MODE:', DEV_MODE);
console.log('   DEV_EMAILS:', DEV_EMAILS);

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
  studentId: { type: String, required: true },
  faculty: {
    type: String,
    required: true
  },
  department: { type: String, required: true },
  level: { type: String, required: true },
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

// ==================== DEV MODE HELPER FUNCTIONS ====================

/**
 * Check if email should bypass duplicate restrictions (dev mode)
 */
function shouldBypassDuplicate(email, forceEmail) {
  if (forceEmail) return true;
  if (DEV_MODE && DEV_EMAILS.includes(email.toLowerCase())) return true;
  return false;
}

/**
 * Check if email is a dev email
 */
function isDevEmail(email) {
  return DEV_MODE && DEV_EMAILS.includes(email.toLowerCase());
}

// ==================== EMAIL TEMPLATES ====================

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
        .dev-mode-badge {
          background-color: #f59e0b;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin-left: 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ ACCREDITATION CONFIRMED ${submission.devOverride ? '<span class="dev-mode-badge">DEV MODE</span>' : ''}</h1>
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

          ${submission.devOverride ? `
          <div class="important-note">
            <strong style="color: #d97706;">🔧 Development Mode Active:</strong> 
            <p style="margin: 8px 0 0 0; color: #92400e;">
              This email was sent in Development Mode. Duplicate prevention has been bypassed for testing purposes.
            </p>
          </div>
          ` : ''}

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

// ==================== EMAIL SENDING FUNCTION ====================

async function sendConfirmationEmail(submission) {
  try {
    console.log(`📧 Sending confirmation email to: ${submission.email}`);
    
    const { data, error } = await resend.emails.send({
      from: 'UI Electoral Commission <noreply@iykevisualsdev.me>',
      to: [submission.email],
      subject: submission.devOverride ? 
        '🔧 [DEV] UI Student Union Election - Accreditation Confirmed' : 
        'UI Student Union Election - Accreditation Confirmed',
      html: confirmationEmailTemplate(submission)
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return { success: false, error };
    }

    console.log('✅ Email sent successfully! ID:', data.id);
    return { success: true, id: data.id };

  } catch (error) {
    console.error('💥 Email sending error:', error);
    return { success: false, error: error.message };
  }
}

// ==================== API ROUTES ====================

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    devMode: DEV_MODE,
    devEmails: DEV_EMAILS
  });
});

// Main form submission endpoint with Dev Mode support
app.post('/form-submission', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('\n🎓 NEW FORM SUBMISSION');
    console.log('📥 Received data:', JSON.stringify(req.body, null, 2));
    
    const { name, email, studentId, faculty, department, level, phoneNumber, forceEmail } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      console.log('❌ Validation failed: Missing name or email');
      return res.status(400).json({ 
        success: false,
        error: 'Name and email are required' 
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    // Check for duplicate email
    const existingSubmission = await Submission.findOne({ email: normalizedEmail });
    
    // DEV MODE: Check if we should bypass duplicate restrictions
    const shouldBypass = shouldBypassDuplicate(normalizedEmail, forceEmail);
    const isDevEmail = isDevEmail(normalizedEmail);
    
    if (existingSubmission && !shouldBypass) {
      console.log('⚠️ Duplicate submission detected for:', normalizedEmail);
      return res.status(200).json({
        success: true,
        accreditationId: existingSubmission.accreditationId,
        message: 'Already registered',
        emailSent: false,
        isDuplicate: true
      });
    }
    
    // Generate accreditation ID
    const accreditationId = existingSubmission ? existingSubmission.accreditationId : generateAccreditationId();
    
    if (existingSubmission && shouldBypass) {
      console.log('🔧 DEV MODE: Bypassing duplicate restriction for:', normalizedEmail);
      console.log('🆔 Using existing Accreditation ID:', accreditationId);
    } else {
      console.log('🆔 Generated Accreditation ID:', accreditationId);
    }
    
    let submission;
    
    if (existingSubmission && shouldBypass) {
      // Use existing submission but mark for dev override
      submission = existingSubmission;
      submission.devOverride = true;
    } else {
      // Create new submission
      submission = new Submission({
        accreditationId,
        name: name.trim(),
        email: normalizedEmail,
        studentId: studentId || '',
        faculty: faculty || '',
        department: department || '',
        level: level || '',
        phoneNumber: phoneNumber || '',
        status: 'pending',
        emailSent: false,
        submittedAt: new Date()
      });
    }
    
    // Save to database
    await submission.save();
    console.log('💾 Submission saved to database');
    
    // Send confirmation email
    const emailData = {
      ...submission.toObject(),
      devOverride: shouldBypass
    };
    
    const emailResult = await sendConfirmationEmail(emailData);
    
    // Update email status
    if (emailResult.success) {
      submission.emailSent = true;
      submission.emailId = emailResult.id;
      await submission.save();
      console.log('✅ Email status updated in database');
    } else {
      console.log('⚠️ Email sending failed but registration saved');
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`⏱️ Total processing time: ${processingTime}ms`);
    
    // Send response
    res.status(200).json({
      success: true,
      accreditationId: submission.accreditationId,
      message: existingSubmission && shouldBypass ? 
        'Already registered - Email forced for dev testing' : 
        'Registration successful',
      emailSent: emailResult.success,
      isDuplicate: !!existingSubmission,
      devOverride: shouldBypass,
      processingTime: `${processingTime}ms`
    });
    
  } catch (error) {
    console.error('💥 Form submission error:', error);
    
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all submissions (admin)
app.get('/submissions', async (req, res) => {
  try {
    const submissions = await Submission.find()
      .sort({ submittedAt: -1 })
      .limit(100);
    
    res.status(200).json({
      success: true,
      count: submissions.length,
      submissions
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get submission by ID
app.get('/submission/:accreditationId', async (req, res) => {
  try {
    const submission = await Submission.findOne({ 
      accreditationId: req.params.accreditationId 
    });
    
    if (!submission) {
      return res.status(404).json({ 
        success: false,
        error: 'Submission not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      submission
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Retry sending email for failed submissions
app.post('/retry-email/:accreditationId', async (req, res) => {
  try {
    const submission = await Submission.findOne({ 
      accreditationId: req.params.accreditationId 
    });
    
    if (!submission) {
      return res.status(404).json({ 
        success: false,
        error: 'Submission not found' 
      });
    }
    
    const emailResult = await sendConfirmationEmail(submission);
    
    if (emailResult.success) {
      submission.emailSent = true;
      submission.emailId = emailResult.id;
      await submission.save();
    }
    
    res.status(200).json({
      success: emailResult.success,
      message: emailResult.success ? 'Email sent successfully' : 'Email sending failed',
      error: emailResult.error
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Dev mode status endpoint
app.get('/dev-mode', (req, res) => {
  res.status(200).json({
    devMode: DEV_MODE,
    devEmails: DEV_EMAILS,
    enabled: DEV_MODE && DEV_EMAILS.length > 0
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({ 
    success: false,
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 Form endpoint: http://localhost:${PORT}/form-submission`);
  console.log(`🔧 Dev Mode: ${DEV_MODE ? 'ENABLED' : 'DISABLED'}`);
  console.log(`📧 Dev Emails: ${DEV_EMAILS.join(', ') || 'None'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
});
