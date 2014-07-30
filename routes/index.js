var express = require('express');
var router = express.Router();
var db = require('../lib/db');
var scrypt = require('scrypt');
var scryptParameters = scrypt.params(0.1);

scrypt.hash.config.outputEncoding = "hex";

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'LiveChambana' });
});

router.post('/apartments/add', function(req, res) {
  db.apartments.insert({
		address           : req.body.address,
		address2          : req.body.address2,
		city              : req.body.city,
		state             : req.body.state,
		zip               : req.body.zip,
		totalBedrooms     : req.body.totalBedrooms,
		availableBedrooms : req.body.availableBedrooms,
		availability      : req.body.availability,
		price             : req.body.price,
		owner             : req.body.owner

  }, function(err, docs) {
  	if(err) throw err;
  	res.send(docs);
  });
});

router.get('/apartments/add', function(req, res) {
	res.render('addApartment');
});

router.get('/signup', function(req, res) {
	res.render('signup', {errors : []});
});

router.post('/signup', function(req, res) {
	db.users.findOne({email : req.body.email}, function(err, user) {
		if (err) res.send(err);
		else if (user) {
			res.render('signup', {errors : ['Email is already in use.']});
		}
		else {
			if (req.body.password != req.body.confirmpassword) {
				res.render('signup', {errors : ['passwords do not match']});
				return;
			}
			console.log('error', err)
			console.log('user', user);
			var hash = scrypt.passwordHashSync(req.body.password, scryptParameters);
			db.users.insert({
				email : req.body.email,
				password : hash,
				firstName : req.body.firstname,
				lastName : req.body.lastname
			});
			res.redirect('/');
		}
	});
});

router.get('/login', function(req, res) {
	res.render('login', {errors : []});
});

router.post('/login', function(req, res, next) {
	db.users.findOne({ email: req.body.email }, function (err, user) {
      if (err) { return done(err); }
      if (!user || user === null) {
      	res.render('login', {errors : ['User not found']});
      	//req.session.user = null;
      	return;
      }
      if (!scrypt.verifyHashSync(user.password, req.body.password)) {
        //req.session.user = null;
        res.render('login', {errors : ['Incorrect password']});
        return;
      }
      req.session.user = user.email;
      req.session.firstName = user.firstName;
      req.session.lastName = user.lastName;
      res.redirect('/profile');
    });
});

router.get('/profile', isLoggedIn, function (req, res) {
	res.render('profile', {firstName : req.session.firstName});
});

router.get('/logout', function (req, res) {
	req.session.destroy();
	res.redirect('/');
});

function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on 
	console.log(req.session);
	if (req.session.user)
		return next();

	// if they aren't redirect them to the home page
	res.render('login', {errors : ['Must be authenticated to access to this page.']});
}

module.exports = router;
