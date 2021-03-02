var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.json());



apiController = require('../controllers/user.controller');

router.get('/',apiController.defaultUrl);
router.post('/login',apiController.loginUser);
router.get('/users',apiController.allUsers);
router.post('/user_list',apiController.allUsersList);
router.post('/broker_list',apiController.allbroker_list);
router.get('/brokers',apiController.allBrokers);
router.get('/dashboard',apiController.dashboard);
router.post('/users',apiController.postUsers);
router.post('/users/:id',apiController.postUsersUpdate);
router.post('/encrypt',apiController.encrypt);


router.post('/registered',apiController.registered);
router.post('/verify-otp',apiController.verifyOtp);
router.get('/profile',apiController.profile);
router.get('/profile/:id',apiController.profileById);
router.post('/profile',apiController.profilePost);

router.post('/form-profile',apiController.formprofilePost);

router.post('/delete-data',apiController.deleteData);

router.post('/brokerProfile',apiController.brokerProfile);
router.get('/customer-reqest',apiController.customer_reqest);
router.get('/broker-reqest',apiController.broker_reqest);
router.post('/book-reqest',apiController.bookReqest);

router.post('/broker-status',apiController.brokerStatus);
router.get('/log-out',apiController.logOut);


module.exports = router;
