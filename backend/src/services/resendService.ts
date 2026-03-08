import { Resend } from 'resend';
import logger from '../lib/logger';

// ─── Resend Client ───

let resend: Resend | null = null;

function getResend(): Resend | null {
    if (!process.env.RESEND_API_KEY) return null;
    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
}

export function isResendConfigured(): boolean {
    return !!process.env.RESEND_API_KEY;
}

const FROM_EMAIL = () => process.env.RESEND_FROM || 'TripPlanner <noreply@tripplanner.com>';

// ─── Shared Layout ───

function emailLayout(body: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,sans-serif;background:#f3f4f6;">
<div style="max-width:560px;margin:0 auto;padding:24px 16px;">
${body}
<div style="text-align:center;padding:24px 0 8px;color:#9ca3af;font-size:12px;">
    \u00a9 ${new Date().getFullYear()} TripPlanner \u2014 Your next adventure starts here.
</div>
</div>
</body>
</html>`;
}

// ─── 1. OTP Verification Email ───

export async function sendOtpEmail(to: string, name: string, otp: string): Promise<boolean> {
    const html = emailLayout(`
<div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:16px;padding:32px 24px;text-align:center;color:#fff;">
    <h1 style="margin:0;font-size:24px;">Verify Your Email</h1>
    <p style="margin:8px 0 0;opacity:0.85;">Welcome to TripPlanner, ${name}!</p>
</div>
<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px 24px;margin-top:16px;text-align:center;">
    <p style="color:#374151;margin:0 0 8px;font-size:15px;">Your verification code is:</p>
    <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#2563eb;padding:16px 0;font-family:monospace;">
        ${otp}
    </div>
    <p style="color:#6b7280;font-size:13px;margin:16px 0 0;">This code expires in <strong>10 minutes</strong>. Don't share it with anyone.</p>
</div>`);

    return sendEmail(to, '\u2709\ufe0f Verify your TripPlanner account', html);
}

// ─── 2. Welcome Email ───

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const appUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
    const html = emailLayout(`
<div style="background:linear-gradient(135deg,#059669,#10b981);border-radius:16px;padding:32px 24px;text-align:center;color:#fff;">
    <h1 style="margin:0;font-size:24px;">\u2728 Welcome to TripPlanner!</h1>
    <p style="margin:8px 0 0;opacity:0.85;">You're all set, ${name}.</p>
</div>
<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-top:16px;">
    <h2 style="color:#1f2937;font-size:16px;margin:0 0 12px;">Here's what you can do:</h2>
    <ul style="list-style:none;padding:0;margin:0;font-size:14px;color:#374151;line-height:2;">
        <li>\ud83d\uddfa\ufe0f Plan multi-city AI itineraries across India</li>
        <li>\ud83c\udfe8 Get hotel & restaurant recommendations</li>
        <li>\ud83d\udc65 Create group trips and invite friends</li>
        <li>\ud83c\udf10 Publish trips and explore the community feed</li>
        <li>\ud83d\udcb0 Track expenses on the go</li>
    </ul>
    <div style="text-align:center;margin-top:20px;">
        <a href="${appUrl}/plan" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:10px;text-decoration:none;font-weight:600;">Start Planning</a>
    </div>
</div>`);

    return sendEmail(to, '\u2728 Welcome to TripPlanner!', html);
}

// ─── 3. Password Reset Email (Resend version) ───

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<boolean> {
    const html = emailLayout(`
<div style="background:linear-gradient(135deg,#dc2626,#ef4444);border-radius:16px;padding:32px 24px;text-align:center;color:#fff;">
    <h1 style="margin:0;font-size:24px;">\ud83d\udd11 Reset Your Password</h1>
</div>
<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-top:16px;">
    <p style="color:#374151;line-height:1.6;">Hi ${name},</p>
    <p style="color:#374151;line-height:1.6;">We received a request to reset your TripPlanner password. Click the button below:</p>
    <div style="text-align:center;margin:24px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;">Reset Password</a>
    </div>
    <p style="color:#6b7280;font-size:13px;">This link expires in 15 minutes. If you didn't request this, ignore this email.</p>
</div>`);

    return sendEmail(to, '\ud83d\udd11 Reset Your TripPlanner Password', html);
}

// ─── 4. Trip Published Email ───

export async function sendTripPublishedEmail(to: string, name: string, tripTitle: string, tripId: string): Promise<boolean> {
    const appUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
    const html = emailLayout(`
<div style="background:linear-gradient(135deg,#7c3aed,#a855f7);border-radius:16px;padding:32px 24px;text-align:center;color:#fff;">
    <h1 style="margin:0;font-size:24px;">\ud83c\udf0d Trip Published!</h1>
    <p style="margin:8px 0 0;opacity:0.85;">"${tripTitle}" is now live</p>
</div>
<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-top:16px;text-align:center;">
    <p style="color:#374151;font-size:15px;">Great job, ${name}! Your trip is now visible to the TripPlanner community.</p>
    <p style="color:#6b7280;font-size:13px;margin:12px 0;">Others can now discover, like, and draw inspiration from your itinerary.</p>
    <a href="${appUrl}/explore" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:8px;">View on Explore</a>
</div>`);

    return sendEmail(to, `\ud83c\udf0d Your trip "${tripTitle}" is now published!`, html);
}

// ─── 5. Group Invite Email ───

export async function sendGroupInviteEmail(
    to: string, inviterName: string, groupName: string, groupId: string, inviteCode: string, personalMessage?: string
): Promise<boolean> {
    const appUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
    const joinUrl = `${appUrl}/group/${groupId}?invite=${inviteCode}`;
    const msgBlock = personalMessage
        ? `<div style="margin:12px 0;padding:12px 16px;background:#f0f9ff;border-radius:8px;font-style:italic;color:#374151;">"${personalMessage}"</div>`
        : '';
    const html = emailLayout(`
<div style="background:linear-gradient(135deg,#2563eb,#7c3aed);border-radius:16px;padding:32px 24px;text-align:center;color:#fff;">
    <h1 style="margin:0;font-size:22px;">\ud83d\uddfa\ufe0f Trip Invitation</h1>
    <p style="margin:8px 0 0;opacity:0.85;">${inviterName} invited you to join</p>
    <h2 style="margin:12px 0 0;font-size:18px;">"${groupName}"</h2>
</div>
<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-top:16px;text-align:center;">
    ${msgBlock}
    <a href="${joinUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;margin-top:12px;">View Trip & Join</a>
    <p style="margin-top:16px;font-size:12px;color:#9ca3af;">You've been invited as a viewer</p>
</div>`);

    return sendEmail(to, `\ud83d\uddfa\ufe0f You're invited to "${groupName}"!`, html);
}

