module.exports = function(app, passport, db, ObjectID) {
  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get("/", function(req, res) {
    res.render("index.ejs");
  });

  //show the mediator app pg
  app.get("/mediatorapp", function(req, res) {
    res.render("mediatorapp.ejs");
  });

  // CLIENT LOG IN =========================
  app.get("/signup", function(req, res) {
    res.render("signup.ejs");
  });

  app.get("/generic", isLoggedIn, function(req, res) {
    if (req.user.mediator === false) {
      // the user IS NOT a mediator
      db.collection("clientRequest")
        .find({ email: req.user.local.email })
        .toArray((err, result) => {
          if (err) return console.log(err);
          res.render("generic.ejs", {
            user: req.user,
            messages: result
          });
        });
    } else {
      res.redirect("/elements");
    }
  });

  //CLIENT PAGE AFTER LOG IN =====

  app.get("/signup", isLoggedIn, function(req, res) {
    db.collection("clientRequest")
      .find()
      .toArray((err, result) => {
        if (err) return console.log(err);
        res.render("generic.ejs", {
          user: req.user,
          messages: result
        });
      });
  });

  //mediator after log in

  app.get("/signup", isLoggedIn, function(req, res) {
    db.collection("mediatorRequest")
      .find()
      .toArray((err, result) => {
        if (err) return console.log(err);
        res.render("elements.ejs", {
          user: req.user,
          messages: result
        });
      });
  });

  // LOGOUT ==============================
  app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
  });

  // message board routes ===============================================================

  app.post("/generic", (req, res) => {
    db.collection("clientRequest").save(
      {
        name: req.body.name,
        date: req.body.date,
        situation: req.body.situation,
        outcome: req.body.outcome,
        email: req.user.local.email,
        notes: req.body.notes,
        mediatorEmail: null
      },
      (err, result) => {
        if (err) return console.log(err);
        console.log("saved to database");
        res.redirect("/generic");
      }
    );
  });

  app.put("/generic", (req, res) => {
    return db.collection("clientRequest").findOneAndUpdate(
      {
        notes: req.body.notes
      },
      {
        $set: {
          notes: null
        }
      },
      (err, result) => {
        console.log("error", err);
        console.log("Result", res);
        if (err) return res.send(500, err);
        res.send("Message deleted!");
      }
    );
  });

  // MEDIATOR

  app.get("/elements", isLoggedIn, function(req, res) {
    db.collection("clientRequest")
      .find()
      .toArray((err, result) => {
        if (err) return console.log(err);
        res.render("elements.ejs", {
          user: req.user,
          messages: result
        });
      });
  });

  app.post("/acceptAppointment", (req, res) => {
    console.log("running accept appt", req.body.clientRequestId);
    db.collection("clientRequest").findOneAndUpdate(
      { _id: ObjectID(req.body.clientRequestId) },
      {
        $set: {
          accepted: true,
          mediatorEmail: req.user.local.email
        }
      },
      {
        sort: { _id: -1 }
      },
      (err, result) => {
        console.log("result from appointment update", result);
        if (err) return res.send(err);
        res.redirect("/elements");
      }
    );
  });

  app.put("/elements", (req, res) => {
    db.collection("mediatorRequest").findOneAndUpdate(
      { name: req.body.name, date: req.body.date, mednotes: req.body.mednotes },
      {
        $set: {
          thumbUp: req.body.thumbUp + 1
        }
      },
      {
        sort: { _id: -1 },
        upsert: true
      },
      (err, result) => {
        if (err) return res.send(err);
        res.send(result);
      }
    );
  });

  app.post("/mediatorapp", (req, res) => {
    console.log("request", req);
    return db.collection("mediatorAppRequest").insertOne(
      {
        fullname: req.body.fullname,
        resumelink: req.body.resumelink,
        whyzen: req.body.whyzen,
        hearabout: req.body.hearabout,
        phone: req.body.phone,
        appemail: req.body.appemail
      },
      {},
      (err, result) => {
        if (err) return res.send(err);
        console.log("error", err);
        console.log("result", res);
        res.redirect("/mediatorapp");
      }
    );
  });

  app.delete("/elements", (req, res) => {
    db.collection("mediatorRequest").findOneAndDelete(
      { name: req.body.name, date: req.body.date, mednotes: req.body.mednotes },
      (err, result) => {
        if (err) return res.send(500, err);
        res.send("Message deleted!");
      }
    );
  });

  app.post("/elements", (req, res) => {
    db.collection("clientRequest").save(
      {
        name: req.body.name,
        date: req.body.date,
        situaiton: req.body.situation,
        outcome: req.body.outcome
      },
      (err, result) => {
        if (err) return console.log(err);
        console.log("saved to database");
        res.redirect("/elements");
      }
    );
  });

  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================
  // =============================================================================

  // locally --------------------------------
  // LOGIN ===============================
  // show the login form
  app.get("/login", function(req, res) {
    res.render("login.ejs", { message: req.flash("loginMessage") });
  });

  // process the login form
  app.post(
    "/login",
    passport.authenticate("local-login", {
      successRedirect: "/generic", // redirect to the secure profile section
      failureRedirect: "/login", // redirect back to the signup page if there is an error
      failureFlash: true // allow flash messages
    })
  );

  // SIGNUP =================================
  // show the signup form
  app.get("/signup", function(req, res) {
    res.render("signup.ejs", { message: req.flash("signupMessage") });
  });

  // process the signup form
  app.post(
    "/signup",
    passport.authenticate("local-signup", {
      successRedirect: "/generic", // redirect to the secure profile section
      failureRedirect: "/signup", // redirect back to the signup page if there is an error
      failureFlash: true // allow flash messages
    })
  );

  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
  app.get("/unlink/local", isLoggedIn, function(req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.local.mediator = req.mediator;
    user.save(function(err) {
      res.redirect("/generic");
    });
  });
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();

  res.redirect("/");
}
