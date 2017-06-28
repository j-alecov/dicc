var mongoose = require('mongoose');
var textSearch = require('mongoose-text-search');

var WordSchema = new mongoose.Schema({
	title: String,
	definition: String,
	country: String,
	author: String,
	example: String,
	tags: [String],
	upvotes: {type: Number, default:0},
	downvotes: {type: Number, default:0},
	votes: {type: Number, default:0},
	comments:[{type: mongoose.Schema.Types.ObjectId, ref:'Comment'}]
});

WordSchema.methods.upvote = function(cb){
	this.upvotes +=1;
	this.votes += 1;
	this.save(cb);
};

WordSchema.methods.revertUpvote = function(cb){
	this.upvotes -=1;
	this.votes -= 1;
	this.save(cb);
};

WordSchema.methods.downvote = function(cb){
	this.downvotes +=1;
	this.votes -=1;
	this.save(cb);
};

WordSchema.methods.revertDownvote = function(cb){
	this.downvotes +=1;
	this.votes -=1;
	this.save(cb);
};

WordSchema.plugin(textSearch);

WordSchema.index({
	title : 'text',
	definition: 'text',
	tags: 'text'
});

mongoose.model('Word', WordSchema);