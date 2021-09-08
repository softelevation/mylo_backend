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
	user_location: user_location,
	travel_to_booking: travel_to_booking,
	arrived_on_destination: arrived_on_destination,
	finish_mission: finish_mission,
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


var remove_notification_badge = async function (msg) {
  try {
		let user_id = '-' + msg.broker_id + '-';
    let users = await msg.qb
      .select(['id', 'broker_id'])
      .where('id', msg.id)
      .get('notifications');
    let for_broker_string = users[0].broker_id.split(',');
    let index_broker_string = for_broker_string.indexOf(user_id);
    for_broker_string.splice(index_broker_string, 1);
    msg.qb.update(
      'notifications',
      { broker_id: for_broker_string.toString() },
      { id: msg.id },
    );
    return true;
  } catch (err) {
    return false;
  } finally {
  }
};

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
			return user.id;
      }else{
				if (msg.id != 'all'){
						remove_notification_badge({
              id: msg.id,
              broker_id: user.id,
              qb: qb,
            });
					return user.id;
				}else{
					let user_id = '-' + user.id + '-';
					let user_notifications = await qb
            .select('id')
            .like('broker_id', user_id)
            .get('notifications');
					for (let user_notification of user_notifications) {
						remove_notification_badge({
              id: user_notification.id,
              broker_id: user.id,
              qb: qb,
            });
          }
						return user.id;
				}
			}
    } catch (err) {
      console.log(err);
    } finally {
      qb.disconnect();
    }
}

var convertGMT = function (date_format, time_zone) {
  let moment = require('moment-timezone').tz(date_format, time_zone);
  return moment.utc().format('YYYY-MM-DD HH:mm:ss');
};

async function add_status(object1) {
	const qb = await dbs.get_connection();
	try {
		var now = new Date();
		const user = await jwt.verify(object1.token, accessTokenSecret);
		let customer = await qb.select('name').where('id', user.id).get('users');
		let brokers = await qb.select(['id','status','token']).where('roll_id','2').get('users');
		// console.log(brokers);
		// let result = brokers.map(a => a.token);

		let result = [];
    for (let i = 0; i < brokers.length; i++) {
      if (brokers[i].token !== null && brokers[i].status == '1')
        result.push(brokers[i].token);
    }

		let result_id = brokers.map(a => '-'+a.id+'-');
		let object_add = {cus_id:user.id,created_at:dateFormat(now,'yyyy-m-d H:MM:ss'),updated_at:dateFormat(now,'yyyy-m-d H:MM:ss'),for_broker:result_id.toString()};
		
		if (object1.assign_at){
			// console.log(object_add.assign_at);
			object_add.assign_at = convertGMT(object1.assign_at, object1.time_zone);
			// dateFormat(object1.assign_at, 'yyyy-m-d H:MM:ss');
		}else{
			object_add.assign_at = dateFormat(now,'yyyy-mm-dd H:MM:ss');
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
      created_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
      updated_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
    });
		notification_s(user.id,result);
		let users = await qb.select('*').where('id',user.id).limit(1).get('users');
		return {
			users: users[0],
			book_now: book_now
		};
	} catch (err) {
		console.log('wwwwwwwwwwwwwwwwwww');
		console.log(err);
		console.log('wwwwwwwwwwwwwwwwwww');
	} finally {
		qb.disconnect();
	}
}

async function travel_to_booking(msg) {
	try {
		const user = await jwt.verify(msg.token, accessTokenSecret);
		apiModel.update('book_nows', { id: msg.id }, { status: 'travel_to_booking' });
		let cus_id = await apiModel.select('book_nows', ['cus_id'], { id: msg.id });
		return cus_id[0];
  } catch (err) {
    return flase;
  } finally {
  }
}

async function arrived_on_destination(msg) {
  try {
		
		console.log('arrived_on_destination');
		console.log(msg);
    const user = await jwt.verify(msg.token, accessTokenSecret);
    apiModel.update('book_nows', { id: msg.id }, { status: 'in_progress' });
		let cus_id = await apiModel.select('book_nows', ['cus_id'], { id: msg.id });
		return cus_id[0];
  } catch (err) {
    return flase;
  } finally {
  }
}


async function finish_mission(msg) {
  try {
    const user = await jwt.verify(msg.token, accessTokenSecret);
		let now = new Date();
    apiModel.update('book_nows', { id: msg.id }, { status: 'completed', finished_at: dateFormat(now,'yyyy-mm-dd H:MM:ss') });
		let cus_id = await apiModel.select('book_nows', ['cus_id'], { id: msg.id });
		return cus_id[0];
  } catch (err) {
    return flase;
  } finally {
  }
}


