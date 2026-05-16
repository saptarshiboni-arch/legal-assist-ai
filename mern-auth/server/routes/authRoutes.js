import express from 'express';
import { isauthenticated, register, loginUser, logout, sendVerifyEmail, verifyAccount, sendResetPasswordOtp, resetPassword } from '../controllers/authcontroller.js';
import userAuth from '../middleware/userAuth.js';

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', loginUser);
authRouter.post('/logout', logout);
authRouter.post('/send-verify-otp', userAuth, sendVerifyEmail);
authRouter.post('/verify-account', userAuth, verifyAccount);
authRouter.get('/is-authenticated', userAuth, isauthenticated);
authRouter.post('/send-reset-password-otp', sendResetPasswordOtp);
authRouter.post('/reset-password', resetPassword);

export default authRouter;