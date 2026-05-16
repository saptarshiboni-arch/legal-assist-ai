import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const existingUser = await userModel.findOne({ 
            $or: [{ email }, { username: name }] 
        });

        if (existingUser) {
            const message = existingUser.email === email ? 'Email already in use' : 'Username already in use';
            return res.status(400).json({ success: false, message });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new userModel({ username: name, email, password: hashedPassword });
        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Send welcome email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to Our Website!',
            text: `Hi ${name},\n\nThank you for registering on our website! We're excited to have you on board.\n\nBest regards,\nTeam ELLITE`
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log('Welcome email sent successfully');
        } catch (error) {
            console.error('Error sending welcome email:', error);
        }

        return res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({ success: true, message: 'Login successful' });

    } catch (error) {
        console.error('Error logging in user:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const logout = (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
        return res.status(200).json({ success: true, message: 'Logout successful' });
    } catch (error) {
        console.error('Error logging out user:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

//send verification otp to email
export const sendVerifyEmail = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId);

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'Account already verified' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.verifyOTP = otp;
        user.verifyOTPExpiryAt = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
        await user.save();
        
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Your Account Verification OTP',
            text: `Hi ${user.username},\n\nYour OTP for account verification is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nBest regards,\nTeam ELLITE`
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: 'Verification email sent' });
        
    } catch (error) {
        console.error('Error sending verification email:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

   //verify email with otp
   export const verifyAccount = async (req, res) => {
    const {otp} = req.body;
    const userId = req.userId;
    
    if (!userId || !otp) {
        return res.status(400).json({ success: false, message: 'User ID and OTP are required' });
    }
    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'Account already verified' });
        }

        if (user.verifyOTP !== otp || user.verifyOTPExpiryAt < Date.now() || user.verifyOTP === '') {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.verifyOTP = '';
        user.verifyOTPExpiryAt = 0;
        await user.save();

        return res.status(200).json({ success: true, message: 'Account verified successfully' });

    } catch (error) {
        console.error('Error verifying account:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

//check if user is authenticated or not
export const isauthenticated = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ success: true, message: 'User is authenticated' });

    } catch (error) {
        console.error('Error checking authentication:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

//send password reset otp to email
export const sendResetPasswordOtp = async (req, res) => {
    try {
        const {email} = req.body;
        const user = await userModel.findOne({email});
        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpiryAt = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
        await user.save();
        
        const mailOptions = {   
            from: process.env.SENDER_EMAIL,         
            to: user.email,
            subject: 'Your Password Reset OTP',
            text: `Hi ${user.username},\n\nYour OTP for password reset is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nBest regards,\nTeam ELLITE`
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: 'Password reset email and otp sent' });
        
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

//reset password with otp
export const resetPassword = async (req, res) => {
    const {email, otp, newPassword} = req.body;
    
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: 'Email, OTP and new password are required' });
    }
    try {
        const user = await userModel.findOne({email});
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.resetPasswordOTP !== otp || user.resetPasswordOTPExpiryAt < Date.now() || user.resetPasswordOTP === '') {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordOTP = '';
        user.resetPasswordOTPExpiryAt = 0;
        await user.save();

        return res.status(200).json({ success: true, message: 'Password reset successfully' });

    } catch (error) {
        console.error('Error resetting password:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}


   