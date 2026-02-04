import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '../../../lib/gmail';

export async function POST(request: NextRequest) {
  try {
    const { type, name, email, phone, message, confirmed, conversationHistory } = await request.json();

    if (type === 'hr_email_request') {
      if (!name || !email) {
        return NextResponse.json(
          { error: 'Name and email are required for HR email request' },
          { status: 400 }
        );
      }

      const hrEmailSubject = `HR Contact Request from Chatbot User: ${name}`;
      const hrEmailBody = `
        <h2>HR Contact Request from Rex Security Chatbot</h2>
        <p>A user has requested to contact HR through the chatbot.</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Conversation History:</strong></p>
        <div style="border: 1px solid #eee; padding: 10px; margin-top: 10px; background-color: #f9f9f9;">
          ${conversationHistory.map((msg: any) => `
            <p><strong>${msg.role === 'user' ? 'User' : 'Assistant'}:</strong> ${msg.parts[0].text}</p>
          `).join('')}
        </div>
        <hr>
        <p><em>Sent from Rex Security Chatbot - ${new Date().toLocaleString()}</em></p>
      `;

      await sendEmail({
        to: process.env.HR_EMAIL!, // Ensure HR_EMAIL is set in .env
        subject: hrEmailSubject,
        html: hrEmailBody,
      });

      return NextResponse.json({
        success: true,
        message: `Thank you, ${name}! Your request has been successfully sent to our HR team at ${email}. They will get back to you shortly.`
      });

    } else if (type === 'hr_call_request') {
      // Logic for HR call request - send notification to HR
      const hrCallSubject = `HR Call Request from Chatbot User`;
      const hrCallBody = `
        <h2>HR Call Request from Rex Security Chatbot</h2>
        <p>A user has indicated they wish to call HR through the chatbot and has been provided with the call option.</p>
        <p><strong>Conversation History:</strong></p>
        <div style="border: 1px solid #eee; padding: 10px; margin-top: 10px; background-color: #f9f9f9;">
          ${conversationHistory.map((msg: any) => `
            <p><strong>${msg.role === 'user' ? 'User' : 'Assistant'}:</strong> ${msg.parts[0].text}</p>
          `).join('')}
        </div>
        <hr>
        <p><em>Sent from Rex Security Chatbot - ${new Date().toLocaleString()}</em></p>
      `;

      await sendEmail({
        to: process.env.HR_EMAIL!, // Ensure HR_EMAIL is set in .env
        subject: hrCallSubject,
        html: hrCallBody,
      });

      return NextResponse.json({
        success: true,
        message: `Our HR team has been notified of your intent to call. Please use the provided button to connect with them directly.`
      });

    }
    else {
      // Existing logic for general contact form and call requests
      if (!name || !message) {
        return NextResponse.json(
          { error: 'Name and message are required' },
          { status: 400 }
        );
      }

      if (type === 'call' && !confirmed) {
        return NextResponse.json({
          needsConfirmation: true,
          message: `Are you sure you want us to call you at ${phone}? We'll reach out during business hours (Mon-Fri, 9 AM - 5 PM).`
        });
      }

      const emailSubject = type === 'call' 
        ? `🔔 CALL REQUEST from ${name}` 
        : `📧 Contact Form Submission from ${name}`;

      const emailBody = `
        <h2>New ${type === 'call' ? 'Call Request' : 'Contact Form'} from Website</h2>
        
        <p><strong>Name:</strong> ${name}</p>
        ${email ? `<p><strong>Email:</strong> ${email}</p>` : ''}
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        
        ${type === 'call' ? '<p><strong>⚠️ CALL REQUESTED - Please contact this person by phone</strong></p>' : ''}
        
        <hr>
        <p><em>Sent from Rex Security Chatbot - ${new Date().toLocaleString()}</em></p>
      `;

      await sendEmail({
        to: process.env.HR_EMAIL!,
        subject: emailSubject,
        html: emailBody,
      });

      return NextResponse.json({
        success: true,
        message: type === 'call' 
          ? `Thank you! Our HR team will call you at ${phone} during business hours.`
          : 'Thank you! Your message has been sent to our HR team. We\'ll respond within 1 business hour.'
      });
    }

  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
