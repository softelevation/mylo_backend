var db = require('../db');

module.exports = {
	getAvailableBroker: getAvailableBroker
};


function getAvailableBroker(object1) {
	return new Promise(function(resolve, reject) {
		let selected_fild = 'id,name,email,phone_no,image,social_type,roll_id,status,address,latitude,longitude,qualifications,banks,about_me,';
			let sql = 'SELECT '+selected_fild;
			if(object1.latitude && object1.longitude) {
				sql += '(3959 * acos ( cos ( radians('+object1.latitude+') ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians('+object1.longitude+') ) + sin ( radians('+object1.latitude+') ) * sin( radians( latitude ) ) ) ) AS distance';
			}else{
				sql += '(3959 * acos ( cos ( radians(-33.8623719) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(151.2211646) ) + sin ( radians(-33.8623719) ) * sin( radians( latitude ) ) ) ) AS distance';
			}
			sql += ' FROM `users` WHERE `roll_id` = 2';
			sql += ' HAVING distance < 100 ORDER BY distance LIMIT 0 , 20';
			// console.log(object1);
			db.query(sql, function(err, rows, fields) {
				if (err) {
					return 'Something failed!';
				}else {
					if(rows.length >0){
						resolve(rows);
					}else{
						resolve([]);
					}
				}
			});
	});
}