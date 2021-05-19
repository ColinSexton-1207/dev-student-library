const mongoose = require('mongoose'); // DB helper framework
const config = require('config'); // Bring in config module for DB string
const db = config.get('mongoURI'); // Get value of DB connection string

const connectDB = async () => {
    try {
        await mongoose.connect(db, {useNewUrlParser: true, useCreateIndex: true});
        console.log('MongoDB Connected...');
    } catch(err) {
        console.error(err.message);
        // Exit process w/ failure
        process.exit(1);
    }
}

module.exports = connectDB;