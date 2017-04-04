let express = require('express')
let router = express.Router()
let user = require('../../../controllers/api/v1/user')

//
router.use(function(req, res, next) {
    //console.log('api: ' + Date.now());
    res.set({
        'Access-Control-Allow-Origin': '*'
    });
    next();
});
router.route('/users').all(user.list);
router.route('/users/:id').all(user.item);

module.exports = function(app) {
    app.use('/api/v1', router);
};
