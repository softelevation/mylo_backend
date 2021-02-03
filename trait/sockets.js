var apiModel = require('../Model/model');
var db = require('../db');
var dbs = require('../db1');
const jwt = require('jsonwebtoken');
const accessTokenSecret = 'youraccesstokensecret';
const dateFormat = require("dateformat");

module.exports = {
	add_status: add_status,
	change_status: change_status
};


async function add_status(object1) {
	
	var now = new Date();
	const user = await jwt.verify(object1, accessTokenSecret);
	notification_s(user.id);
	apiModel.insert('book_nows',{cus_id:user.id,created_at:dateFormat(now,'yyyy-m-d h:MM:ss'),updated_at:dateFormat(now,'yyyy-m-d h:MM:ss')});
}


async function change_status(msg) {
	const user = await jwt.verify(msg.token, accessTokenSecret);
	apiModel.update('book_nows',{id: msg.id},{status: msg.status,broker_id:user.id});
}


var notification_s = async function (msg,callback) {
	try {
		
		var FCM = require('fcm-node');
		var serverKey = process.env.broker_key;
		var fcm = new FCM(serverKey);
	
		const qb = await dbs.get_connection();
		let users = await qb.select(['id','name','email','phone_no','token']).where({id: msg}).get('users');
		let brokers = await qb.select(['token']).where({roll_id: 2}).get('users');
		let result = brokers.map(a => a.token);
		
		let username = (users[0].name) ? users[0].name: "Customer";
		var message = {
			registration_ids : result,
			notification: {
				title: 'New booking', 
				body: username+' has requesting a new booking',
			},
			data: {
				my_key: 'my value',
				my_another_key: 'my another value'
			}
		}
		fcm.send(message, function(err, response){
			if (err) {
				// res.status(200).json(halper.api_response(0,'This is invalid request',"Something has gone wrong!"));
			} else {
				// res.status(200).json(halper.api_response(1,'Brokers list',response));
			}
		});
		// return 'qqqqqqqqqqqqqq';
	} catch (err) {
		// return 'xxxxxxxxx';
	}
}