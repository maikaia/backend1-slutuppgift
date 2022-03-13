require("dotenv").config()
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
const PORT = 3000;
const MONGO_URL = process.env.MONGO_URL
const SESSION_SECRET = process.env.SESSION_SECRET

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use(express.urlencoded({extended: true}))
app.use(express.static("./uploads"))
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({mongoUrl: MONGO_URL})
}))
app.use(passport.authenticate("session"))


const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "./uploads/images/")
    },
    filename: (req, file, callback) => {
        console.log(req.user)
        callback(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({ 
    storage: storage,
    limits: {fileSize: 2000000}
}).single("profilePicture")

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
        const posts = await Post.find({}).populate("user").sort({postTime: -1})
        res.render("index.ejs", {posts})
})

app.get("/users/:username", async (req, res) => {
    const user = await User.findOne({username: req.params.username})
    const posts = await Post.find({user: user._id}).populate("user").sort({postTime: -1})
    res.render("profile.ejs", {posts, user})
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

mongoose.connect(MONGO_URL)

app.listen(PORT, () => {
  console.log(`Started Express server on port ${PORT}`);
});