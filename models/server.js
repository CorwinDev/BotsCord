const mongoose = require("mongoose");
let hm = new mongoose.Schema({
    id: String,
    name: String,
    description: {
        type: String, maxLength: 100
    },
    owner: String,
    long_description: String,
    tags: [String],
    premium: Boolean,
    invite: String,
    votes: Number,
    bump: Date,
    webhook: String,
    bumps: Number,
});

module.exports = mongoose.model("servers", hm);