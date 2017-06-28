var mongoose = require('mongoose');

var CommentSchema = new mongoose.Schema({
	body: String,
	author: String,
	upvotes: {type: Number, default:0},
	downvotes: {type: Number, default:0},
	votes: {type: Number, default:0},
	word: {type: mongoose.Schema.Types.ObjectId, ref:'Word'}
});

CommentSchema.methods.upvote = function(cb){
	this.upvotes +=1;
	this.votes += 1;
	this.save(cb);
};

CommentSchema.methods.revertUpvote = function(cb){
	this.upvotes -=1;
	this.votes -= 1;
	this.save(cb);
};

CommentSchema.methods.downvote = function(cb){
	this.downvotes +=1;
	this.votes -=1;
	this.save(cb);
};

CommentSchema.methods.revertDownvote = function(cb){
	this.downvotes +=1;
	this.votes -=1;
	this.save(cb);
};

mongoose.model('Comment', CommentSchema);