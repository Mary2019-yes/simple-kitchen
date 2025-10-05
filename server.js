// server.js
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const fetch = require('node-fetch'); // optional - not required here but available
const twilio = require('twilio');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS if frontend served from another origin (e.g., GitHub Pages)
const cors = require('cors');
app.use(cors());

// Load env
const {
  PORT = 3000,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_TO,          // where feedback emails go (your inbox)
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_FROM, // e.g. 'whatsapp:+1415XXXXX'
  OWNER_WHATSAPP_NUMBER  // e.g. 'whatsapp:+2547XXXXXXXX'
} = process.env;

// Nodemailer transporter (SMTP)
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

// Twilio client
const twClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Simple health
app.get('/', (req, res) => res.send('Simplifyd Home backend running'));

// POST /api/contact
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1) Send Email to owner
    const mailOptions = {
      from: `"Simplifyd Home" <${SMTP_USER}>`,
      to: EMAIL_TO,
      subject: `New contact from ${name}`,
      text:
        `You have a new message from your website:\n\n` +
        `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\n\nMessage:\n${message}`,
      html: `<p>You have a new message from your website:</p>
             <p><strong>Name:</strong> ${name}<br/>
             <strong>Email:</strong> ${email}<br/>
             <strong>Phone:</strong> ${phone || 'N/A'}</p>
             <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`
    };
    await transporter.sendMail(mailOptions);

    // 2) Send WhatsApp notification to owner using Twilio (owner receives a WhatsApp message)
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM && OWNER_WHATSAPP_NUMBER) {
      const waBody = `New contact from website:\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nMessage: ${message.slice(0, 400)}`;
      await twClient.messages.create({
        from: TWILIO_WHATSAPP_FROM,
        to: OWNER_WHATSAPP_NUMBER,
        body: waBody
      });
    }

    // 3) Optionally send a WhatsApp confirmation to visitor (commented out — use only if you have proper templates/permission)
    // await twClient.messages.create({
    //   from: TWILIO_WHATSAPP_FROM,
    //   to: `whatsapp:${phone}`, // visitor's phone in international format
    //   body: `Hi ${name}, thanks for contacting Simplifyd Home! We'll reply shortly on WhatsApp.`
    // });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Contact error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
