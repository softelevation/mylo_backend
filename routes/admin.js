var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.json());



apiController = require('../controllers/admin.controller');

router.get('/',apiController.defaultUrl);
router.post('/login',apiController.loginUser);


module.exports = router;
