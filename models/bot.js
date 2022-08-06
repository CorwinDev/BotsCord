const mongoose = require("mongoose");
let hm = new mongoose.Schema({
    id: String,
    name: String,
    icon: String,
    verified: Boolean,
    description: String,
    owner: String,
    long_description: String,
    banner: String,
    tags: [String],
    premium: Boolean,
});

module.exports = mongoose.model("bots", hm);