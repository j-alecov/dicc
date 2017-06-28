var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');
var mongoose = require('mongoose');
var Word = mongoose.model('Word');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var passport = require('passport');
var textSearch = require('mongoose-text-search');

var auth = jwt({secret: 'LONCHESdePALITROCHE', userProperty: 'payload'});

router.post('/getpostsvoted', auth, function(req, res){
	var query = User.findById(req.payload._id);
	query.exec(function(user){
		if (!user) {return next(new Error('can\'t find user'));}
		res.json(user.voted);
	});
});

module.exports = router;