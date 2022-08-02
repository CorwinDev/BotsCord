const mongoose = require("mongoose");
let hm = new mongoose.Schema({
    id: String,
    name: String,
    avatar: String,
    verified: Boolean,
    description: String,
    owner: String,
    long_description: String,
    banner: String,
});

module.exports = mongoose.model("bots", hm);