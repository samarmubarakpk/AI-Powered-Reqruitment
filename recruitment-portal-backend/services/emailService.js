// services/emailService.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendInterviewInvite(candidate, interview) {
  console.log(`Attempting to send email to ${candidate.email}`);
  
  // Format the date and time nicely
  const scheduledDate = new Date(interview.scheduledAt);
  const formattedDate = scheduledDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = scheduledDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit'
  });
  
  const msg = {
    to: candidate.email,
    from: process.env.SENDGRID_FROM_EMAIL || 'samarmubarakofficial@gmail.com', // Use env var with fallback
    subject: `Interview Invitation: ${interview.vacancyTitle}`,
    text: `Dear ${candidate.firstName},

You have been invited to an interview for the position of ${interview.vacancyTitle}.

Interview Details:
Date: ${formattedDate}
Time: ${formattedTime}

Please prepare for the interview and ensure you are available at the scheduled time.

Best regards,
The Recruitment Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Interview Invitation</h2>
        <p>Dear ${candidate.firstName},</p>
        <p>You have been invited to an interview for the position of <strong>${interview.vacancyTitle}</strong>.</p>
        
        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #111827;">Interview Details</h3>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedTime}</p>
        </div>
        
        <p>Please prepare for the interview and ensure you are available at the scheduled time.</p>
        
        <p>Best regards,<br>The Recruitment Team</p>
      </div>
    `,
  };
  
  try {
    const result = await sgMail.send(msg);
    console.log(`Email sent successfully to ${candidate.email}`);
    console.log('SendGrid response:', result);
    return { success: true };
  } catch (error) {
    console.error(`Failed to send email to ${candidate.email}:`, error);
    if (error.response) {
      console.error('SendGrid error body:', error.response.body);
    }
    throw error;
  }
}

module.exports = {
  sendInterviewInvite
};