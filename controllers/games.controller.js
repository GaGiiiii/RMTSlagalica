/* ********** MODELS ********** */

/* ********** OPERATIONS ********** */

    /* ********** INDEX ********** */

        exports.index = function (req, res) {
            res.render('games/index' , {
                layout: 'games',
                user: req.body.username
            });
        };

/* ********** METHODS ********** */