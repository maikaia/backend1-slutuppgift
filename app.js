// npm install passport express-session mongoose express ejs passport-local passport-local-mongoose
const express = require("express");
const mongoose = require("mongoose")
const passport = require("passport")
const session = require("express-session")

const { User } = require("./models/user")

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

app.get("/", (req, res) => {
    if (req.user) {
        res.render("index.ejs", {username: req.user.username})
    } else {
        res.redirect("/login")
    }
})

app.get("/logout", (req, res) => {
    req.logout()
    res.redirect("/")
})

app.get("/login", (req, res) => {
    res.render("login.ejs")
})

app.post("/login", passport.authenticate("local", {
    successRedirect: "/"
}))

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

mongoose.connect("mongodb://localhost/slutuppgift")

app.listen(PORT, () => {
  console.log(`Started Express server on port ${PORT}`);
});