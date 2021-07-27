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
	notification_badge: notification_badge,
	notification_working: notification_working
};


async function notification_working(token,roll_id) {
	try {
		var FCM = require('fcm-node');
		let serverKey = process.env.cus_key;
		// if(roll_id == 1){
			// serverKey = process.env.cus_key;
		// }else{
			// serverKey = process.env.broker_key;
		// }
		var fcm = new FCM(serverKey);
		let username = '';
		var message = {
			to: token,
			notification: {
				title: 'Welcome to Mylo Pro', 
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


async function notification_badge(msg) {
		const qb = await dbs.get_connection();
		try {
			const user = await jwt.verify(msg.token, accessTokenSecret);
			let users = await qb.select('roll_id').where('id', user.id).get('users');
			if (users[0].roll_id == '1') {
				if (msg.id != 'all'){
						apiModel.update('notifications', { id: msg.id }, { cus_badge: 0 });
				}else{
						apiModel.update('notifications', { cus_id: user.id }, { cus_badge: 0 });
				}
      }else{
				if (msg.id != 'all'){
						apiModel.update('notifications', { id: msg.id }, { brok_badge: 0 });
				}else{
						apiModel.update('notifications', { broker_id: user.id }, { brok_badge: 0 });
				}
			}
    } catch (err) {
      console.log(err);
    } finally {
      qb.disconnect();
    }
}

var convertGMT = function (date) {
  let date_time = new Date(date).toLocaleString('en-US', { timeZone: 'GMT' });
  return dateFormat(date_time, 'yyyy-mm-d H:MM:ss');
};

async function add_status(object1) {
	const qb = await dbs.get_connection();
	try {
		var now = new Date();
		const user = await jwt.verify(object1.token, accessTokenSecret);
		let customer = await qb.select('name').where('id', user.id).get('users');
		let brokers = await qb.select(['id','token']).where({roll_id: 2,status:1}).get('users');
		let result = brokers.map(a => a.token);
		let result_id = brokers.map(a => '-'+a.id+'-');
		let object_add = {cus_id:user.id,created_at:dateFormat(now,'yyyy-m-d H:MM:ss'),updated_at:dateFormat(now,'yyyy-m-d H:MM:ss'),for_broker:result_id.toString()};
		
		if (object1.assign_at){
			object_add.assign_at = convertGMT(object1.assign_at);
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
		qb.insert('notifications', {
      booking_id: book_now.insert_id,
      cus_id: user.id,
      broker_id: result_id.toString(),
      message: `${customer[0].name} have a new mission request`,
      cus_badge: 0,
      brok_badge: 1,
      notification_for: 2,
      status: 'pending',
    });
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
		apiModel.update('book_nows',{id: msg.id},{status: msg.status,broker_id:user.id});

	}else if (msg.status == 'cancelled') {
		notification_change_request(msg, 'cancelled');
		apiModel.update('book_nows',{id: msg.id},{status: msg.status,broker_id:user.id});
	}else if(msg.status == 'rejected'){
		remove_broker(msg);
		return true;
		// console.log(msg);
	}
}

var remove_broker = async function (msg,callback) {
		// console.log(msg);
	const qb = await dbs.get_connection();
	try {
		let users = await qb.select('*').where('id',msg.id).limit(1).get('book_nows');
		let for_broker_string = users[0].for_broker.split(",");
		let index_broker_string = for_broker_string.indexOf('-'+msg.broker_id+'-');
		for_broker_string.splice(index_broker_string,1);
		qb.update('book_nows', {for_broker: for_broker_string.toString()}, {id:msg.id});
		return true;
	} catch (err) {
		return false;
	} finally {
		qb.disconnect();
	}
}


var notification_change_request = async function (msg,statu_s,callback) {
	const qb = await dbs.get_connection();
	try {
    var FCM = require('fcm-node');
    var serverKey = process.env.cus_key;
    var fcm = new FCM(serverKey);
    const users = await qb
      .select(['users.id', 'users.name', 'users.token'])
      .where('book_nows.id', msg.id)
      .limit(1)
      .from('book_nows')
      .join('users', 'users.id=book_nows.cus_id')
      .get();

    let brokers = await qb
      .select(['name'])
      .where({ id: msg.broker_id })
      .limit(1)
      .get('users');

    let username = brokers[0].name ? brokers[0].name : 'Broker';
    let message_s = username + ' has accepted your request';
    if (statu_s == 'cancelled') {
      message_s = username + ' has cancelled your request';
    }
    qb.insert('notifications', {
      booking_id: msg.id,
      cus_id: users[0].id,
      broker_id: msg.broker_id,
      message: message_s,
      cus_badge: 1,
      brok_badge: 0,
      notification_for: 1,
      status: statu_s,
    });
    // console.log(message_s);
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
    fcm.send(message, function (err, response) {
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
    return false;
  } finally {
    qb.disconnect();
  }
}


var notification_s = async function (msg,result,callback) {
	try {
		
		var FCM = require('fcm-node');
		let serverKey = process.env.cus_key;
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
	} finally {
    qb.disconnect();
  }
}