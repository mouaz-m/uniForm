var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var qr = require("qrcode");
var nodeMailer = require('nodemailer');

const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const fs = require('fs');
// canvas setup
const { createCanvas, loadImage } = require('canvas')


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

// mongoose.connect('mongodb://127.0.0.1:27017/k3ki', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
mongoose.connect('mongodb+srv://mongoUser:lT5MKvYlPS8JaRGP@cluster0.mza4d.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

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
  if (String(req.params.id).match(/^[0-9a-fA-F]{24}$/)) {
    // Yes, it's a valid ObjectId, proceed with `findById` call.
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
      //else check which university saw this student and record that to the database and render the info so the uni can register the degree
      //check if he is admin send him to admin info page where he can add the info for a student and print the image
      if( req.user.isAdmin == true){
        const { id } = req.params;
        const foundUser = await User.findById(id);
        const time = moment(foundUser.dateOfBirth);
        const dob = time.format("DD/MM/YYYY");
        const qrurl = "http://form.marifetedu.com/visitor/" + id.toString();
        const degree = new Degree ();
        degree.author = req.user;
        Degree.create(degree, (err, degreeCreated) =>{
          if(err){
            req.flash('error', err.message);
            res.redirect('/');
          } else {
            foundUser.degrees.push(degreeCreated);
            foundUser.attended = true;
            foundUser.save();
          }
        })
        qr.toDataURL(qrurl, (err, src) => {
          if (err) res.send("Error occured")
          console.log(foundUser);
          res.render('adminInfo', {foundUser , dob, src});
        })
      } else {
        const { id } = req.params;
        const foundUser = await User.findById(id);
        const time = moment(foundUser.dateOfBirth);
        const dob = time.format("DD/MM/YYYY");
        const qrurl = "http://form.marifetedu.com/visitor/" + id.toString();
        const degree = new Degree ();
        degree.author = req.user;
        Degree.create(degree, (err, degreeCreated) =>{
          if(err){
            req.flash('error', err.message);
            res.redirect('/');
          } else {
            foundUser.degrees.push(degreeCreated);
            foundUser.attended = true;
            foundUser.save();
          }
        })
        qr.toDataURL(qrurl, (err, src) => {
          if (err) res.send("Error occured")
          res.render('info', {foundUser , dob, src});
        })
        }
      }
  } else {
    req.flash('error', "the Studen Id isnt a valid ID");
    res.redirect('/');
  }
})


//===============
//degree routes
//===============

app.put("/user/:id", isLoggedIn, async(req, res) =>{
  if( req.user.isAdmin == true){
    console.log(req.body);
    const degree = new Degree ();
    degree.text = req.body.degree;
    degree.author = req.user;
    var newData = {
        Name : req.body.Name,
        dateOfBirth : req.body.dateOfBirth,
        email : req.body.email,
        telephoneNumber : req.body. telephonNumber,
        nationality : req.body.nationality,
    }
    User.findByIdAndUpdate(req.params.id, {$set: newData} ,(err, user) =>{
      if(err){
        req.flash('error', err.message);
        res.redirect('/');
      } else {
        Degree.create(degree, (err, degreeCreated) =>{
          if(err){
            req.flash('error', err.message);
            res.redirect('/');
          } else {
            user.degrees.push(degreeCreated);
            user.attended = true;
            console.log(user);
            req.flash('success', 'The User has been updated');
            res.redirect('/visitor/' + user._id);
          }
        })
      }
    })
  } else {
    const { id } = req.params.id;
    await User.findById(req.params.id, (err, user) =>{
      if(err){
        req.flash('error', err.message);
        res.redirect('/');
      } else {
        const degree = new Degree ();
        degree.text = req.body.degree;
        degree.author = req.user;
        console.log(degree);
        Degree.create(degree, (err, degreeCreated) =>{
          if(err){
            req.flash('error', err.message);
            res.redirect('/');
          } else {
            console.log(typeof(degreeCreated));
            user.degrees.push(degreeCreated);
            user.attended = true;
            user.save();
            console.log(user);
            req.flash('success', 'The Degree desired has been registered');
            res.redirect('/visitor/' + user._id);
          }
        })
      }
    })
  }
  
})

// ==============
// printing functionality
// ==============

app.get("/user/:id/print", async(req, res) => {
  const { id } = req.params;
  await User.findById(req.params.id, (err, user) =>{
    const text = user.Name;
    console.log(typeof(text))
    const canvas = createCanvas(700, 400);
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = '50px serif';
    context.textAlign = 'center';
    context.fillStyle = '#000000';
    context.fillText(text, 350, 180)
    const qrurl = "http://form.marifetedu.com/visitor/" + id.toString();
  qr.toDataURL(qrurl, (err, src) => {
    if (err){ res.send("Error occured")}
    else {
      loadImage(src).then(image => {
        context.drawImage(image, 270, 200);
        const buffer = canvas.toBuffer('image/jpeg');
        fs.writeFileSync('image.jpeg', buffer); 
        res.download('image.jpeg');
      })
    }
  })
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


