import mongoose, { Schema, Document } from 'mongoose';

export type ItineraryRequestType = 'add_activity' | 'remove_activity' | 'change_hotel' | 'change_date' | 'modify_route' | 'custom';
export type ItineraryRequestStatus = 'pending' | 'approved' | 'rejected';

export interface IRequestVote {
    userId: mongoose.Types.ObjectId;
    vote: 'approve' | 'reject';
    votedAt: Date;
}

export interface IGroupItineraryRequest extends Document {
    groupId: mongoose.Types.ObjectId;
    requesterId: mongoose.Types.ObjectId;
    requesterName: string;
    type: ItineraryRequestType;
    title: string;
    description: string;
    dayNumber?: number;
    proposedChanges?: Record<string, any>;
    status: ItineraryRequestStatus;
    votes: IRequestVote[];
    resolvedBy?: mongoose.Types.ObjectId;
    resolvedAt?: Date;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const RequestVoteSchema = new Schema<IRequestVote>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        vote: { type: String, enum: ['approve', 'reject'], required: true },
        votedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const GroupItineraryRequestSchema = new Schema<IGroupItineraryRequest>(
    {
        groupId: { type: Schema.Types.ObjectId, ref: 'TripGroup', required: true, index: true },
        requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        requesterName: { type: String, required: true, trim: true },
        type: {
            type: String,
            enum: ['add_activity', 'remove_activity', 'change_hotel', 'change_date', 'modify_route', 'custom'],
            required: true,
        },
        title: { type: String, required: true, trim: true, maxlength: 200 },
        description: { type: String, required: true, trim: true, maxlength: 1000 },
        dayNumber: { type: Number, min: 1 },
        proposedChanges: { type: Schema.Types.Mixed },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        votes: [RequestVoteSchema],
        resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        resolvedAt: { type: Date },
        rejectionReason: { type: String, trim: true, maxlength: 500 },
    },
    { timestamps: true }
);

GroupItineraryRequestSchema.index({ groupId: 1, status: 1, createdAt: -1 });

export default mongoose.model<IGroupItineraryRequest>('GroupItineraryRequest', GroupItineraryRequestSchema);
