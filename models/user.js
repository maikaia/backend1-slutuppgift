const mongoose = require("mongoose")
const passportLocalMongoose = require("passport-local-mongoose")

const userSchema = new mongoose.Schema({
    email: {type: String},
    fullName: {type: String},
    profilePicture: {
        type: String,
        default: "/images/DefaultProfilePic.jpg"
    }
})
userSchema.plugin(passportLocalMongoose)

const User = mongoose.model("User", userSchema)

exports.User = User