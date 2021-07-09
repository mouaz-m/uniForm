var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var qr = require("qrcode");
var nodeMailer = require('nodemailer');

var moment = require('moment');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var mongoose=require('mongoose');

const User = require ('./models/users');

mongoose.connect('mongodb+srv://mongoUser:mWQPGUHWrO83SDKu@cluster0.mza4d.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
  console.log("MONGO CONNECTION OPEN!!!")
})
.catch(err => {
  console.log("OH NO MONGO CONNECTION ERROR!!!!")
  console.log(err)
})

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// POST request listener to convert the user id to qr code and mail it to the user
app.post("/scan", async (req, res) => {
  console.log(req.body);
    let newUser = new User(req.body);
    await newUser.save();

  const url =  "https://stormy-lowlands-99525.herokuapp.com/visitor/" + newUser._id.toString();

  // If the input is null return "Empty Data" error
  if (newUser.length === 0) res.send("Empty Data!");
  
  // Let us convert the input stored in the url and return it as a representation of the QR Code image contained in the Data URI(Uniform Resource Identifier)
  // It shall be returned as a png image format
  // In case of an error, it will save the error inside the "err" variable and display it
  
  qr.toDataURL(url, (err, src) => {
      if (err) res.send("Error occured")

      app.set('src', src);

      res.render("scan", { src });

      let transporter = nodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, //use ssl
        auth: {
            user: 'maatouq.45@gmail.com',
            pass: 'tlbyrffziibsnmsr'
        }
    });
    let mailOptions = {
        from: 'mouaz-m@hotmail.com', // sender address
        to: req.body.email, // list of receivers
        subject: 'Test Email Node JS', // Subject line
        text: 'k3ki', // plain text body
        html: '<h1> thank you for regestering!! </h1> <p> please see your information below </p> <br> <img src="' + src + '"> <br> <a href="'+ url +'">click here to view your qr code with your information</a> ', // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
      
        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
        //console.log('Message %s sent: %s', info.messageId, info.response);


      // Let us return the QR code image as our response and set it to be the source used in the webpage
    });
  });
});

app.get('/visitor/:id', async(req, res) => {
  const { id } = req.params;
  const foundUser = await User.findById(id);
  const time = moment(foundUser.dateOfBirth);
  const dob = time.format("DD/MM/YYYY");
  const qrurl = "https://stormy-lowlands-99525.herokuapp.com//visitor/" + id.toString();
  qr.toDataURL(qrurl, (err, src) => {
    if (err) res.send("Error occured")

    res.render('visitor', {foundUser , dob, src});
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

