const express = require('express');
const auth = require('../../middleware/authentication');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');

const router = express.Router();

// @route: POST api/post
// @description: Create a post
// @access: Private
router.post('/', auth, 
        check('text', 'Please enter text').notEmpty(),
        async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const user = await User.findById(req.user.id).select('-password');

        const newPost = new Post ({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        });

        const post = await newPost.save();

        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route: PUT api/post/edit-post/:id
// @description: Edit a post
// @access: Private
router.put('/edit-post/:id/:post_id', auth,
        check('text', 'Please enter text').notEmpty(),
        async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const post = await Post.findById(req.params.id);
        if(!post) return res.status(404).json({ msg: 'Post not found' });
    
        // Check that user is deleting their own posts only
        if(post.user.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized '});

        const editPost = {
            text: req.body.text
        };

        const updatePost = await Post.findOneAndUpdate({ user: req.user.id }, { post_id: req.params.id }, { $set: editPost }, { new: true });

        await post.save(updatePost);
        return res.json(updatePost);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route: GET api/posts
// @description: Get all posts
// @access: Private
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 }); // -1 = most recent, 1 = oldest

        res.json(posts);
    } catch(err) {
        console.error(err.message);
        res.status(500).send({ msg: 'Server error' });
    }
});

// @route: GET api/posts/:id
// @description: Get user posts
// @access: Private
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post) return res.status(404).json({ msg: 'Post not found' });

        res.json(post);
    } catch(err) {
        console.error(err.message);

        if(err.kind === 'ObjectId') return res.status(400).json({ msg: 'Post Not Found'}); // Prevents invalid userID from display Server Error message by mistakes

        res.status(500).send({ msg: 'Server error' });
    }
});

// @route: DELETE api/posts/:id
// @description: Delete user post
// @access: Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post) return res.status(404).json({ msg: 'Post not found' });
    
        // Check that user is deleting their own posts only
        if(post.user.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized '});
        await post.remove();

        res.json({ msg: 'Post Removed' });
    } catch(err) {
        console.error(err.message);

        if(err.kind === 'ObjectId') return res.status(400).json({ msg: 'Post Not Found'}); // Prevents invalid userID from display Server Error message by mistakes
        
        res.status(500).send({ msg: 'Server error' });
    }
});

// @route: PUT api/posts/like/:id
// @description: Like a post
// @access: Private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        // Check is post has been liked by user
        if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) return res.status(400).json({ msg: 'Post already liked' });

        post.likes.unshift({ user: req.user.id });

        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);

        if(err.kind === 'ObjectId') return res.status(400).json({ msg: 'Post Not Found'}); // Prevents invalid userID from display Server Error message by mistakes
        
        res.status(500).send({ msg: 'Server error' });
    }
});

// @route: PUT api/posts/unlike/:id
// @description: Unlike a post
// @access: Private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        // Check is post has been liked by user
        if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) return res.status(400).json({ msg: 'Post has not been liked' });

        // Get remove index
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
        post.likes.splice(removeIndex, 1);

        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);

        if(err.kind === 'ObjectId') return res.status(400).json({ msg: 'Post Not Found'}); // Prevents invalid userID from display Server Error message by mistakes
        
        res.status(500).send({ msg: 'Server error' });
    }
});

// @route: POST api/post/comment/:id
// @description: Create a comment on a post 
// @access: Private
router.post('/comment/:id', auth, 
        check('text', 'Please enter text').notEmpty(),
        async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);

        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        };

        post.comments.unshift(newComment);

        await post.save();

        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route: PUT api/post/edit-comment/:id
// @description: Edit a comment
// @access: Private
router.put('/edit-comment/:id/:comment_id', auth,
        check('text', 'Please enter text').notEmpty(),
        async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const post = await Post.findById(req.params.id);
        if(!post) return res.status(404).json({ msg: 'Post not found' });
    
        // Pull out comment from post
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);
        if(!comment) return res.status(404).json({ msg: 'Comment does not exist' });

        // Check that user is deleting their own posts only
        if(post.user.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized '});

        const editComment = {
            text: req.body.text
        };

        const updateComment = await Post.findOneAndUpdate({ user: req.user.id }, { comment: req.params.comment_id }, { $set: editComment }, { new: true });

        await post.save(updateComment);
        return res.json(updateComment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route: DELETE api/post/comment/:id/:comment_id
// @description: Delete a comment on a post 
// @access: Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        // Pull out comment from post
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);
        if(!comment) return res.status(404).json({ msg: 'Comment does not exist' });

        // Check user (original commenter, or OP)
        if(comment.user.toString() !== req.user.id || post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        post.comments = post.comments.filter(id => id !== req.params.comment_id);

        await post.save();
        res.json(post.comments);
    } catch (err) {
        console.error(err.message);

        if(err.kind === 'ObjectId') return res.status(400).json({ msg: 'Comment Not Found'}); // Prevents invalid userID from display Server Error message by mistakes
        
        res.status(500).send({ msg: 'Server error' });
    }
});

module.exports = router;