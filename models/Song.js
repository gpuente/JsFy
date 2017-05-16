'user strict'

var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

var SongSchema = Schema({
	number: Number,
	name: String,
	duration: String,
	file: String,
	album: {type: Schema.ObjectId, ref: 'Album'}
});

SongSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Song', SongSchema);