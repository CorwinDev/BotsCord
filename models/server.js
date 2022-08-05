const mongoose = require("mongoose");
let hm = new mongoose.Schema({
    id: String,
    name: String,
    verified: Boolean,
    description: String,
    owner: String,
    long_description: String,
    style: String,
    tags: [String],
    premium: Boolean,
});

module.exports = mongoose.model("servers", hm);