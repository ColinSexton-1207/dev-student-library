const express = require('express');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');


const router = express.Router();

// Import user models
const User = require('../../models/User');

// @route: GET api/users
// @description: Register user
// @access: Public
router.post('/', [
        check('name', 'Name is required').notEmpty(), 
        check('email', 'Please include a valid email').isEmail(), 
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Destructor req.body and pull specified data fields
    const { name, email, password } = req.body;

    // Async
    try {
        let user = await User.findOne({ email });
        // See if user exists
        if(user) {
            return res.status(400).json({ errors: [{ msg: 'User already exists' }]});
        }

        // Get user gravatar
        const avatar = gravatar.url(email, {
            s: '200', // default size
            r: 'pg', // rating
            d: 'mm' // default image
        });

        user = new User({ // Creates a new instance of user, does not save it
            name,
            email,
            avatar,
            password
        });

        // Encrypt password (bcrypt)
        const salt = await bcrypt.genSalt(10); // Hash salt (recommended 10)

        user.password = await bcrypt.hash(password, salt); // Creates the hash to encrypy plaintext password
    
        await user.save(); // Saves user to database

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