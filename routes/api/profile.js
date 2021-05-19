const express = require('express');

const router = express.Router();

// @route: GET api/users
// @description: test route
// @access: public
router.get('/', (req, res) => res.send('Profile route'));

module.exports = router;