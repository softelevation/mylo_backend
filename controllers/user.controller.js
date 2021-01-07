var db = require('../db');
var halper = require('../halpers/halper');

module.exports = {
	defaultUrl: defaultUrl,
	allUsers: allUsers,
	loginUser: loginUser,
	encrypt: encrypt
};

function encrypt(req, res, next){
		res.status(200).json(halper.api_response(1,'encrypt',halper.encrypt(req.body.password,'in')));
}

function loginUser(req, res, next){
	var sql = "SELECT * FROM `users` WHERE `email` = '"+req.body.email+"' AND `password` = '"+halper.encrypt(req.body.password,'in')+"'";
	db.query(sql, function(err, rows, fields) {
		if (err) {
		  res.status(500).json({ error: 'Something failed!' })
		}else {
			if(rows.length >0){
				res.status(200).json(halper.api_response(1,'User login successfully',rows));
			}else{
				res.status(206).json(halper.api_response(0,'Email and password does not match',{}));
			}
		}
	});
}

function allUsers(req, res, next){
	var sql = "SELECT * FROM `users`";
	db.query(sql, function(err, rows, fields) {
		if (err) {
		  res.status(500).json({ error: 'Something failed!' })
		}else {
			// if(rows.length >0){
				// res.status(200).json(halper.api_response(1,'User detail',rows));
				res.status(200).json(rows);
			// }else{
				// res.status(206).json(halper.api_response(0,'Email and password does not match',{}));
			// }
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