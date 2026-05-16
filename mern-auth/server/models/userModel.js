import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({    
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    verifyOTP: {
        type: String,
        default: ''
    },
    verifyOTPExpiryAt: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    resetPasswordOTP: {
        type: String,
        default: ''
    },
    resetPasswordOTPExpiryAt: {
        type: Number,
        default: 0
    }
});
const userModel = mongoose.models.User || mongoose.model('User', userSchema);
export default userModel;