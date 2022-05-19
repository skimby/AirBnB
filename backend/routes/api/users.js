const express = require('express');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User } = require('../../db/models');

//express validator imports
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

//express validator
const validateSignup = [
    check('email')
        .exists({ checkFalsy: true })
        .isEmail()
        .withMessage('Please provide a valid email.'),
    check('username')
        .exists({ checkFalsy: true })
        .isLength({ min: 4 })
        .withMessage('Please provide a username with at least 4 characters.'),
    check('username')
        .not()
        .isEmail()
        .withMessage('Username cannot be an email.'),
    check('password')
        .exists({ checkFalsy: true })
        .isLength({ min: 6 })
        .withMessage('Password must be 6 characters or more.'),
    handleValidationErrors
];

const router = express.Router();

// Sign up
router.post(
    '/', validateSignup,
    async (req, res) => {
        const { email, password, username } = req.body;
        const user = await User.signup({ email, username, password });

        await setTokenCookie(res, user);

        return res.json({
            user
        });
    }
);

// GET CURRENT USER
// GET /api/set-token-cookie
// const { setTokenCookie } = require('../../utils/auth.js');
// const { User } = require('../../db/models');

router.get('/set-token-cookie', async (_req, res) => {
    const user = await User.findOne({
        // attributes: { exclude: ['isHost', 'createdAt', 'updatedAt'] },
        where: {
            email: 'ladygaga@gmail.com'
        },

    });
    setTokenCookie(res, user);
    return res.json({ user });
});

// GET CURRENT USER
// GET /api/restore-user
const { restoreUser } = require('../../utils/auth.js');
router.get('/restore-user', restoreUser, (req, res) => {
    return res.json(req.user);
}
);

// GET CURRENT USER
// GET /api/require-auth
// const { requireAuth } = require('../../utils/auth.js');
router.get('/me', requireAuth, (req, res) => {
    //where is user coming from???
    const { id, firstName, lastName, email } = req.user;

    res.status(200);
    return res.json({
        id,
        firstName,
        lastName,
        email
    });
}
);

// LOGS IN USER


//checks the body of request's credentials and password
// const validateLogin = [
//     check('credential')
//         .exists({ checkFalsy: true })
//         .notEmpty()
//         .withMessage('Please provide a valid email.'),
//     check('password')
//         .exists({ checkFalsy: true })
//         .withMessage('Please provide a password.'),
//     handleValidationErrors
// ];


// LOG IN USER
// *** landing page is error screen.. how to remove?
router.post(
    '/login',
    async (req, res, next) => {
        const { credential, password } = req.body;

        const user = await User.login({ credential, password });

        if (!user) {
            const err = new Error('Login failed');
            err.status = 401;
            err.title = 'Login failed';
            err.errors = ['The provided credentials were invalid.'];
            return next(err);
        }

        await setTokenCookie(res, user);

        return res.json({
            user
        });
    }
);
//login attempt, if user with req credentials and password exists, then set the cookie token
// router.post('/login', validateLogin, async (req, res, next) => {
//     const { credential, password } = req.body;

//     const user = await User.login({ credential, password });

//     if (!user) {
//         const err = new Error('Login failed');
//         err.status = 401;
//         err.title = 'Login failed';
//         err.errors = ['The provided credentials were invalid.'];
//         return next(err);
//     }

//     await setTokenCookie(res, user);

//     return res.json({
//         user
//     })
// }
// )

module.exports = router;
