var apiModel = require('../Model/model');
var db = require('../db');
var dbs = require('../db1');
const jwt = require('jsonwebtoken');
const accessTokenSecret = 'youraccesstokensecret';
const dateFormat = require("dateformat");

module.exports = {
	add_status: add_status,
	change_status: change_status,
	broker_detail: broker_detail,
	notification_working: notification_working
};


async function notification_working(token,roll_id) {
	try {
		var FCM = require('fcm-node');
		let serverKey = '';
		if(roll_id == 1){
			serverKey = process.env.cus_key;
		}else{
			serverKey = process.env.broker_key;
		}
		var fcm = new FCM(serverKey);
		let username = 'hello notification is working';
		var message = {
			to: token,
			notification: {
				title: 'New booking', 
				body: username,
			},
			data: {
				my_key: 'my value',
				my_another_key: 'my another value'
			}
		}
		fcm.send(message, function(err, response){
			if (err) {
				console.log('errror');
			} else {
				console.log(response);
			}
		});
	} catch (err) {
	}
	
}


async function add_status(object1) {
	const qb = await dbs.get_connection();
	try {
		// console.log('wwwwwwwwwwwwwwwwwww')
		// let token_s = '';
		// if (object1.assign_at){
			// token_s = object1.token;
		// }else{
			// token_s = object1;
		// }
		
		var now = new Date();
		const user = await jwt.verify(object1.token, accessTokenSecret);
		let brokers = await qb.select(['id','token']).where({roll_id: 2,status:1}).get('users');
		let result = brokers.map(a => a.token);
		let result_id = brokers.map(a => '-'+a.id+'-');
		let object_add = {cus_id:user.id,created_at:dateFormat(now,'yyyy-m-d H:MM:ss'),updated_at:dateFormat(now,'yyyy-m-d H:MM:ss'),for_broker:result_id.toString()};
		
		if (object1.assign_at){
			object_add.assign_at = object1.assign_at;
		}else{
			object_add.assign_at = dateFormat(now,'yyyy-m-d H:MM:ss');
		}
		if (object1.lat){
			object_add.latitude = object1.lat;
		}
		if (object1.lng){
			object_add.longitude = object1.lng;
		}
		if (object1.lng){
			object_add.location = object1.location;
		}
		let book_now = await qb.returning('id').insert('book_nows', object_add);
		notification_s(user.id,result);
		let users = await qb.select('*').where('id',user.id).limit(1).get('users');
		return {
			users: users[0],
			book_now: book_now
		};
		
		// return result_id.toString();
	} catch (err) {
		console.log('wwwwwwwwwwwwwwwwwww');
		console.log(err);
		console.log('wwwwwwwwwwwwwwwwwww');
	} finally {
		qb.disconnect();
	}
}

async function broker_detail(msg) {
	const qb = await dbs.get_connection();
	try {
		const user = await jwt.verify(msg.token, accessTokenSecret);
		let users = await qb.select('*').where('id',user.id).limit(1).get('users');
		return users[0];
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
	
}


async function change_status(msg) {
	const user = await jwt.verify(msg.token, accessTokenSecret);
	msg.broker_id = user.id;
	if(msg.status == 'in_progress'){
		notification_change_request(msg, 'in_progress');
	}else if (msg.status == 'cancelled') {
    notification_change_request(msg, 'cancelled');
  }
	apiModel.update('book_nows',{id: msg.id},{status: msg.status,broker_id:user.id});
}

var notification_change_request = async function (msg,statu_s,callback) {
	try {
		var FCM = require('fcm-node');
		var serverKey = process.env.cus_key;
		var fcm = new FCM(serverKey);
	
		const qb = await dbs.get_connection();
		const users = await qb.select(['users.name','users.token']).where('book_nows.id',msg.id).limit(1).from('book_nows').join('users','users.id=book_nows.cus_id').get();
		
		let brokers = await qb.select(['name']).where({id: msg.broker_id}).limit(1).get('users');
		
		let username = (brokers[0].name) ? brokers[0].name: "Broker";
		let message_s = username+' has accepted your request';
		if (statu_s == 'cancelled') {
			message_s = username + ' has cancelled your request';
    }
		console.log(message_s);
		console.log(users[0].token);
		var message = {
      to: users[0].token,
      notification: {
        title: 'Booking accepted',
        body: message_s,
      },
      data: {
        my_key: 'my value',
        my_another_key: 'my another value',
      },
    };
		fcm.send(message, function(err, response){
			if (err) {
				console.log(err);
				// res.status(200).json(halper.api_response(0,'This is invalid request',"Something has gone wrong!"));
			} else {
				console.log(response);
				// res.status(200).json(halper.api_response(1,'Brokers list',response));
			}
		});
		// return 'qqqqqqqqqqqqqq';
	} catch (err) {
		// return 'xxxxxxxxx';
	}
}


var notification_s = async function (msg,result,callback) {
	try {
		
		var FCM = require('fcm-node');
		var serverKey = process.env.broker_key;
		var fcm = new FCM(serverKey);
	
		const qb = await dbs.get_connection();
		let users = await qb.select(['id','name','email','phone_no','token']).where({id: msg}).get('users');
		
		
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
				console.log('errror');
				// res.status(200).json(halper.api_response(0,'This is invalid request',"Something has gone wrong!"));
			} else {
				console.log(response);
				// res.status(200).json(halper.api_response(1,'Brokers list',response));
			}
		});
		// return 'qqqqqqqqqqqqqq';
	} catch (err) {
		// return 'xxxxxxxxx';
	}
}