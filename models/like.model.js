const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let likeSchema = new Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserModel'
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MovieModel'
    }
    // comments: [{
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'CommentModel'
    // }]
});

// Export the model
module.exports = mongoose.model('LikeModel', likeSchema);