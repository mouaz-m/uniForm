const passport = require('passport');

const express = require('express'),
      router  = express.Router(),
      University = require('../models/university');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'k3ki' });
  });

router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register', async(req, res) => {
    try{
        console.log(req.body);
        const { email, username, password} = req.body;
        const university = new University ({email, username});
        const registerdUniversity = await University.register(university, password);
        req.flash('success', 'Succesfully made a new user for university');
        res.redirect('/register');
    }
    catch(e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }

});

router.get('/login', (req, res) => {
    res.render('login');
})

router.post('/login', passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}), (req, res) => {
    res.render('index');
})


module.exports = router;