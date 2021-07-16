var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.json());



// apiController = require('../controllers/user.controller');

router.get('/',function(req,res){
    res.json('wwwwwwwwwwwwwwwwww');
});


module.exports = router;
