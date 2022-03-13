const express = require("express");
const mongoose = require("mongoose")
const passport = require("passport")
const session = require("express-session")
const multer = require("multer")
const path = require("path")
const MongoStore = require("connect-mongo")

const { User } = require("./models/user")
const { Post } = require("./models/post")

const { ensureLoggedIn } = require("connect-ensure-login")

const app = express()

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use(express.urlencoded({extended: true}))
app.use(session({
    secret: "avsd1234",
    resave: false,
    saveUninitialized: false
}))
app.use(passport.authenticate("session"))

const PORT = 3000;

app.get("/signup", (req, res) => {
    res.render("signup.ejs")
})

app.post("/signup", async (req, res) => {
    const {username, password} = req.body
    const user = new User({username})
    await user.setPassword(password)
    await user.save()
    // console.log(req.body)
    res.redirect("/login")
})

app.get("/login", (req, res) => {
    res.render("login.ejs")
})

app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login"
}))

app.get("/logout", (req, res) => {
    req.logout()
    res.redirect("/login")
})

app.get("/", async (req, res) => {
    if (req.user) {
        const posts = await Post.find({}).populate("user").sort({postTime: -1})
        res.render("index.ejs", {posts})
    } else {
        res.redirect("/login")
    }
})

app.use(ensureLoggedIn("/login"))

app.post("/", async (req, res) => {
    const { title, content } = req.body
    const post = new Post({ 
        title,
        content,
        user: req.user
    })
    await post.save()
    res.redirect("/")
})

app.get("/mypage", async (req, res) => {
    const user = req.user
    const posts = await Post.find({user: user._id}).populate("user").sort({postTime: -1})
    res.render("myPage.ejs", {user, posts})
})

app.post("/mypage", (req, res) => {
    upload(req, res, async (err) => {
        if(err) {
            res.render("myPage.ejs", {
                msg: `Error: ${err}`,
                user: req.user
            })
        } else {
            if(req.file == undefined) {
                res.render("myPage.ejs", {
                    msg: "Error: Please select a file!",
                    user: req.user
                })
            } else {
                const user = await User.findOne({_id: req.user._id})
                user.profilePicture = `/images/${req.file.filename}`
                await user.save()
                res.render("myPage.ejs", {
                    msg: "File uploaded!",
                    user: req.user
                    
                })
            }
        }
    })
})

mongoose.connect("mongodb://localhost/slutuppgift")

app.listen(PORT, () => {
  console.log(`Started Express server on port ${PORT}`);
});