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
    votes: { type: Number, default: 0 },
    bump: Date,
    webhook: String,
    bumps: { type: Number, default: 0 },
    analytics: Object,
    analytics_visitors: Number,
    analytics_joins: Number,
    country: Object,
    vanity: String,
});

module.exports = mongoose.model("servers", hm);