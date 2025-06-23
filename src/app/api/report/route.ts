import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { message, instaUsername } = await req.json();
    if (!message || message.length < 10) {
      return NextResponse.json({ error: 'Message is required and must be at least 10 characters.' }, { status: 400 });
    }

    // Configure Nodemailer (using Gmail SMTP for example)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.REPORT_EMAIL_USER, // e.g. 'mariwan.support.privacy.main@gmail.com'
        pass: process.env.REPORT_EMAIL_PASS, // App password or OAuth2
      },
    });

    const mailOptions = {
      from: process.env.REPORT_EMAIL_USER,
      to: 'mariwan.support.privacy.main@gmail.com',
      subject: 'New User Report from AI App',
      text: `Report message:\n${message}\n\nInstagram Username: ${instaUsername || 'Not provided'}`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending report:', error);
    return NextResponse.json({ error: 'Failed to send report.' }, { status: 500 });
  }
} 