async function user_location(msg) {
	try {
		// console.log(msg);
		let now = new Date();
		let now_date= dateFormat(now, 'yyyy-mm-dd H:MM:ss');
		const user = await jwt.verify(msg.token, accessTokenSecret);
		let obj = {
      user_id: user.id,
      current_latitude: msg.current_latitude,
      current_longitude: msg.current_longitude,
      current_latitudeDelta: msg.current_latitudeDelta,
      current_longitudeDelta: msg.current_longitudeDelta,
      current_angle: msg.current_angle,
      created_at: now_date,
      updated_at: now_date,
    };
		apiModel.updateOrCreate('user_trackings', obj, { user_id: user.id });
		return {
      current_latitude: msg.current_latitude,
      current_longitude: msg.current_longitude,
      current_latitudeDelta: msg.current_latitudeDelta,
      current_longitudeDelta: msg.current_longitudeDelta,
      current_angle: msg.current_angle
    };
  } catch (err) {
    return flase;
  } finally {
    // qb.disconnect();
  }
}

async function broker_detail(msg) {
	const qb = await dbs.get_connection();
	try {
		const user = await jwt.verify(msg.token, accessTokenSecret);
		let users = await qb.select('*').where('id',user.id).limit(1).get('users');
		let booking_customer = await qb
      .select('cus_id')
      .where('id', msg.id)
      .limit(1)
      .get('book_nows');
		return { customer: booking_customer[0].cus_id, broker: users[0] };
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
	
}


async function change_status(msg) {
	const qb = await dbs.get_connection();
	try {
    const user = await jwt.verify(msg.token, accessTokenSecret);
	let user_detail = await qb.select(['id','name','roll_id']).where('id', user.id).limit(1).get('users');
    let booking_customer = await qb
      .select('cus_id')
      .where('id', msg.id)
      .limit(1)
      .get('book_nows');
    msg.broker_id = user.id;
	msg.roll_id = user_detail[0].roll_id;
	msg.user_name = user_detail[0].name;
    if (msg.status == 'in_progress') {
      notification_change_request(msg, 'in_progress');
      apiModel.update(
        'book_nows',
        { id: msg.id },
        { status: 'accepted', broker_id: user.id },
      );
    } else if (msg.status == 'cancelled') {
      notification_change_request(msg, 'cancelled');
	  if(msg.roll_id == '2'){
		apiModel.update('book_nows',{ id: msg.id },{ status: msg.status, broker_id: user.id });
	  }else{
		apiModel.update('book_nows',{ id: msg.id },{ status: msg.status});
	  }
    } else if (msg.status == 'rejected') {
      remove_broker(msg);
    }
		return true;
  } catch (err) {
    return res.json(halper.api_response(0, 'This is invalid request', {}));
  } finally {
    qb.disconnect();
  }
}

var remove_broker = async function (msg,callback) {
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


var notification_change_request = async function (msg,statu_s) {
	const qb = await dbs.get_connection();
	try {
    var FCM = require('fcm-node');
    var serverKey = process.env.cus_key;
    var fcm = new FCM(serverKey);
	var now = new Date();
	
	let users = {};
	if(msg.roll_id == '2'){
		users = await qb
		  .select(['users.id', 'users.name', 'users.token'])
		  .where('book_nows.id', msg.id).limit(1).from('book_nows').join('users', 'users.id=book_nows.cus_id').get();
	}else{
		users = await qb
		  .select(['users.id', 'users.name', 'users.token'])
		  .where('book_nows.id', msg.id).limit(1).from('book_nows').join('users', 'users.id=book_nows.broker_id').get();
	}

    // let brokers = await qb.select(['name']).where({ id: msg.broker_id })
      // .limit(1)
      // .get('users');
	// console.log(users);
    let username = msg.user_name ? msg.user_name : 'Broker';
    let message_s = username + ' has accepted your request';
    if (statu_s == 'cancelled') {
      message_s = username + ' has cancelled your request';
    }
	if(msg.roll_id == '2'){
		qb.insert('notifications', {
		  booking_id: msg.id,
		  cus_id: users[0].id,
		  broker_id: msg.broker_id,
		  message: message_s,
		  cus_badge: 1,
		  brok_badge: 0,
		  notification_for: 1,
		  status: statu_s,
		  created_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
		  updated_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
		});
	}else{
		qb.insert('notifications', {
		  booking_id: msg.id,
		  cus_id: msg.broker_id,
		  broker_id: users[0].id,
		  message: message_s,
		  cus_badge: 0,
		  brok_badge: 1,
		  notification_for: 1,
		  status: statu_s,
		  created_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
		  updated_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
		});
	}
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
      } else {
        console.log(response);
      }
    });
    return true;
  } catch (err) {
    return false;
  } finally {
    qb.disconnect();
  }
}


var notification_s = async function (msg,result,callback) {
	const qb = await dbs.get_connection();
	try {
		var FCM = require('fcm-node');
		let serverKey = process.env.cus_key;
		var fcm = new FCM(serverKey);
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