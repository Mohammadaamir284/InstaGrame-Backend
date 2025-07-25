const mongoose = require('mongoose')

const contactSchema = new mongoose.Schema({
    adminFollow: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    userFollowed: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
})

module.exports = mongoose.model('Contact', contactSchema);