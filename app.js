var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var qr = require("qrcode");
var nodeMailer = require('nodemailer');

const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override')

const passport = require('passport');
const localStrategy = require('passport-local');
const University = require('./models/university');


var moment = require('moment');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var universityRoutes = require('./routes/universities')
var mongoose=require('mongoose');

const User = require ('./models/users');
const Degree = require('./models/degree');
const { isLoggedIn } = require('./middleware');

mongoose.connect('mongodb://127.0.0.1:27017/k3ki', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
//mongoose.connect('mongodb+srv://mongoUser:lT5MKvYlPS8JaRGP@cluster0.mza4d.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



const sessionOptions = { 
  secret: 'k3ki', 
  resave: false, 
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};

app.use(session(sessionOptions));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(University.authenticate()));

passport.serializeUser(University.serializeUser());
passport.deserializeUser(University.deserializeUser());
app.use(flash());
app.use(methodOverride('_method'))

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
})



app.use('/', universityRoutes);
// app.use('/', indexRouter);
app.use('/users', usersRouter);



app.get('/tex', (req, res) => {
  res.redirect('/');
})

// POST request listener to convert the user id to qr code and mail it to the user
app.post("/scan", async (req, res) => {
  console.log(req.body);
    let newUser = new User(req.body);
    await newUser.save();

  const url =  "http://form.marifetedu.com/visitor/" + newUser._id.toString();

  // If the input is null return "Empty Data" error
  if (newUser.length === 0) res.send("Empty Data!");
  
  // Let us convert the input stored in the url and return it as a representation of the QR Code image contained in the Data URI(Uniform Resource Identifier)
  // It shall be returned as a png image format
  // In case of an error, it will save the error inside the "err" variable and display it
  //checking if there is an email

  if (req.body.email == ''){
    qr.toDataURL(url, (err, src) => {
      if (err) res.send("Error occured")

      app.set('src', src);
      res.render("visitor", { src });
    })
  } else {
    qr.toDataURL(url, (err, src) => {
      if (err) res.send("Error occured")

      app.set('src', src);

      res.render("visitor", { src });

      let transporter = nodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, //use ssl
        auth: {
            user: 'tex@marifetedu.com',
            pass: 'tdyglwdvbfiaroib'
        }
    });
    let mailOptions = {
        from: 'tex@marifetedu.com', // sender address
        to: req.body.email, // list of receivers
        subject: 'بطاقة معرض TEX', // Subject line
        text: 'Marifet', // plain text body
        html: '<h1> شكرا </h1> <p> لقد تم حجز مقعد لك في المعرض يرجى الاحتفاظ برمز ال QR من خلال صورة أو على بريدك الالكتروني</p> <br> <img src="' + src + '"> <br> <a href="'+ url +'">اضغط هنا لمشاهدت معلوماتك</a> ', // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log("Message sent: %s", info.messageId);

        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    });
  });
  }
});

// get for showing the sign up form
// post for registering the university 
// get login 
// post for login 
// log out route as well 

app.get('/visitor/:id', async(req, res) => {
  if(!req.isAuthenticated()){
  //if you are not logged in as a university show the qr code and simple message
  const { id } = req.params;
  const foundUser = await User.findById(id);
  const time = moment(foundUser.dateOfBirth);
  const dob = time.format("DD/MM/YYYY");
  const qrurl = "http://form.marifetedu.com/visitor/" + id.toString();
  qr.toDataURL(qrurl, (err, src) => {
    if (err) res.send("Error occured")
    res.render('visitor', {foundUser , dob, src});
  })
  } else {
  const { id } = req.params;
  const foundUser = await User.findById(id);
  const time = moment(foundUser.dateOfBirth);
  const dob = time.format("DD/MM/YYYY");
  const qrurl = "http://form.marifetedu.com/visitor/" + id.toString();
  qr.toDataURL(qrurl, (err, src) => {
    if (err) res.send("Error occured")
    res.render('info', {foundUser , dob, src});
  })
  }
  //else check which university saw this student and record that to the database
})


//===============
//degree routes
//===============

app.put("/user/:id", isLoggedIn, async(req, res) =>{
    await User.findByIdAndUpdate(req.params.id, (err, user) =>{
      if(err){
        res.send('error 1 ')
      } else {
        console.log(user);
        console.log(req.body.degree, req.user.id);
        const degreeCreatedName = req.body.degree;
        const degreeCreatedUsername = req.user.username;
        const degreeCreated = { degreeCreatedName, degreeCreatedUsername} ;
        console.log(degreeCreated);
        Degree.create(degreeCreated, (err, degreeCreated) =>{
          if(err){
            res.send('error 2')
          } else {
            user.degree.push(degreeCreated);
            user.save();
            res.redirect('/visitor/:id');
          }
        })
      }
    })
})


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

// Setting up the port for listening requests
const port = process.env.PORT || 5000;
app.listen(port, () => console.log("Server at 5000"));

//testing token


