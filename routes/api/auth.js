const express = require('express');
const auth = require('../../middleware/authentication');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const router = express.Router();

// @route: GET api/auth
// @description: validate token
// @access: Public
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error'); 
    }
});

// @route: GET api/auth
// @description: Authenticate user
// @access: Public
router.post('/', [
    check('email', 'Please include a valid email').isEmail(), 
    check('password', 'Password is required').exists()], async (req, res) => {
const errors = validationResult(req);
if(!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
}

// Destructor req.body and pull specified data fields
const { email, password } = req.body;

// Async
try {
    let user = await User.findOne({ email });
    // See if user exists
    if(!user) {
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }]});
    }

    // Ensure password is correct
    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }]});
    }

    // Return JWT
    const payload = {
        user: {
            id: user.id
        }
    }

    jwt.sign(payload, config.get('jwtSecret'), 
        { expiresIn: 36000000 }, // Change to 3600 later!!!
        (err, token) => {
            if(err) throw err;
            res.json({ token });
        });
} catch(err) {
    console.error(err.message);
    rest.status(500).send('Server Error');
}
});

module.exports = router;