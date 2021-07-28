const mongoose = require('mongoose');
const University = require('./university')
const Schema = mongoose.Schema;


var degreeSchema = new Schema({
    text: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'University'
    }
});

module.exports = mongoose.model("Degree", degreeSchema);