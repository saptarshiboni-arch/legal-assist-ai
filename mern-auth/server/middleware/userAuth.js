import jwt from 'jsonwebtoken';

const userAuth = (req, res, next) => {
    const {token} = req.cookies;
    if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized login required' });
    }
    
    try {
        const tokenDecoded = jwt.verify(token, process.env.JWT_SECRET);
        if(tokenDecoded.userId){  
            req.userId = tokenDecoded.userId;
        }
        else{ 
            return res.status(401).json({ success: false, message: 'Unauthorized login required' });
        }

        next();
        
    } catch (error) {
        console.error('Error authenticating user:', error);
        return res.status(401).json({ success: false, message: 'Unauthorized login required' });
    }
};

export default userAuth;