import mongoose, { Schema } from 'mongoose';

export interface IAuditLog {
    adminId: mongoose.Types.ObjectId;
    action: string;
    entity: string;
    entityId: string;
    details?: Record<string, any>;
    timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true }
});

AuditLogSchema.index({ entity: 1, timestamp: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
