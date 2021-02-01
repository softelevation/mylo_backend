var express = require('express');
var router = express.Router();
var db = require('../db');

var bodyParser = require('body-parser');
router.use(bodyParser.json());



/* GET home page. */
router.get('/', function(req, res, next) {
  // var sql = "SELECT * FROM `admins`";
  // db.query(sql, function(err, rows, fields) {
    // if (err) {
      // res.status(500).send({ error: 'Something failed!' })
    // }
    // res.json(rows)
  // }) __dirname + "/" + 
      res.render('index', {option: 'value'});

});

module.exports = router;
