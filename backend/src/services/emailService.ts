// Email Service for Itineraries
import nodemailer from 'nodemailer';
import { generateItineraryPDF } from './pdfService';

interface Activity {
    name: string;
    type: string;
    timeRequired: number;
    bestTimeOfDay: string;
}

interface DayItinerary {
    day: number;
    city: string;
    activities: Activity[];
    travel?: {
        from: string;
        to: string;
        distance: number;
        duration: number;
        mode?: string;
    };
    nightStay: string | { hotel: { name: string }; city: string };
}

interface TripSummary {
    totalCost: number;
    totalDistance: number;
    feasibility: string;
    costBreakup: {
        stay: number;
        transport?: number;
        travel?: number;
        activities: number;
        food?: number;
    };
}

interface TripResult {
    itinerary: DayItinerary[];
    summary: TripSummary;
}

function isSmtpConfigured(): boolean {
    return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

function getNightStayName(nightStay: string | { hotel: { name: string }; city: string }): string {
    if (typeof nightStay === 'object' && nightStay !== null && 'hotel' in nightStay) {
        return nightStay.hotel.name;
    }
    return nightStay as string;
}

function buildEmailHTML(tripResult: TripResult): string {
    const { itinerary, summary } = tripResult;
    const cities = [...new Set(itinerary.map(d => d.city))];

    const dayRows = itinerary.map(day => {
        const activities = (day.activities || [])
            .map(a => `<li style="padding:4px 0;color:#374151;">📍 ${a.name} <span style="color:#9ca3af;">(${a.timeRequired}h • ${a.bestTimeOfDay})</span></li>`)
            .join('');

        const travelSection = day.travel
            ? `<div style="margin-top:8px;padding:8px 12px;background:#fef3c7;border-radius:8px;font-size:13px;color:#92400e;">
                🚗 Travel to ${day.travel.to}: ${Math.round(day.travel.distance)}km (~${Math.round(day.travel.duration)}h)${day.travel.mode ? ` via ${day.travel.mode}` : ''}
               </div>`
            : '';

        const stayName = getNightStayName(day.nightStay);

        return `
        <div style="margin-bottom:24px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:12px 20px;color:#ffffff;">
                <strong style="font-size:16px;">Day ${day.day} — ${day.city}</strong>
            </div>
            <div style="padding:16px 20px;">
                <ul style="list-style:none;padding:0;margin:0;">${activities || '<li style="color:#9ca3af;padding:4px 0;">Free day for leisure</li>'}</ul>
                ${travelSection}
                <div style="margin-top:8px;font-size:13px;color:#6b7280;">🌙 Overnight: ${stayName}</div>
            </div>
        </div>`;
    }).join('');

    const transportCost = summary.costBreakup.transport || summary.costBreakup.travel || 0;

    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,sans-serif;background:#f3f4f6;">
        <div style="max-width:600px;margin:0 auto;background:#f3f4f6;padding:20px;">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:16px;padding:32px 24px;text-align:center;color:#ffffff;">
                <h1 style="margin:0;font-size:24px;">✨ Your Journey Itinerary</h1>
                <p style="margin:8px 0 0;opacity:0.85;font-size:14px;">
                    ${itinerary.length} Days • ${Math.round(summary.totalDistance)}km • ₹${summary.totalCost.toLocaleString('en-IN')}
                </p>
                <p style="margin:4px 0 0;opacity:0.7;font-size:13px;">
                    ${cities.join(' → ')}
                </p>
            </div>

            <!-- Stats -->
            <div style="display:flex;gap:12px;margin:20px 0;">
                <div style="flex:1;background:#ffffff;border-radius:12px;padding:16px;text-align:center;border:1px solid #e5e7eb;">
                    <div style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Cost</div>
                    <div style="font-size:20px;font-weight:bold;color:#2563eb;margin-top:4px;">₹${summary.totalCost.toLocaleString('en-IN')}</div>
                </div>
                <div style="flex:1;background:#ffffff;border-radius:12px;padding:16px;text-align:center;border:1px solid #e5e7eb;">
                    <div style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Distance</div>
                    <div style="font-size:20px;font-weight:bold;color:#7c3aed;margin-top:4px;">${Math.round(summary.totalDistance)}km</div>
                </div>
                <div style="flex:1;background:#ffffff;border-radius:12px;padding:16px;text-align:center;border:1px solid #e5e7eb;">
                    <div style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Pace</div>
                    <div style="font-size:16px;font-weight:bold;color:#059669;margin-top:4px;text-transform:capitalize;">${summary.feasibility}</div>
                </div>
            </div>

            <!-- Days -->
            ${dayRows}

            <!-- Cost Breakdown -->
            <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-top:8px;">
                <h2 style="margin:0 0 12px;font-size:16px;color:#1f2937;">💰 Cost Breakdown</h2>
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                    ${summary.costBreakup.stay > 0 ? `<tr><td style="padding:6px 0;color:#6b7280;">🏨 Accommodation</td><td style="padding:6px 0;text-align:right;font-weight:600;">₹${summary.costBreakup.stay.toLocaleString('en-IN')}</td></tr>` : ''}
                    ${transportCost > 0 ? `<tr><td style="padding:6px 0;color:#6b7280;">🚗 Transport</td><td style="padding:6px 0;text-align:right;font-weight:600;">₹${transportCost.toLocaleString('en-IN')}</td></tr>` : ''}
                    ${summary.costBreakup.activities > 0 ? `<tr><td style="padding:6px 0;color:#6b7280;">🎟️ Activities</td><td style="padding:6px 0;text-align:right;font-weight:600;">₹${summary.costBreakup.activities.toLocaleString('en-IN')}</td></tr>` : ''}
                    ${summary.costBreakup.food && summary.costBreakup.food > 0 ? `<tr><td style="padding:6px 0;color:#6b7280;">🍽️ Food</td><td style="padding:6px 0;text-align:right;font-weight:600;">₹${summary.costBreakup.food.toLocaleString('en-IN')}</td></tr>` : ''}
                    <tr style="border-top:2px solid #e5e7eb;"><td style="padding:10px 0;font-weight:bold;color:#1f2937;">Total</td><td style="padding:10px 0;text-align:right;font-weight:bold;color:#2563eb;font-size:16px;">₹${summary.totalCost.toLocaleString('en-IN')}</td></tr>
                </table>
            </div>

            <!-- Footer -->
            <div style="text-align:center;padding:24px 0 8px;color:#9ca3af;font-size:12px;">
                Generated by Trip Planner ✨ on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
            </div>
        </div>
    </body>
    </html>`;
}

export async function sendItineraryEmail(
    to: string,
    tripResult: TripResult,
    attachPdf: boolean = false
): Promise<{ success: boolean; message: string }> {
    if (!isSmtpConfigured()) {
        return {
            success: false,
            message: 'Email is not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.',
        };
    }

    try {
        const transporter = createTransporter();
        const html = buildEmailHTML(tripResult);

        const cities = [...new Set(tripResult.itinerary.map(d => d.city))];
        const subject = `🇮🇳 Your ${tripResult.itinerary.length}-Day Trip Itinerary — ${cities.slice(0, 3).join(', ')}`;

        const mailOptions: nodemailer.SendMailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            html,
        };

        // Attach PDF if requested
        if (attachPdf) {
            const pdfBuffer = await generateItineraryPDF(tripResult as any);
            mailOptions.attachments = [
                {
                    filename: `trip-itinerary-${tripResult.itinerary.length}days.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
            ];
        }

        await transporter.sendMail(mailOptions);
        return { success: true, message: 'Itinerary sent successfully!' };
    } catch (error: any) {
        console.error('Email send error:', error);
        return {
            success: false,
            message: error.message || 'Failed to send email',
        };
    }
}

export async function sendResetPasswordEmail(
    to: string,
    userName: string,
    resetUrl: string
): Promise<void> {
    if (!isSmtpConfigured()) {
        console.log(`[DEV] Password reset link for ${to}: ${resetUrl}`);
        return;
    }

    const transporter = createTransporter();

    const html = `
    <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px;">
        <h2 style="color:#1e40af;margin-bottom:16px;">Reset Your Password</h2>
        <p style="color:#374151;line-height:1.6;">Hi ${userName},</p>
        <p style="color:#374151;line-height:1.6;">We received a request to reset your TripPlanner password. Click the button below to set a new password:</p>
        <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;display:inline-block;">Reset Password</a>
        </div>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;">This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#9ca3af;font-size:12px;">TripPlanner — Your next adventure starts here.</p>
    </div>`;

    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: '🔑 Reset Your TripPlanner Password',
        html,
    });
}
