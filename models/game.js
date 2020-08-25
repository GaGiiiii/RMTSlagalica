const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let gameSchema = new Schema({
    game_info: {
      type: Map,
      of: Array,
    },
    started_at: {
      type: Date,
      default: Date.now
    },
    finished_at: {
      type: Date,
      default: undefined
    },
});

// Export the model
module.exports = mongoose.model('GameModel', gameSchema);