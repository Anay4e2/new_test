import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupMember {
    userId?: mongoose.Types.ObjectId;
    email: string;
    name: string;
    role: 'owner' | 'editor' | 'viewer';
    status: 'invited' | 'accepted' | 'declined';
    invitedAt: Date;
    respondedAt?: Date;
}

export interface IGroupChat {
    userId: mongoose.Types.ObjectId;
    userName: string;
    message: string;
    timestamp: Date;
}

export interface IPollOption {
    text: string;
    votes: mongoose.Types.ObjectId[];
}

export interface IGroupPoll {
    question: string;
    options: IPollOption[];
    createdBy: mongoose.Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
}

export interface ITripGroup extends Document {
    tripId: mongoose.Types.ObjectId;
    ownerId: mongoose.Types.ObjectId;
    name: string;
    members: IGroupMember[];
    chat: IGroupChat[];
    polls: IGroupPoll[];
    maxMembers: number;
    createdAt: Date;
}

const GroupMemberSchema = new Schema<IGroupMember>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        email: { type: String, required: true, trim: true, lowercase: true },
        name: { type: String, required: true, trim: true },
        role: { type: String, enum: ['owner', 'editor', 'viewer'], required: true },
        status: { type: String, enum: ['invited', 'accepted', 'declined'], default: 'invited' },
        invitedAt: { type: Date, default: Date.now },
        respondedAt: { type: Date },
    },
    { _id: true }
);

const GroupChatSchema = new Schema<IGroupChat>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        userName: { type: String, required: true },
        message: { type: String, required: true, maxlength: 1000 },
        timestamp: { type: Date, default: Date.now },
    },
    { _id: true }
);

const PollOptionSchema = new Schema<IPollOption>(
    {
        text: { type: String, required: true },
        votes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    { _id: true }
);

const GroupPollSchema = new Schema<IGroupPoll>(
    {
        question: { type: String, required: true, maxlength: 500 },
        options: [PollOptionSchema],
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        isActive: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: true }
);

const TripGroupSchema = new Schema<ITripGroup>(
    {
        tripId: { type: Schema.Types.ObjectId, ref: 'SavedTrip', required: true },
        ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true, trim: true, maxlength: 200 },
        members: [GroupMemberSchema],
        chat: [GroupChatSchema],
        polls: [GroupPollSchema],
        maxMembers: { type: Number, default: 10, min: 2, max: 20 },
    },
    { timestamps: true }
);

TripGroupSchema.index({ ownerId: 1 });
TripGroupSchema.index({ 'members.userId': 1 });
TripGroupSchema.index({ 'members.email': 1 });

export default mongoose.model<ITripGroup>('TripGroup', TripGroupSchema);
