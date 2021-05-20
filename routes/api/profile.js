const express = require('express');
const auth = require('../../middleware/authentication');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const request = require('request');
const config = require('config');
const { check, validationResult } = require('express-validator');

const router = express.Router();

// @route: GET api/profile/me
// @description: Get current users profile
// @access: Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

    if (!profile) {
        return res.status(400).json({ msg: 'There is no profile for this user' });
    }
  
    res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
  });

// @route: POST api/profile
// @description: Create/Update user profile
// @access: Private
router.post('/', auth,
        check('status', 'Status is required').notEmpty(),
        check('skills', 'Skills is required').notEmpty(),
        async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Destructor from Profile to req.body
    const {
        school,
        website,
        location,
        status,
        skills,
        bio,
        githubusername,
        youtube,
        twitter,
        facebook,
        linkedin,
    } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if(school) profileFields.school = school;
    if(website) profileFields.website = website;
    if(location) profileFields.location = location;
    if(status) profileFields.status = status;
    if(bio) profileFields.bio = bio;
    if(githubusername) profileFields.githubusername = githubusername;
    if(skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim()); // Converts string to array, seperate by ',' and trims the spaces from data fields
    }

    // Build socialmedia object
    profileFields.social = {};
    if(youtube) profileFields.social.youtube = youtube;
    if(twitter) profileFields.social.twitter = twitter;
    if(facebook) profileFields.social.facebook = facebook;
    if(linkedin) profileFields.social.linkedin = linkedin;
    
    try {
        let profile = await Profile.findOne({ user: req.user.id });
        if(profile) {
            // Update
            profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });

            return res.json(profile);
        }

        // Create
        profile = new Profile(profileFields);
        await profile.save();

        return res.json(profile);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route: GET api/profile
// @description: Get all profiles
// @access: Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch(err) {
        console.error(err.message);
        res.status(500).send({ msg: 'Server error' });
    }
});

// @route: GET api/profile/user/:user_id
// @description: Get profile by user ID
// @access: Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
        if(!profile) return res.status(400).json({ msg: 'Profile Not Found'});
        res.json(profile);
    } catch(err) {
        console.error(err.message);

        if(err.kind === 'ObjectId') return res.status(400).json({ msg: 'Profile Not Found'}); // Prevents invalid userID from display Server Error message by mistakes

        res.status(500).send({ msg: 'Server error' });
    }
});

// @route: DELETE api/profile
// @description: Delete profile, users, and posts
// @access: Private
router.delete('/', auth, async (req, res) => {
    try {
    //TODO: Remove user posts
        // Remove profile & user
        await Profile.findOneAndRemove({ user: req.user.id });
        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: 'User Deleted '});
    } catch(err) {
        console.error(err.message);
        res.status(500).send({ msg: 'Server error' });
    }
});

// @route: PUT api/profile/experience
// @description: Add profile experience
// @access: Private
router.put('/experience', auth,
        check('title', 'Title is required').notEmpty(),
        check('company', 'Company is required').notEmpty(),
        check('from', 'From Date is required').notEmpty(),
        async (req, res) => {
    const errors = validationResult(req);
    if(!errors) return rest.status(400).json({ errors: errors.array() });

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    };

    try {
        const profile = await Profile.findOne({ user: req.user.id });
        profile.experience.unshift(newExp); // Push newest experience to the front of the array/stack
        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ msg: 'Server Error' });
    }
});

// @route: POST api/profile/experience
// @description: Create/Update user experience
// @access: Private
router.post('/experience', auth,
        check('title', 'Title is required').notEmpty(),
        check('company', 'Company is required').notEmpty(),
        check('from', 'From Date is required').notEmpty(),
        async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    // Build socialmedia object
    const profileFields = {};
    profileFields.experience = {};
    profileFields.user = req.user.id;
    if(title) profileFields.experience.title = title;
    if(company) profileFields.experience.company = company;
    if(location) profileFields.experience.location = location;
    if(from) profileFields.experience.from = from;
    if(to) profileFields.experience.to = to;
    if(current) profileFields.experience.current = current;
    if(description) profileFields.experience.description = description;
    
    try {
        let profile = await Profile.findOne({ user: req.user.id });
        if(profile) {
            // Update
            profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });

            return res.json(profile);
        }

        // Create
        profile = new Profile(profileFields);
        await profile.save();

        return res.json(profile);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route: DELETE api/profile/experience/:exp_id
// @description: Delete profile experience
// @access: Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        // Get remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);

        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ msg: 'Server Error' });
    }
});

// @route: PUT api/profile/education
// @description: Add profile education
// @access: Private
router.put('/education', auth,
        check('school', 'School is required').notEmpty(),
        check('degree', 'Degree is required').notEmpty(),
        check('fieldofstudy', 'Field of Study is required').notEmpty(),
        check('from', 'From Date is required').notEmpty(),
        async (req, res) => {
    const errors = validationResult(req);
    if(!errors) return rest.status(400).json({ errors: errors.array() });

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    };

    try {
        const profile = await Profile.findOne({ user: req.user.id });
        profile.education.unshift(newEdu); // Push newest experience to the front of the array/stack
        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ msg: 'Server Error' });
    }
});

// @route: POST api/profile/education
// @description: Create/Update user education
// @access: Private
router.post('/education', auth,
        check('school', 'School is required').notEmpty(),
        check('degree', 'Degree is required').notEmpty(),
        check('fieldofstudy', 'Field of Study is required').notEmpty(),
        check('from', 'From Date is required').notEmpty(),
        async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    // Build socialmedia object
    const profileFields = {};
    profileFields.education = {};
    profileFields.user = req.user.id;
    if(school) profileFields.education.school = school;
    if(degree) profileFields.education.degree = degree;
    if(fieldofstudy) profileFields.education.fieldofstudy = fieldofstudy;
    if(from) profileFields.education.from = from;
    if(to) profileFields.education.to = to;
    if(current) profileFields.education.current = current;
    if(description) profileFields.education.description = description;
    
    try {
        let profile = await Profile.findOne({ user: req.user.id });
        if(profile) {
            // Update
            profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });

            return res.json(profile);
        }

        // Create
        profile = new Profile(profileFields);
        await profile.save();

        return res.json(profile);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route: DELETE api/profile/education/:edu_id
// @description: Delete profile education
// @access: Private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        // Get remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
        profile.education.splice(removeIndex, 1);

        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ msg: 'Server Error' });
    }
});

// @route: GET api/profile/github/:username
// @description: Get user Repos from Github
// @access: Public
router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecretId')}`,
            method: 'Get',
            headers: { 'user-agent' : 'node.js' }
        };

        request(options, (error, response, body) => {
            if(error) console.error(error);
            if(response.statusCode != 200) return res.status(404).json({ msg: 'No Github Profile Found' });

            res.json(JSON.parse(body));
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ msg: 'Server Error' });
    }
})

module.exports = router;