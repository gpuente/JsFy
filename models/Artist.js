'user strict'

var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

var ArtistSchema = Schema({
	name: {type: String, required: true, unique: true},
	description: {type: String, required: true},
	image: String
});

ArtistSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Artist', ArtistSchema);