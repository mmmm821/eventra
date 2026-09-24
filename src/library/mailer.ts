import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.EMAIL_SERVER_HOST) {
    // No SMTP configured (e.g. local dev without a mail provider). Fall back
    // to a transport that just logs to the console so the rest of the app
    // keeps working end-to-end.
    transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT || 587),
    secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
  return transporter;
}

export async function sendMail(opts: { to: string; subject: string; html: string }) {
  const t = getTransporter();
  try {
    const info = await t.sendMail({
      from: process.env.EMAIL_FROM || "EVENTRA <tickets@eventra.app>",
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return info;
  } catch (err) {
    // Email failures should never break a booking that already succeeded in
    // the database — log and move on.
    console.error("[mailer] failed to send email:", err);
    return null;
  }
}
