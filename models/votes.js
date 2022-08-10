const mongoose = require("mongoose");
let model = new mongoose.Schema({
    user: String,
    date: Date,
    bot: String,
    server: String
});

module.exports = mongoose.model("votes", model);