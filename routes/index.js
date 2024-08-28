
var express = require('express');
var controller = require ('../controller/MovieController')
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.send({title: 'Express'});
});


module.exports = router;
