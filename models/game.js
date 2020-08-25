const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let gameSchema = new Schema({
    game_info: {
      type: Map,
      of: Array,
    },
    started_at: {
      type: String,
      default: undefined
    },
    finished_at: {
      type: String,
      default: undefined
    },
});

// Export the model
module.exports = mongoose.model('GameModel', gameSchema);