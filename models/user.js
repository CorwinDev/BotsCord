const mongoose = require("mongoose");
let model = new mongoose.Schema({
    id: String,
    biography: { type: String, default: null },
    coins: String,
    website: { type: String, default: null },
    github: { type: String, default: null },
    twitter: { type: String, default: null },
    instagram: { type: String, default: null }
});

module.exports = mongoose.model("profiles", model);