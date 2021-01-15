var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.json());



apiController = require('../controllers/user.controller');

router.get('/',apiController.defaultUrl);
router.post('/login',apiController.loginUser);
router.get('/users',apiController.allUsers);
router.get('/brokers',apiController.allBrokers);
router.get('/dashboard',apiController.dashboard);
router.post('/users',apiController.postUsers);
router.post('/encrypt',apiController.encrypt);


router.post('/registered',apiController.registered);
router.post('/verify-otp',apiController.verifyOtp);
router.get('/profile',apiController.profile);
router.post('/profile',apiController.profilePost);

router.post('/form-profile',apiController.formprofilePost);


module.exports = router;
