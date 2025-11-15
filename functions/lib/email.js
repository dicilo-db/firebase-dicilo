import nodemailer from 'nodemailer';
export async function sendMail(input) {
  const mode = process.env.MAIL_MODE || 'gmail'; // "gmail" | "smtp" | "disabled"
  if (mode === 'disabled') return { ok: true, id: 'disabled' };
  if (mode === 'gmail') {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_SENDER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      },
    });
    const info = await transporter.sendMail({
      from: process.env.GMAIL_SENDER,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return { ok: true, id: info.messageId };
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  return { ok: true, id: info.messageId };
}
