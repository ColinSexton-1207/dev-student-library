const mongoose = require('mongoose');
const schema = mongoose.Schema;

const postSchema = new schema({
    user: {
        type: schema.Types.ObjectId,
        ref: 'user'
    },
    text: {
        type: String,
        required: true
    },
    name: { // Name of user
        type: String,
    },
    avatar: {
        type: String
    },
    likes: [{
            user: {
            type: schema.Types.ObjectId,
            ref: 'user'
        }
    }],
    comments: [{
        user: {
            type: schema.Types.ObjectId,
            ref: 'user'
        },
        text: {
            type: String,
            required: true
        },
        avatar: {
            type: String
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = Post = mongoose.model('post', postSchema);