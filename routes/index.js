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

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});


router.get('/posts', function(req, res, next) {
  Word.find(function(err, words){
  	if (err) {return next(err);}
  	res.json(words);
  });
});

router.post('/posts', auth, function(req, res, next){
	var post = new Word(req.body);
	post.author = req.payload.username;
	post.save(function(err, post){
		if (err) {return next(err);}
		res.json(post);
	});
});

router.post('/save/:post', auth, function(req, res, next){
	var newId = new mongoose.mongo.ObjectId(req.payload._id);
	var newId2 = new mongoose.mongo.ObjectId(req.post._id);
	User.findByIdAndUpdate(newId, 
							{$push:{"words": newId2}},
							{safe:true, upsert:true},
							function(err, model){
								console.log(err);
							});
	res.send('Saved');
});

router.param('post', function(req, res, next, id){
	var query = Word.findById(id);
	query.exec(function(err, post){
		if(err){return next(err);}
		if (!post) {return next(new Error('can\'t find post'));}
		req.post = post;
		return next();
	});
});

router.param('user', function(req, res, next, id){
	var query = User.findById(id);
	query.exec(function(err, user){
		if(err){return next(err);}
		if (!user) {return next(new Error('can\'t find user'));}
		req.user = user;
		return next();
	});
});

router.get('/posts/:post', function(req, res, next){
	req.post.populate('comments', function(err, post){
		if (err) {return next(err);}
		res.json(post);
	});
});

router.put('/posts/:post/upvote', auth, function(req, res, next){
	var newId = new mongoose.mongo.ObjectId(req.payload._id);
	var newId2 = new mongoose.mongo.ObjectId(req.post._id);
	User.findByIdAndUpdate(newId, 
							{$push:{"voted": newId2}},
							{safe:true, upsert:true},
							function(err, model){
								console.log(err);
							});
	req.post.upvote(function(err, post){
			if (err) {return next(err);}
			res.json(post);
	});
});

router.put('/posts/:post/downvote', auth, function(req, res, next){
	var newId = new mongoose.mongo.ObjectId(req.payload._id);
	var newId2 = new mongoose.mongo.ObjectId(req.post._id);
	User.findByIdAndUpdate(newId, 
							{$push:{"voted": newId2}},
							{safe:true, upsert:true},
							function(err, model){
								console.log(err);
							});
	req.post.downvote(function(err, post){
		if (err) {return next(err);}
		res.json(post);
	});
});

router.post('/posts/:post/comments', auth, function(req, res, next){
	var comment = new Comment(req.body);
	comment.post = req.post;
	comment.author = req.payload.username;
	comment.save(function(err, comment){
		if (err) {return next(err);}
		req.post.comments.push(comment);
		req.post.save(function(err, post){
			if (err) {return next(err);}
			res.json(comment);
		});
	});
});

router.param('comment', function(req, res, next, id){
	var query = Comment.findById(id);
	query.exec(function(err, comment){
		if(err){return next(err);}
		if (!comment) {return next(new Error('can\'t find comment'));}
		req.comment = comment;
		return next();
	});
});

router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next){
	var newId = new mongoose.mongo.ObjectId(req.payload._id);
	var newId2 = new mongoose.mongo.ObjectId(req.comment._id);
	User.findByIdAndUpdate(newId, 
							{$push:{"votedComments": newId2}},
							{safe:true, upsert:true},
							function(err, model){
								console.log(err);
							});
	req.comment.upvote(function(err, comment){
		if (err) {return next(err);}
		res.json(comment);
	});
});

router.put('/posts/:post/comments/:comment/downvote', auth, function(req, res, next){
	var newId = new mongoose.mongo.ObjectId(req.payload._id);
	var newId2 = new mongoose.mongo.ObjectId(req.post._id);
	User.findByIdAndUpdate(newId, 
							{$push:{"votedComments": newId2}},
							{safe:true, upsert:true},
							function(err, model){
								console.log(err);
							});
	req.comment.downvote(function(err, comment){
		if (err) {return next(err);}
		res.json(comment);
	});
});

router.post('/search', function(req, res, next){
	var query = Word.find({
    "$text": {
      "$search": req.body.query
    }
  });
	query.exec(function(err, post){
		if (err) {return next(err);}
		res.json(post);
	});
});


router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();

  user.username = req.body.username;

  user.setPassword(req.body.password)

  user.save(function (err){
    if(err){ return next(err); }

    return res.json({token: user.generateJWT()})
  });
});

router.post('/login', function(req, res, next){
	if (!req.body.username || !req.body.password) {
		return res.status(400).json({message: 'Please fill out all the fields'});
	}

	passport.authenticate('local', function(err, user, info){
		if(err){return next(err);}

		if (user) {
			return res.json({token: user.generateJWT()});
		} else{
			return res.status(401).json(info);
		}
	})(req, res, next);
});

router.post('/api/getpostsvoted', auth, function(req, res, next){
	var query = User.findById(req.payload._id);
	query.exec(function(err, user){
		if(err){return next(err);}
		if (!user) {return next(new Error('can\'t find user'));}
		res.json(user.voted);
	});
});

router.post('/api/getcommentssvoted', auth, function(req, res, next){
	var query = User.findById(req.payload._id);
	query.exec(function(err, user){
		if(err){return next(err);}
		if (!user) {return next(new Error('can\'t find user'));}
		res.json(user.votedComments);
	});
});

router.delete('/api/removepostupvoted/:post', auth, function(req, res, next){
	var query = User.update({ _id:req.payload._id }, {$pullAll: {voted: [req.post._id] }}, { safe: true, multi:true });
	query.exec(function(err, user){
		if(err){return next(err);}
		res.json(user.voted);
	});
	req.post.revertUpvote(function(post){
	});
});

router.delete('/api/removepostdownvoted/:post', auth, function(req, res, next){
	var query = User.update({ _id:req.payload._id }, {$pullAll: {voted: [req.post._id] }}, { safe: true, multi:true });
	query.exec(function(err, user){
		if(err){return next(err);}
		res.json(user.voted);
	});
	req.post.revertDownvote(function(post){
	});
});

router.delete('/api/removecommentupvoted/:comment', auth, function(req, res, next){
	var query = User.update({ _id:req.payload._id }, {$pullAll: {voted: [req.comment._id] }}, { safe: true, multi:true });
	query.exec(function(err, user){
		if(err){return next(err);}
		res.json(user.voted);
	});
	req.post.revertUpvote(function(post){
	});
});

router.delete('/api/removecommentdownvoted/:comment', auth, function(req, res, next){
	var query = User.update({ _id:req.payload._id }, {$pullAll: {voted: [req.comment._id] }}, { safe: true, multi:true });
	query.exec(function(err, user){
		if(err){return next(err);}
		res.json(user.voted);
	});
	req.post.revertDownvote(function(post){
	});
});

router.post('/api/getcommentsvoted', auth, function(req, res, next){
	var query = User.findById(req.payload._id);
	query.exec(function(err, user){
		if(err){return next(err);}
		if (!user) {return next(new Error('can\'t find user'));}
		res.json(user.votedComments);
	});
});

module.exports = router;
