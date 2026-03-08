import mongoose, { Schema, Document, HydratedDocument } from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export interface IUser {
    name: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    avatar?: string;
    interests?: string[];
    provider?: string;
    providerId?: string;
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
    createdAt: Date;
}

export interface IUserMethods {
    comparePassword(candidatePassword: string): Promise<boolean>;
    getResetPasswordToken(): string;
}

export type UserDocument = HydratedDocument<IUser, IUserMethods>;

const UserSchema = new Schema<IUser, mongoose.Model<IUser, {}, IUserMethods>, IUserMethods>({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    password: {
        type: String,
        required: [function(this: any) { return !this.provider; }, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        validate: {
            validator: function (this: any, v: string) {
                if (this.provider) return true;
                return /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v);
            },
            message: 'Password must contain at least one uppercase letter, one lowercase letter, and one digit'
        },
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    avatar: {
        type: String,
        trim: true,
    },
    interests: [{
        type: String,
        trim: true,
    }],
    resetPasswordToken: {
        type: String,
        select: false
    },
    resetPasswordExpire: {
        type: Date,
        select: false
    },
    provider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    providerId: {
        type: String,
        select: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Generate and hash password reset token
UserSchema.methods.getResetPasswordToken = function (): string {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    return resetToken;
};

const User = mongoose.model<IUser, mongoose.Model<IUser, {}, IUserMethods>>('User', UserSchema);

export default User;
