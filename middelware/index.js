const jwt = require('jsonwebtoken');
const User = require('../models/userschema');

const authPost = async (req, res, next) => {
    try {
        const { authorization = '' } = req.headers;
        const [bearer, token] = authorization.split(' ');

        if (!authorization || !token) {
            return res.status(401).send('Invalid Token');
        }
        const verifyToken = jwt.verify(token, 'WEFYUGWEFUWEFWEGYFWEFYWGEFIYWEF');
               // ✅ Use findById
        const user = await User.findById(verifyToken.id);
        if (!user) {
            return res.status(401).send('User Not Found');
        }
        req.user = user;
        next();

    } catch (error) {
        console.error("Auth Error:", error);
        return res.status(401).send('Invalid Token');
    }
};

module.exports = authPost;
