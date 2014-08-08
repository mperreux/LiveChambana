var express = require('express');
var router = express.Router();
var db = require('../lib/db');
var scrypt = require('scrypt');
var scryptParameters = scrypt.params(0.1);
var util = require('util');

scrypt.hash.config.outputEncoding = "hex";

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'LiveChambana', user : req.session.user});
});

router.post('/apartments/add', isLoggedIn, function(req, res) {
  req.checkBody('type', 'Invalid type').notEmpty();
  req.checkBody('address', 'Invalid address').notEmpty();
  req.checkBody('city', 'Invalid city').notEmpty();
  req.checkBody('state', 'Invalid state').notEmpty();
  req.checkBody('zip', 'Invalid Zip Code').notEmpty().isInt();
  req.checkBody('totalBedrooms', 'Invalid totalBedrooms').notEmpty().isInt();
  req.checkBody('availableBedrooms', 'Invalid availableBedrooms').notEmpty().isInt();
  req.checkBody('available', 'Invalid availableBedrooms').notEmpty();
  req.checkBody('rent', 'Invalid rent').notEmpty();
  req.checkBody('leaseOrSublease', 'Invalid leaseOrSublease').notEmpty();

  var errors = req.validationErrors();
  if (errors) {
    res.json(errors, 400);
    return;
  }
  db.apartments.insert({
		user              : req.session.userId,
		type              : req.body.type,
		address           : req.body.address,
		address2          : req.body.address2,
		city              : req.body.city,
		state             : req.body.state,
		zip               : req.body.zip,
		totalBedrooms     : req.body.totalBedrooms,
		availableBedrooms : req.body.availableBedrooms,
		available         : req.body.available,
		rent              : req.body.rent,
		leaseOrSublease   : req.body.leaseOrSublease

  }, function(err, docs) {
  	if(err) throw err;
  	res.send(docs);
  });
});

router.get('/apartments/add', isLoggedIn, function(req, res) {
	res.render('addApartment', {user : req.session.user});
});

router.get('/api/apartments/view', isLoggedIn, function(req, res) {
	db.apartments.find({}, function(err, docs) {
		if (err) throw err;
		res.send(docs);
	});
});

router.get('/apartments/view', isLoggedIn, function(req, res) {
	db.apartments.find({}).sort({rent : 1}, function(err, docs) {
		if (err) throw err;
		res.render('viewApartments', {locations : docs, user : req.session.user});
	});
});

router.get('/signup', function(req, res) {
	res.render('signup', {errors : [], user : req.session.user});
});

router.post('/signup', function(req, res) {
	db.users.findOne({email : req.body.email}, function(err, user) {
		if (err) res.send(err);
		else if (user) {
			res.render('signup', {errors : ['Email is already in use.'], user : req.session.user});
		}
		else {
			if (req.body.password != req.body.confirmpassword) {
				res.render('signup', {errors : ['passwords do not match'], user : req.session.user});
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
	res.render('login', {errors : [], title: 'Login', user : req.session.user});
});

router.post('/login', function(req, res, next) {
	db.users.findOne({ email: req.body.email }, function (err, user) {
      if (err) { return done(err); }
      if (!user || user === null) {
      	res.render('login', {errors : ['User not found'], user : req.session.user});
      	//req.session.user = null;
      	return;
      }
      if (!scrypt.verifyHashSync(user.password, req.body.password)) {
        //req.session.user = null;
        res.render('login', {errors : ['Incorrect password'],user : req.session.user});
        return;
      }
      req.session.userId = user._id;
      req.session.user = user.email;
      req.session.firstName = user.firstName;
      req.session.lastName = user.lastName;
      res.redirect('/profile');
    });
});

router.get('/profile', isLoggedIn, function (req, res) {
	res.render('profile', {firstName : req.session.firstName, user : req.session.user});
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
