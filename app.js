/// express setup
const express = require("express");
const path = require("path");
const morgan = require("morgan");
const app = express();
app.use(express.static(path.join(__dirname, "public")));

//create express session
const expressSession = require("express-session")({
  secret: "secret",
  resave: false,
  saveUninitialized: false,
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(morgan("dev"));
app.use(expressSession);

//passport setup
const passport = require("passport");
app.use(passport.initialize());
app.use(passport.session());

// mongoose setup
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
mongoose.connect("mongodb://localhost:27017/loginSystem", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const Schema = mongoose.Schema;
const UserDetail = new Schema({
  username: String,
  password: String,
});

UserDetail.plugin(passportLocalMongoose);
const UserDetails = mongoose.model("userInfo", UserDetail, "userInfo");

/* PASSPORT LOCAL AUTHENTICATION */
passport.use(UserDetails.createStrategy());

passport.serializeUser(UserDetails.serializeUser());
passport.deserializeUser(UserDetails.deserializeUser());

/* ROUTES */

const connectEnsureLogin = require("connect-ensure-login");

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.redirect("/login?info=" + info);
    }

    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }

      return res.redirect("/");
    });
  })(req, res, next);
});

app.get("/login", (req, res) =>
  res.sendFile("html/login.html", { root: __dirname })
);

app.get("/", connectEnsureLogin.ensureLoggedIn(), (req, res) =>
  res.sendFile("html/index.html", { root: __dirname })
);

app.get("/private", connectEnsureLogin.ensureLoggedIn(), (req, res) =>
  res.sendFile("html/private.html", { root: __dirname })
);

app.get("/user", connectEnsureLogin.ensureLoggedIn(), (req, res) =>
  res.send({ user: req.user })
);
//logout
app.get("/logout", (req, res) => {
  req.logOut();
  res.redirect("/");
});

/* REGISTER SOME USERS */
//-------- This uses the passport-local-mongoose register method to salt the password for us. We just have to pass it in in plain text.
// UserDetails.register({ username: "paul", active: false }, "paul");
// UserDetails.register({ username: "jay", active: false }, "jay");
// UserDetails.register({ username: "roy", active: false }, "roy");

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Success connected to port ${port}`));
