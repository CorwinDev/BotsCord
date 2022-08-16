const mongoose = require("mongoose");
let model = new mongoose.Schema({
    id: String,
    biography: { type: String, default: null },
    coins: String,
    website: String,
    github: String,
    twitter:String ,
    instagram: String
});

module.exports = mongoose.model("profiles", model);