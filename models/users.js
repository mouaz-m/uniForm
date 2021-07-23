const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    telephonNumber: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        // required: true
    },
    dateOfBirth:{
        type: Date,
    },
    nationailty: {
        type: String,
    },
    degree: {
        type: String
    },
    updated: { 
        type: Date,
        default: Date.now 
    },
    attended: {
        type: Boolean,
        default: false
    },

})

const Product = mongoose.model('User', userSchema);

module.exports = Product;