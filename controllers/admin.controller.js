var db = require('../db');
var halper = require('../halpers/halper');

module.exports = {
	defaultUrl: defaultUrl,
	loginUser: loginUser
};

function loginUser(req, res, next){
	var sql = "SELECT * FROM `admins` WHERE `email` = '"+req.body.email+"' AND `password` = '"+halper.encrypt(req.body.password,'in')+"'";
	db.query(sql, function(err, rows, fields) {
		if (err) {
			res.status(500).json({ error: 'Something failed!' })
		}else {
			if(rows.length >0){
				res.status(200).json(halper.api_response(1,'User login successfully',rows[0]));
			}else{
				res.status(206).json(halper.api_response(0,'Email and password does not match',{}));
			}
		}
	});
}

function defaultUrl(req, res, next){
	
	
	var sql = "SELECT * FROM `admins`";
	db.query(sql, function(err, rows, fields) {
		if (err) {
		  res.status(500).send({ error: 'Something failed!' })
		}
		res.status(200).json(halper.api_response(200,'user login success',rows))
	});
}