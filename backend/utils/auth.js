const jwt = require('jsonwebtoken');
const { jwtConfig } = require('../config');
const { User } = require('../db/models');

const { secret, expiresIn } = jwtConfig;


//Send a JWT cookie
const setTokenCookie = (res, user) => {
    // Create the token.
    const token = jwt.sign(
        { data: user.toSafeObject() },
        secret,
        { expiresIn: parseInt(expiresIn) } // 604,800 seconds = 1 week
    );


    const isProduction = process.env.NODE_ENV === "production";

    //set the token cookie
    res.cookie('token', token, {
        maxAge: expiresIn * 1000,
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction && 'Lax'
    })

    return token;
}

//restores user after authenticating identify of current uster
const restoreUser = (req, res, next) => {
    // token parsed from cookies
    const { token } = req.cookies;

    // console.log('sucess')
    return jwt.verify(token, secret, null, async (err, jwtPayload) => {
        if (err) {
            return next();
        }

        try {
            const { id } = jwtPayload.data;
            req.user = await User.scope('currentUser').findByPk(id);
        } catch (e) {
            res.clearCookie('token');

            return next();
        }

        if (!req.user) res.clearCookie('token');

        return next();
    });
};

//requires session user to be authenticated before accessing a route
const requireAuth = [
    restoreUser,
    function (req, _res, next) {
        if (req.user) return next();
        const err = new Error("Authentication required");
        err.message = "Authentication required";
        // err.errors = ['Unauthorized'];
        err.status = 401;
        return next(err);

        // const err = new Error('Unauthorized');
        // err.title = 'Unauthorized';
        // err.errors = ['Unauthorized'];
        // err.status = 401;
        // return next(err);
    }
];


module.exports = { setTokenCookie, restoreUser, requireAuth };
