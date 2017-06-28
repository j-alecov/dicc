var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');
var mongoose = require('mongoose');
var Post = mongoose.model('Word');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var passport = require('passport');

var auth = jwt({secret: 'LONCHESdePALITROCHE', userProperty: 'payload'});

/* GET users listing. */
router.get('/', function(req, res) {
  res.send('respond with a resource');
});

module.exports = router;
