const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    dateOfBirth:{
        type: Date,
        required: true
    },
    telephonNumber: {
        type: Number,
        required: true
    },
    attended: {
        type: Boolean,
        default: false
    },
    updated: { 
        type: Date,
        default: Date.now 
    },

})

const Product = mongoose.model('User', userSchema);

module.exports = Product;