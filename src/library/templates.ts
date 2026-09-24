import { formatEventDate, formatEventTime, formatINR } from "@/lib/utils";

const shell = (title: string, body: string) => `
<div style="font-family:Inter,Arial,sans-serif;background:#0A0B14;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#12131F;border-radius:16px;overflow:hidden;border:1px solid #262838;">
    <div style="padding:24px 28px;background:linear-gradient(135deg,#7C3AED,#3B82F6);">
      <span style="color:#fff;font-weight:700;font-size:20px;letter-spacing:0.02em;">EVENTRA</span>
    </div>
    <div style="padding:28px;color:#E5E7F0;">
      <h1 style="font-size:18px;margin:0 0 16px;color:#fff;">${title}</h1>
      ${body}
    </div>
    <div style="padding:20px 28px;border-top:1px solid #262838;color:#7C7F94;font-size:12px;">
      You're receiving this because of activity on your EVENTRA account.
    </div>
  </div>
</div>`;

export function bookingConfirmedEmail(params: {
  attendeeName: string;
  eventTitle: string;
  startDate: Date;
  venueName?: string;
  bookingRef: string;
  total: number;
}) {
  const body = `
    <p style="line-height:1.6;">Hi ${params.attendeeName}, your booking for <strong>${params.eventTitle}</strong> is confirmed.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 0;color:#9296AC;">Date</td><td style="padding:6px 0;text-align:right;">${formatEventDate(params.startDate)}, ${formatEventTime(params.startDate)}</td></tr>
      ${params.venueName ? `<tr><td style="padding:6px 0;color:#9296AC;">Venue</td><td style="padding:6px 0;text-align:right;">${params.venueName}</td></tr>` : ""}
      <tr><td style="padding:6px 0;color:#9296AC;">Booking ID</td><td style="padding:6px 0;text-align:right;">${params.bookingRef}</td></tr>
      <tr><td style="padding:6px 0;color:#9296AC;">Total paid</td><td style="padding:6px 0;text-align:right;">${formatINR(params.total)}</td></tr>
    </table>
    <p style="line-height:1.6;">Your digital ticket with QR code is ready in the EVENTRA app under My Tickets.</p>
  `;
  return { subject: `You're going! ${params.eventTitle}`, html: shell("Booking confirmed", body) };
}

export function eventReminderEmail(params: { attendeeName: string; eventTitle: string; startDate: Date; venueName?: string; hoursBefore: number }) {
  const body = `
    <p style="line-height:1.6;">Hi ${params.attendeeName}, <strong>${params.eventTitle}</strong> starts in about ${params.hoursBefore} hours.</p>
    <p style="line-height:1.6;color:#9296AC;">${formatEventDate(params.startDate)} · ${formatEventTime(params.startDate)}${params.venueName ? ` · ${params.venueName}` : ""}</p>
    <p style="line-height:1.6;">Have your QR ticket ready at entry.</p>
  `;
  return { subject: `Reminder: ${params.eventTitle} is coming up`, html: shell("Event reminder", body) };
}

export function cancellationEmail(params: { attendeeName: string; eventTitle: string; refundAmount?: number }) {
  const body = `
    <p style="line-height:1.6;">Hi ${params.attendeeName}, your booking for <strong>${params.eventTitle}</strong> has been cancelled.</p>
    ${params.refundAmount ? `<p style="line-height:1.6;">A refund of ${formatINR(params.refundAmount)} has been initiated and should reflect in 5-7 business days.</p>` : ""}
  `;
  return { subject: `Booking cancelled: ${params.eventTitle}`, html: shell("Booking cancelled", body) };
}
