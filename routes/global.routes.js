const express = require('express');
const router = express.Router();

/* ********** CONTROLLERS ********** */

const globalController = require('../controllers/global.controller');

/* ********** ROUTES ********** */

router.get('/', globalController.index);
router.get('/games', globalController.games);

/* ********** EXPORTS ********** */

module.exports = router;