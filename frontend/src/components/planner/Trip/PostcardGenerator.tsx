import { FC, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import type { TripResult } from '@/types';

export type PostcardTemplate = 'classic' | 'modern' | 'colorful';
export type ColorTheme = 'warm' | 'cool' | 'earthy';

export interface PostcardConfig {
    template: PostcardTemplate;
    colorTheme: ColorTheme;
    title: string;
    message: string;
    showStats: boolean;
    showQR: boolean;
    showRoute: boolean;
    shareUrl?: string;
}

interface PostcardGeneratorProps {
    result: TripResult;
    config: PostcardConfig;
    onCanvasReady?: (canvas: HTMLCanvasElement) => void;
    width?: number;
    height?: number;
}

const COLOR_PALETTES: Record<ColorTheme, { primary: string; secondary: string; accent: string; text: string; gradStart: string; gradEnd: string }> = {
    warm: { primary: '#e67e22', secondary: '#e74c3c', accent: '#f39c12', text: '#2c1810', gradStart: '#ff6b35', gradEnd: '#d63384' },
    cool: { primary: '#2563eb', secondary: '#7c3aed', accent: '#06b6d4', text: '#0f172a', gradStart: '#2563eb', gradEnd: '#7c3aed' },
    earthy: { primary: '#92400e', secondary: '#065f46', accent: '#b45309', text: '#1c1917', gradStart: '#78716c', gradEnd: '#365314' },
};

const DISTANCE_COMPARISONS = [
    { distance: 1380, text: 'Delhi → Mumbai' },
    { distance: 2150, text: 'Delhi → Bangalore' },
    { distance: 300, text: 'Delhi → Jaipur' },
    { distance: 600, text: 'Mumbai → Goa' },
    { distance: 1000, text: 'Kolkata → Chennai' },
];

function getDistanceComparison(km: number): string {
    const sorted = [...DISTANCE_COMPARISONS].sort((a, b) => Math.abs(a.distance - km) - Math.abs(b.distance - km));
    const best = sorted[0];
    const ratio = km / best.distance;
    if (ratio >= 1.8) return `≈ ${best.text} × ${Math.round(ratio)}!`;
    if (ratio >= 0.9) return `≈ ${best.text}`;
    return `${Math.round(km)} km of adventure`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

export const PostcardGenerator: FC<PostcardGeneratorProps> = ({
    result, config, onCanvasReady,
    width = 1200, height = 630,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const cities = [...new Set(result.itinerary.map(d => d.city))];
    const totalDays = result.itinerary.length;
    const totalCost = Math.round(result.summary.totalCost);
    const totalDistance = Math.round(result.summary.totalDistance);
    const palette = COLOR_PALETTES[config.colorTheme];

    const drawClassic = useCallback(async (ctx: CanvasRenderingContext2D, scale: number) => {
        const W = width * scale;
        const H = height * scale;

        // Aged paper background
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#fdf6e3');
        bgGrad.addColorStop(1, '#f5e6c8');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Border — vintage double line
        ctx.strokeStyle = palette.primary;
        ctx.lineWidth = 4 * scale;
        roundRect(ctx, 20 * scale, 20 * scale, W - 40 * scale, H - 40 * scale, 8 * scale);
        ctx.stroke();
        ctx.lineWidth = 1.5 * scale;
        roundRect(ctx, 28 * scale, 28 * scale, W - 56 * scale, H - 56 * scale, 6 * scale);
        ctx.stroke();

        // Stamp badge (top-right)
        const stampSize = 90 * scale;
        const stampX = W - stampSize - 50 * scale;
        const stampY = 40 * scale;
        ctx.save();
        ctx.translate(stampX + stampSize / 2, stampY + stampSize / 2);
        ctx.rotate(-0.15);
        ctx.fillStyle = palette.secondary;
        roundRect(ctx, -stampSize / 2, -stampSize / 2, stampSize, stampSize, 6 * scale);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${14 * scale}px Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.fillText('🇮🇳 INDIA', 0, -10 * scale);
        ctx.font = `${11 * scale}px Georgia, serif`;
        ctx.fillText('POST', 0, 10 * scale);
        ctx.fillText('CARD', 0, 26 * scale);
        ctx.restore();

        // Title
        ctx.fillStyle = palette.text;
        ctx.font = `bold ${36 * scale}px Georgia, serif`;
        ctx.textAlign = 'left';
        ctx.fillText(config.title, 60 * scale, 90 * scale);

        // Divider
        ctx.strokeStyle = palette.accent;
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(60 * scale, 110 * scale);
        ctx.lineTo(500 * scale, 110 * scale);
        ctx.stroke();

        // Cities route
        if (config.showRoute) {
            ctx.font = `${16 * scale}px Georgia, serif`;
            ctx.fillStyle = '#5d4037';
            const routeText = cities.join('  →  ');
            ctx.fillText(routeText.length > 70 ? routeText.substring(0, 67) + '...' : routeText, 60 * scale, 145 * scale);
        }

        // Stats strip
        if (config.showStats) {
            const statsY = 190 * scale;
            ctx.fillStyle = palette.primary + '15';
            roundRect(ctx, 50 * scale, statsY - 20 * scale, W - 250 * scale, 80 * scale, 12 * scale);
            ctx.fill();

            ctx.font = `bold ${22 * scale}px Georgia, serif`;
            ctx.fillStyle = palette.primary;
            const statsItems = [
                `📅 ${totalDays} Days`,
                `🏙️ ${cities.length} Cities`,
                `💰 ₹${totalCost.toLocaleString('en-IN')}`,
                `🛣️ ${totalDistance} km`,
            ];
            statsItems.forEach((item, i) => {
                ctx.fillText(item, (60 + i * 220) * scale, statsY + 20 * scale);
            });
        }

        // Message
        if (config.message) {
            ctx.font = `italic ${18 * scale}px Georgia, serif`;
            ctx.fillStyle = '#6b5b3d';
            ctx.fillText(`"${config.message}"`, 60 * scale, 340 * scale);
        }

        // Day itinerary summary (bottom area)
        const dayY = config.message ? 390 * scale : 320 * scale;
        result.itinerary.slice(0, 5).forEach((day, i) => {
            ctx.font = `bold ${13 * scale}px Georgia, serif`;
            ctx.fillStyle = palette.accent;
            ctx.fillText(`Day ${day.day}`, 60 * scale, (dayY + i * 40 * scale));
            ctx.font = `${13 * scale}px Georgia, serif`;
            ctx.fillStyle = '#5d4037';
            const acts = (day.activities || []).map((a: any) => a.name).slice(0, 3).join(', ');
            ctx.fillText(`${day.city} — ${acts || 'Free day'}`, 130 * scale, (dayY + i * 40 * scale));
        });

        // QR Code
        if (config.showQR && config.shareUrl) {
            try {
                const qrDataUrl = await QRCode.toDataURL(config.shareUrl, { width: 100 * scale, margin: 1, color: { dark: palette.text, light: '#fdf6e300' } });
                const qrImg = new Image();
                await new Promise<void>((resolve) => {
                    qrImg.onload = () => resolve();
                    qrImg.src = qrDataUrl;
                });
                ctx.drawImage(qrImg, W - 160 * scale, H - 160 * scale, 110 * scale, 110 * scale);
                ctx.font = `${9 * scale}px Georgia, serif`;
                ctx.fillStyle = '#999';
                ctx.textAlign = 'center';
                ctx.fillText('Scan to view trip', W - 105 * scale, H - 40 * scale);
                ctx.textAlign = 'left';
            } catch { console.warn('QR code generation failed'); }
        }

        // Footer
        ctx.font = `${10 * scale}px Georgia, serif`;
        ctx.fillStyle = '#c0a080';
        ctx.textAlign = 'left';
        ctx.fillText(`Generated by Trip Planner ✨ • ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, 60 * scale, H - 35 * scale);
    }, [result, config, palette, cities, totalDays, totalCost, totalDistance, width, height]);

    const drawModern = useCallback(async (ctx: CanvasRenderingContext2D, scale: number) => {
        const W = width * scale;
        const H = height * scale;

        // Clean gradient background
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, palette.gradStart);
        bg.addColorStop(1, palette.gradEnd);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // White content card
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        roundRect(ctx, 40 * scale, 40 * scale, W - 80 * scale, H - 80 * scale, 24 * scale);
        ctx.fill();

        // Title — bold modern type
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 ${48 * scale}px 'Inter', 'Segoe UI', system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(config.title, 80 * scale, 120 * scale);

        // Subtitle: city route
        if (config.showRoute) {
            ctx.font = `300 ${20 * scale}px 'Inter', sans-serif`;
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillText(cities.join('  ·  '), 80 * scale, 160 * scale);
        }

        // Stats boxes
        if (config.showStats) {
            const boxW = 180 * scale;
            const boxH = 100 * scale;
            const startX = 80 * scale;
            const startY = 200 * scale;
            const gap = 24 * scale;

            const stats = [
                { label: 'DAYS', value: String(totalDays), emoji: '📅' },
                { label: 'CITIES', value: String(cities.length), emoji: '🏙️' },
                { label: 'BUDGET', value: `₹${(totalCost / 1000).toFixed(0)}K`, emoji: '💰' },
                { label: 'DISTANCE', value: `${totalDistance}km`, emoji: '🛣️' },
            ];

            stats.forEach((s, i) => {
                const x = startX + i * (boxW + gap);
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                roundRect(ctx, x, startY, boxW, boxH, 16 * scale);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${32 * scale}px 'Inter', sans-serif`;
                ctx.fillText(`${s.emoji} ${s.value}`, x + 16 * scale, startY + 45 * scale);
                ctx.font = `600 ${11 * scale}px 'Inter', sans-serif`;
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.fillText(s.label, x + 16 * scale, startY + 70 * scale);
                ctx.fillStyle = '#fff';
            });
        }

        // Message
        if (config.message) {
            ctx.font = `italic ${18 * scale}px 'Inter', sans-serif`;
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.fillText(`"${config.message}"`, 80 * scale, 370 * scale);
        }

        // Day pills
        const pillY = config.message ? 410 * scale : 370 * scale;
        result.itinerary.slice(0, 6).forEach((day, i) => {
            const px = 80 * scale + i * 170 * scale;
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            roundRect(ctx, px, pillY, 155 * scale, 60 * scale, 12 * scale);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = `800 ${11 * scale}px 'Inter', sans-serif`;
            ctx.fillText(`DAY ${day.day}`, px + 12 * scale, pillY + 22 * scale);
            ctx.fillStyle = '#fff';
            ctx.font = `600 ${14 * scale}px 'Inter', sans-serif`;
            ctx.fillText(day.city, px + 12 * scale, pillY + 45 * scale);
        });

        // QR
        if (config.showQR && config.shareUrl) {
            try {
                const qrDataUrl = await QRCode.toDataURL(config.shareUrl, { width: 90 * scale, margin: 1, color: { dark: '#ffffff', light: '#00000000' } });
                const qrImg = new Image();
                await new Promise<void>((resolve) => { qrImg.onload = () => resolve(); qrImg.src = qrDataUrl; });
                ctx.drawImage(qrImg, W - 150 * scale, H - 150 * scale, 100 * scale, 100 * scale);
            } catch { console.warn('QR code generation failed'); }
        }

        // Footer
        ctx.font = `300 ${10 * scale}px 'Inter', sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(`Trip Planner ✨ • ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, 80 * scale, H - 55 * scale);
    }, [result, config, palette, cities, totalDays, totalCost, totalDistance, width, height]);

    const drawColorful = useCallback(async (ctx: CanvasRenderingContext2D, scale: number) => {
        const W = width * scale;
        const H = height * scale;

        // Multi-stop gradient background
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, '#ff6b6b');
        bg.addColorStop(0.25, '#ffd93d');
        bg.addColorStop(0.5, '#6bcb77');
        bg.addColorStop(0.75, '#4d96ff');
        bg.addColorStop(1, '#9b59b6');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // Overlay for readability
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(0, 0, W, H);

        // Title with emojis
        ctx.fillStyle = '#fff';
        ctx.font = `900 ${44 * scale}px 'Inter', system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`✨ ${config.title} ✈️`, 60 * scale, 100 * scale);

        // Colorful city tags
        if (config.showRoute) {
            const emojis = ['📍', '🏛️', '🕌', '🏰', '🏖️', '⛰️', '🌆'];
            cities.forEach((city, i) => {
                const tx = 60 * scale + i * 180 * scale;
                roundRect(ctx, tx, 130 * scale, 165 * scale, 40 * scale, 20 * scale);
                const tagColors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#9b59b6', '#e74c3c', '#1abc9c'];
                ctx.fillStyle = tagColors[i % tagColors.length];
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${15 * scale}px 'Inter', sans-serif`;
                ctx.fillText(`${emojis[i % emojis.length]} ${city}`, tx + 12 * scale, 157 * scale);
            });
        }

        // Big stat numbers
        if (config.showStats) {
            const statsY = 220 * scale;
            const bigStats = [
                { emoji: '🗓️', value: `${totalDays}`, unit: 'DAYS' },
                { emoji: '🏙️', value: `${cities.length}`, unit: 'CITIES' },
                { emoji: '💸', value: `₹${(totalCost / 1000).toFixed(0)}K`, unit: 'BUDGET' },
                { emoji: '🚀', value: `${totalDistance}`, unit: 'KM' },
            ];
            bigStats.forEach((s, i) => {
                const sx = (60 + i * 260) * scale;
                ctx.fillStyle = '#fff';
                ctx.font = `900 ${50 * scale}px 'Inter', sans-serif`;
                ctx.fillText(`${s.emoji}${s.value}`, sx, statsY + 40 * scale);
                ctx.font = `700 ${12 * scale}px 'Inter', sans-serif`;
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.fillText(s.unit, sx + 4 * scale, statsY + 60 * scale);
            });
        }

        // Message
        if (config.message) {
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = `italic ${20 * scale}px 'Inter', sans-serif`;
            ctx.fillText(`💬 "${config.message}"`, 60 * scale, 370 * scale);
        }

        // Fun comparison
        const compY = config.message ? 420 * scale : 380 * scale;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = `600 ${15 * scale}px 'Inter', sans-serif`;
        ctx.fillText(`🗺️ ${getDistanceComparison(totalDistance)}`, 60 * scale, compY);

        // Day summary row
        const dayRow = compY + 40 * scale;
        result.itinerary.slice(0, 6).forEach((day, i) => {
            const dx = 60 * scale + i * 170 * scale;
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            roundRect(ctx, dx, dayRow, 155 * scale, 50 * scale, 10 * scale);
            ctx.fill();
            ctx.fillStyle = '#ffd93d';
            ctx.font = `bold ${12 * scale}px 'Inter', sans-serif`;
            ctx.fillText(`Day ${day.day}`, dx + 10 * scale, dayRow + 20 * scale);
            ctx.fillStyle = '#fff';
            ctx.font = `${13 * scale}px 'Inter', sans-serif`;
            ctx.fillText(day.city, dx + 10 * scale, dayRow + 40 * scale);
        });

        // QR
        if (config.showQR && config.shareUrl) {
            try {
                const qrDataUrl = await QRCode.toDataURL(config.shareUrl, { width: 90 * scale, margin: 1, color: { dark: '#ffffff', light: '#00000000' } });
                const qrImg = new Image();
                await new Promise<void>((resolve) => { qrImg.onload = () => resolve(); qrImg.src = qrDataUrl; });
                ctx.drawImage(qrImg, W - 140 * scale, H - 140 * scale, 90 * scale, 90 * scale);
            } catch { console.warn('QR code generation failed'); }
        }

        // Footer
        ctx.font = `300 ${10 * scale}px 'Inter', sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(`Trip Planner ✨ • ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, 60 * scale, H - 45 * scale);
    }, [result, config, cities, totalDays, totalCost, totalDistance, width, height]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const scale = 2; // 2x retina
        canvas.width = width * scale;
        canvas.height = height * scale;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const drawFn = config.template === 'classic' ? drawClassic : config.template === 'modern' ? drawModern : drawColorful;
        drawFn(ctx, scale).then(() => {
            onCanvasReady?.(canvas);
        });
    }, [config, result, drawClassic, drawModern, drawColorful, onCanvasReady, width, height]);

    return (
        <canvas
            ref={canvasRef}
            style={{ width, maxWidth: '100%', height: 'auto' }}
            className="rounded-xl shadow-lg"
        />
    );
};
