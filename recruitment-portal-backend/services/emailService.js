// services/emailService.js - Fixed version
const { EmailClient } = require("@azure/communication-email");

async function sendInterviewInvite(candidate, interview) {
  console.log(`Attempting to send email to ${candidate.email}`);
  
  // Format the date and time nicely
  const scheduledDate = new Date(interview.scheduledAt);
  const formattedDate = scheduledDate.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = scheduledDate.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit'
  });

  // Initialize the Azure Email client
  const connectionString = process.env.AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING;
  const emailClient = new EmailClient(connectionString);
  
  // Make sure all required fields are properly defined
  const subject = `Invitación a Entrevista: ${interview.vacancyTitle || 'Posición'}`;
  const senderAddress = process.env.AZURE_EMAIL_SENDER || 'noreply@21e59883-ad48-403d-bd7d-3fdabfa1f3b8.azurecomm.net';
  
  try {
    // Prepare message following exact structure expected by Azure SDK
    const message = {
      senderAddress: senderAddress,
      recipients: {
        to: [
          {
            address: candidate.email,
            displayName: `${candidate.firstName} ${candidate.lastName}`
          }
        ]
      },
      content: {
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Invitación a Entrevista</h2>
            <p>Estimado/a ${candidate.firstName},</p>
            <p>Has sido invitado/a a una entrevista para el puesto de <strong>${interview.vacancyTitle || 'Posición'}</strong>.</p>
            <p>Tienes hasta:</p>

            <div style="background-color: #F3F4F6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #111827;">Detalles de la Entrevista</h3>
              <p><strong>Fecha:</strong> ${formattedDate}</p>
              <p><strong>Hora:</strong> ${formattedTime}</p>
            </div>
            
            <p>Ve a tu portal de candidato, graba tu entrevista y envíala.</p>
            
            <p>Saludos cordiales,<br>El Equipo de Reclutamiento</p>
          </div>
        `,
        plainText: `Estimado/a ${candidate.firstName},

Has sido invitado/a a una entrevista para el puesto de ${interview.vacancyTitle || 'Posición'}.
Tienes hasta:
Fecha: ${formattedDate}
Hora: ${formattedTime}
Ve a tu portal de candidato, graba tu entrevista y envíala.

Saludos cordiales,
El Equipo de Reclutamiento`
      }
    };

    console.log('Sending email with message:', JSON.stringify(message, null, 2));
    
    // Send the email
    const poller = await emailClient.beginSend(message);
    const response = await poller.pollUntilDone();
    console.log(`Email sent successfully to ${candidate.email}`);
    console.log('Azure Communication Services response:', response);
    return { success: true, emailSent: true };
  } catch (error) {
    console.error(`Failed to send email to ${candidate.email}:`, error);
    // Add more detailed logging to help with troubleshooting
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.details) {
      console.error('Error details:', error.details);
    }
    // Return success: false but don't throw - allows the application to continue
    return { success: false, emailSent: false, error: error.message };
  }
}

module.exports = {
  sendInterviewInvite
};