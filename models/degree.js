const mongoose = require('mongoose');
const Schema = mongoose.Schema;


var degreeSchema = new mongoose.Schema({
    text: String,
    author: String
});

module.exports = mongoose.model("Degree", degreeSchema);