// ─── 6. Itinerary Email (Resend version) ───

export async function sendItineraryEmailViaResend(to: string, tripResult: any, pdfBuffer?: Buffer): Promise<boolean> {
    const itinerary = tripResult.itinerary || [];
    const summary = tripResult.summary || {};
    const cities = [...new Set(itinerary.map((d: any) => d.city))] as string[];
    const subject = `\ud83c\uddee\ud83c\uddf3 Your ${itinerary.length}-Day Trip Itinerary \u2014 ${cities.slice(0, 3).join(', ')}`;

    // Reuse the existing HTML builder from emailService for the rich itinerary
    const { buildItineraryEmailHTML } = await import('./emailService');
    const html = buildItineraryEmailHTML ? buildItineraryEmailHTML(tripResult) : `<p>Your itinerary is attached.</p>`;

    const client = getResend();
    if (!client) {
        logger.info(`[DEV] Would send itinerary email to ${to}`);
        return false;
    }

    try {
        const options: any = { from: FROM_EMAIL(), to, subject, html };
        if (pdfBuffer) {
            options.attachments = [{ filename: `trip-itinerary-${itinerary.length}days.pdf`, content: pdfBuffer }];
        }
        await client.emails.send(options);
        return true;
    } catch (error: any) {
        logger.error('Resend itinerary email error:', error);
        return false;
    }
}

// ─── Core Send Helper ───

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    const client = getResend();
    if (!client) {
        logger.info(`[DEV] Email to ${to}: ${subject}`);
        return true; // Return true in dev so flows don't break
    }

    try {
        await client.emails.send({ from: FROM_EMAIL(), to, subject, html });
        return true;
    } catch (error: any) {
        logger.error(`Resend email error (${subject}):`, error);
        return false;
    }
}
