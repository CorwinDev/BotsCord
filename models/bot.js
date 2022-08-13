const mongoose = require("mongoose");
let hm = new mongoose.Schema({
    id: String,
    name: String,
    icon: String,
    verified: Boolean,
    description: String,
    owners: [String],
    long_description: String,
    banner: String,
    tags: [String],
    premium: Boolean,
    servers: String,
    users: String,
    votes: { type: Number, default: 0 },
    token: String,
});

module.exports = mongoose.model("bots", hm);