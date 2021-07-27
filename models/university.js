const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UniversitySchema = new Schema ({
    email: {
        type: String
    }
});

UniversitySchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('University', UniversitySchema); 