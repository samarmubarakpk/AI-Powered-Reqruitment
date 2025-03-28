// In your services folder, create emailService.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendInterviewInvite(candidate, interview) {
  const msg = {
    to: candidate.email,
    from: 'recruiting@yourcompany.com',
    subject: 'Interview Invitation',
    text: `Dear ${candidate.firstName},\n\nYou have been invited to an interview for the position of ${interview.vacancyTitle}. The interview is scheduled for ${new Date(interview.scheduledAt).toLocaleString()}.\n\nPlease click the following link to join the interview: ${process.env.APP_URL}/interviews/${interview.id}/join\n\nBest regards,\nThe Recruitment Team`,
    html: `<p>Dear ${candidate.firstName},</p><p>You have been invited to an interview for the position of <strong>${interview.vacancyTitle}</strong>. The interview is scheduled for <strong>${new Date(interview.scheduledAt).toLocaleString()}</strong>.</p><p>Please click the following link to join the interview: <a href="${process.env.APP_URL}/interviews/${interview.id}/join">Join Interview</a></p><p>Best regards,<br>The Recruitment Team</p>`,
  };
  
  await sgMail.send(msg);
}

module.exports = {
  sendInterviewInvite
};