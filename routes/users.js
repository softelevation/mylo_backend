var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.json());



apiController = require('../controllers/user.controller');

router.get('/',apiController.defaultUrl);
router.post('/login',apiController.loginUser);
router.get('/users',apiController.allUsers);
router.post('/encrypt',apiController.encrypt);


module.exports = router;
