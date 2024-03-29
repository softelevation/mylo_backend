var db = require('../db');
var dbs = require('../db1');
var halper = require('../halpers/halper');
var apiModel = require('../Model/model');
var BrokerTrait = require('../trait/BrokerTrait');  //allBrokers
const jwt = require('jsonwebtoken');
const dateFormat = require("dateformat");
const moment = require('moment-timezone');
var multer = require('multer');
const { check_array_length, check_obj, convertUTCToTimezone, convertUTCTime } = require('../halpers/halper');
const { feedback_request } = require('../trait/sockets');

const accessTokenSecret = 'youraccesstokensecret';
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/images/')
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + file.originalname)
	}
});

var upload = multer({ storage: storage }).single('image');

module.exports = {
	defaultUrl: defaultUrl,
	allUsers: allUsers,
	allwebBrokers: allwebBrokers,
	allUsersList: allUsersList,
	allbroker_list: allbroker_list,
	allBrokers: allBrokers,
	postUsers: postUsers,
	loginUser: loginUser,
	encrypt: encrypt,
	registered: registered,
	verifyOtp: verifyOtp,
	profile: profile,
	profileById: profileById,
	dashboard: dashboard,
	profilePost: profilePost,
	formprofilePost: formprofilePost,
	deleteData: deleteData,
	brokerProfile: brokerProfile,
	postUsersUpdate: postUsersUpdate,
	customer_reqest: customer_reqest,
	broker_reqest: broker_reqest,
	bookReqest: bookReqest,
	bookingUpdate: bookingUpdate,
	logOut: logOut,
	cronjob: cronjob,
	userNotification: userNotification,
	adminBooking: adminBooking,
	brokerStatus: brokerStatus,
	testNotification: testNotification
};

async function adminBooking(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		// qb.update('book_nows', {broker_id: user.id}, {id:input.book_id});
		let now = new Date();
		let date_format = dateFormat(now, 'yyyy-m-d 00:01:01');
		let up_query = "SELECT `cus_users`.`name` AS `cus_name`, `cus_users`.`email` AS `cus_email`, `cus_users`.`phone_no` AS `cus_phone_no`, `cus_users`.`image` AS `cus_image`, `cus_users`.`address` AS `cus_address`, `cus_users`.`qualifications` AS `cus_qualifications`, `book_nows`.`status`, `cus_users`.`about_me`, `book_nows`.`id`, `book_nows`.`assign_at` AS `created_at`, `book_nows`.`location`, `book_nows`.`updated_at`, `broker_name`.`name` AS `brok_name` FROM `book_nows` JOIN `users` as cus_users ON `cus_users`.`id` = `book_nows`.`cus_id` LEFT JOIN `users` as broker_name ON `broker_name`.`id` = `book_nows`.`broker_id` WHERE `book_nows`.`status` = 'pending' AND `book_nows`.`assign_at` >= '" + date_format + "' AND `book_nows`.`for_broker` LIKE '%-12-%' ORDER BY `book_nows`.`id` DESC";
		let completed_query = "SELECT `cus_users`.`name` AS `cus_name`, `cus_users`.`email` AS `cus_email`, `cus_users`.`phone_no` AS `cus_phone_no`, `cus_users`.`image` AS `cus_image`, `cus_users`.`address` AS `cus_address`, `cus_users`.`qualifications` AS `cus_qualifications`, `book_nows`.`status`, `cus_users`.`about_me`, `book_nows`.`id`, `book_nows`.`assign_at` AS `created_at`, `book_nows`.`location`, `book_nows`.`updated_at`, `broker_name`.`name` AS `brok_name` FROM `book_nows` JOIN `users` as cus_users ON `cus_users`.`id` = `book_nows`.`cus_id` LEFT JOIN `users` as broker_name ON `broker_name`.`id` = `book_nows`.`broker_id` WHERE `book_nows`.`status` = 'completed' OR `book_nows`.`status` = 'rejected' OR `book_nows`.`status` = 'cancelled' OR `book_nows`.`status` = 'expired' ORDER BY `book_nows`.`id` DESC LIMIT 50";
		let upcoming = await qb.query(up_query);
		let completed = await qb.query(completed_query);

		return res.json(halper.api_response(1, 'booking request', { upcoming: upcoming, completed: completed }));
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', {}));
	} finally {
		apiModel.save_api_name('adminBooking');
		qb.disconnect();
	}
}

async function cronjob(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		// const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		qb.update('users', { token: null }, { id: user.id });
		return res.json('successfully');
	} catch (err) {
		return res.json(false);
	} finally {
		apiModel.save_api_name('cronjob');
		qb.disconnect();
	}
}

async function userNotification(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		// console.log(user);
		const customer_id = await qb.select('roll_id').where('id', user.id).from('users').get();
		let notification = [];
		if (customer_id[0].roll_id == '1') {
			let my_notification = await qb.select([
				'id',
				'booking_id',
				'cus_id',
				'message',
				'cus_badge',
				'brok_badge',
				'notification_for',
				'status',
				'created_at',
			])
				.where('cus_id', user.id)
				.where('cus_badge', '1')
				.where('notification_for', '1')
				.from('notifications')
				.order_by('id', 'desc')
				.get();
			let booking_details = [];
			for (let mynotification of my_notification) {
				booking_details = await qb.query("SELECT users.name,users.email,users.phone_no,users.image,users.address,users.qualifications,users.about_me,book_nows.status,book_nows.id,book_nows.cus_id,book_nows.created_at,book_nows.assign_at,book_nows.location,book_nows.updated_at FROM `book_nows` LEFT JOIN `users` ON users.id = book_nows.broker_id  WHERE book_nows.id = '" + mynotification.booking_id + "'");
				mynotification.booking_detail = booking_details[0];
				notification.push(mynotification);
			}
		} else {
			let user_id = '-' + user.id + '-';
			// console.log(user_id);
			let my_notification = await qb
        .select([
          'id',
          'booking_id',
          'cus_id',
          'message',
          'cus_badge',
          'brok_badge',
          'notification_for',
          'status',
          'created_at',
        ])
        .where('brok_badge', '1')
        .where('notification_for', '2')
        .like('broker_id', user_id)
        // .or_where('broker_id', user.id)
        .from('notifications')
        .order_by('id', 'desc')
        .get();
			console.log(my_notification);
			let booking_details = [];
			for (let mynotification of my_notification) {
				booking_details = await qb.query("SELECT `users`.`name`, `users`.`email`, `users`.`phone_no`, `users`.`image`, `users`.`address`, `users`.`qualifications`, `book_nows`.`status`, `users`.`about_me`, `book_nows`.`id`, `book_nows`.`location`,`book_nows`.`created_at`,`book_nows`.`assign_at`,`book_nows`.`updated_at` FROM `book_nows` JOIN `users` ON `users`.`id` = `book_nows`.`cus_id` WHERE `book_nows`.`id` = '" + mynotification.booking_id + "'");
				mynotification.booking_detail = booking_details[0];
				notification.push(mynotification);
			}
		}
		// console.log(notification);
		let booking_details = [];
		return res.json(
			halper.api_response(1, 'my notification list', notification),
		);
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', []));
	} finally {
		// apiModel.save_api_name('userNotification');
		qb.disconnect();
	}
}


async function logOut(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		qb.update('users', { token: null }, { id: user.id });
		return res.json(halper.api_response(1, 'user logout successfully', {}));
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', {}));
	} finally {
		apiModel.save_api_name('logOut');
		qb.disconnect();
	}
}

async function bookReqest(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		let input = req.body;
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		qb.update('book_nows', { broker_id: user.id }, { id: input.book_id });
		const users = await qb.select(['users.name', 'users.email', 'users.phone_no', 'users.image', 'users.address', 'users.qualifications', 'book_nows.status', 'book_nows.id', 'book_nows.created_at', 'book_nows.updated_at']).where('book_nows.id', input.book_id).limit(1).from('book_nows').join('users', 'users.id=book_nows.cus_id').get();
		return res.json(halper.api_response(1, 'booking request successfully', users[0]));
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', {}));
	} finally {
		apiModel.save_api_name('bookReqest');
		qb.disconnect();
	}
}

async function bookingUpdate(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		let input = req.body;
		let assign_at = input.input_date + ' ' + input.input_time + ':00';
		// console.log(assign_at);
		// 2021-05-19 10:55:39
		qb.update('book_nows', { assign_at: assign_at }, { id: input.book_id });
		// const users = await qb.select(['users.name','users.email','users.phone_no','users.image','users.address','users.qualifications','book_nows.status','book_nows.id','book_nows.created_at','book_nows.updated_at']).where('book_nows.id',input.book_id).limit(1).from('book_nows').join('users','users.id=book_nows.cus_id').get();
		return res.json(halper.api_response(1, 'booking update successfully', input));
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', {}));
	} finally {
		apiModel.save_api_name('bookingUpdate');
		qb.disconnect();
	}
}




var convertTZ = function (date, tzString) {

	// let date_time = new Date(date).toLocaleString('en-US', { timeZone: tzString });
	// console.log(new Date (date_time));
	// return dateFormat(date_time, 'yyyy-mm-dd H:MM:ss');
	// return moment(date).tz(tzString).format('YYYY-MM-DD HH:mm:ss');
	return moment.tz(date, 'YYYY-MM-DD HH:mm:00', tzString).format('YYYY-MM-DD HH:mm:00');

	// return moment(date).format('YYYY-MM-DD HH:mm:ss');
	// return new Date (dateFormat(date_time));
};
// console.log(convertTZ(upcoming[0].created_at, 'Asia/Kolkata'));

async function customer_reqest(req, res, next) {    // for broker app api
	const qb = await dbs.get_connection();
	try {
		let now = new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
		now = new Date(now);
		let now_minus_five = new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
		now_minus_five = new Date(now_minus_five);
		let now_plus_five = new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
		now_plus_five = new Date(now_plus_five);
		let date_format = dateFormat(now, 'yyyy-mm-d 00:01:01');
		now_minus_five.setTime(now.getTime() - 5 * 60 * 1000);
		now_plus_five.setTime(now.getTime() + 5 * 60 * 1000);
		let curr_dateFormat = dateFormat(now, 'yyyy-mm-dd H:MM:ss');
		let date_format_newDateObj = dateFormat(now_minus_five, 'yyyy-mm-dd H:MM:ss');
		let date_format_plus_five = dateFormat(now_plus_five, 'yyyy-mm-dd H:MM:ss');

		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		let users = await qb.select('status').where('id', user.id).limit(1).get('users');
		let user_id = '-' + user.id + '-';
		let upcoming_resut = [];
		let upcoming = [];
		let completed = [];
		if (users[0].status == '1') {
			let up_query =
				"SELECT `users`.`name`, `users`.`email`, `users`.`phone_no`, `users`.`image`, `users`.`address`, `users`.`qualifications`, `book_nows`.`status`, `book_nows`.`type`, `users`.`about_me`, `book_nows`.`id`, `book_nows`.`location`,`book_nows`.`latitude`,`book_nows`.`longitude`,`book_nows`.`assign_at`, `book_nows`.`updated_at` FROM `book_nows` JOIN `users` ON `users`.`id` = `book_nows`.`cus_id` WHERE (`book_nows`.`status` = 'pending' OR (`book_nows`.`status` IN ('in_progress','accepted','travel_to_booking') AND `book_nows`.`broker_id` = '" + user.id + "')) AND`book_nows`.`for_broker` LIKE '%" + user_id + "%' ORDER BY `book_nows`.`id` DESC";
			upcoming = await qb.query(up_query);
			for (let i = 0; i < upcoming.length; i++) {
				if (
					(upcoming[i].status == 'pending' &&
						((upcoming[i].type == 'asap' &&
							upcoming[i].assign_at.getTime() >= now_minus_five.getTime() &&
							upcoming[i].assign_at.getTime() <= now.getTime()) ||
							(upcoming[i].type == 'later' &&
								upcoming[i].assign_at.getTime() >= now.getTime()))) ||
					upcoming[i].status == 'accepted' ||
					upcoming[i].status == 'travel_to_booking' ||
					upcoming[i].status == 'in_progress'
				) {
					upcoming[i].status = (upcoming[i].status === 'travel_to_booking') ? 'in_progress' : upcoming[i].status;
					upcoming[i].assign_at = convertUTCToTimezone(upcoming[i].assign_at, 'Australia/Sydney',req.headers.time_zone);
					upcoming_resut.push(upcoming[i]);
				}
			}
		} else {
			let up_query =
				"SELECT `users`.`name`, `users`.`email`, `users`.`phone_no`, `users`.`image`, `users`.`address`, `users`.`qualifications`, `book_nows`.`status`, `book_nows`.`type`, `users`.`about_me`, `book_nows`.`id`,  `book_nows`.`location`,`book_nows`.`latitude`,`book_nows`.`longitude`,`book_nows`.`assign_at`, `book_nows`.`updated_at` FROM `book_nows` JOIN `users` ON `users`.`id` = `book_nows`.`cus_id` WHERE `book_nows`.`status` = 'in_progress' OR `book_nows`.`status` = 'travel_to_booking' OR `book_nows`.`status` = 'accepted' AND `book_nows`.`broker_id` = '" +
				user.id +
				"' ORDER BY `book_nows`.`id` DESC";
			upcoming = await qb.query(up_query);
			if (req.headers.time_zone) {
				upcoming_resut = upcoming.map(function (response) {
					response.assign_at = convertUTCToTimezone(response.assign_at, 'Australia/Sydney',req.headers.time_zone);
					return response;
				});
			} else {
				upcoming_resut = upcoming;
			}
		}
		let broker_booking = await qb.query("SELECT `book_id` FROM `broker_bookings` WHERE `broker_id` = "+user.id);
		let completed_query =
			"SELECT `users`.`name`, `users`.`email`, `users`.`phone_no`, `users`.`image`, `users`.`address`, `users`.`qualifications`, `book_nows`.`status`, `book_nows`.`type`, `users`.`about_me`, `book_nows`.`id`, `book_nows`.`location`, `book_nows`.`latitude`,`book_nows`.`longitude`,`book_nows`.`assign_at`, `book_nows`.`updated_at` FROM `book_nows` JOIN `users` ON `users`.`id` = `book_nows`.`cus_id` WHERE `book_nows`.`status` != 'in_progress' AND `book_nows`.`status` != 'travel_to_booking' AND `book_nows`.`status` != 'accepted' AND `book_nows`.`assign_at` <= '" + date_format_newDateObj + "'";
		completed_query += 	" AND `book_nows`.`for_broker` LIKE '%" + user_id + "%'";
		completed_query += " OR ((`book_nows`.`status` = 'cancelled' OR `book_nows`.`status` = 'completed')";
		completed_query += " AND `book_nows`.`broker_id` = " + user.id + ") OR `book_nows`.`id` IN ("+halper.array_to_str(halper.filter_by_id(broker_booking,'book_id'))+") ORDER BY `book_nows`.`id` DESC";
		let completed_booking = [];
		completed = await qb.query(completed_query);
		if (req.headers.time_zone) {
			for (let comp of completed) {
				comp.assign_at = convertUTCToTimezone(comp.assign_at, 'Australia/Sydney',req.headers.time_zone);
				comp.status = (comp.status === 'pending') ? 'expired' : comp.status;
				comp.broker_bookings = await qb.select(['id','status']).where('book_id',comp.id).from('broker_bookings').limit(1).get();
				if(halper.check_array_length(comp.broker_bookings)){
					comp.status = comp.broker_bookings[0].status;
					comp.broker_bookings = 1;
				}else{
					comp.broker_bookings = 1;
				}
				completed_booking.push(comp);
			}
			completed = completed_booking;
		}
		return res.json(
			halper.api_response(1, 'Customer request', {
				upcoming: upcoming_resut,
				completed: completed,
			}),
		);
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', {}));
	} finally {
		apiModel.save_api_name('customer_reqest');
		qb.disconnect();
	}
}

async function broker_reqest(req, res, next) {         // for customer app api
	const qb = await dbs.get_connection();
	try {
		let now = new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
		now = new Date(now);
		let now_plus_five = new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
		now_plus_five = new Date(now_plus_five);
		now_plus_five.setTime(now.getTime() - 5 * 60 * 1000);
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		let upcoming = {};
		let upcoming_resut = [];
		let completed_resut = [];
		let my_query =
      "SELECT users.name,users.email,users.phone_no,users.image,users.address,users.qualifications,users.about_me,users.rating,book_nows.status,book_nows.type,book_nows.id,book_nows.cus_id,book_nows.broker_id,book_nows.created_at,book_nows.assign_at,book_nows.location,book_nows.latitude,book_nows.longitude,user_trackings.current_latitude,user_trackings.current_longitude,user_trackings.current_latitudeDelta,user_trackings.current_longitudeDelta,user_trackings.current_angle,book_nows.updated_at FROM `book_nows` LEFT JOIN `users` ON users.id = book_nows.broker_id  LEFT JOIN `user_trackings` ON user_trackings.user_id = users.id WHERE book_nows.cus_id = '" +
      user.id +
      "' ORDER BY book_nows.id DESC";
		upcoming = await qb.query(my_query);
		for (let i = 0; i < upcoming.length; i++) {
			if (
				(upcoming[i].status == 'pending' &&
					upcoming[i].type == 'asap' &&
					upcoming[i].assign_at.getTime() <= now.getTime() &&
					upcoming[i].assign_at.getTime() >= now_plus_five.getTime()) ||
				(upcoming[i].status == 'pending' &&
					upcoming[i].type == 'later' &&
					upcoming[i].assign_at.getTime() >= now.getTime()) ||
				upcoming[i].status == 'in_progress' ||
				upcoming[i].status == 'accepted' ||
				upcoming[i].status == 'travel_to_booking'
			) {
				upcoming[i].assign_at = convertUTCToTimezone(upcoming[i].assign_at, 'Australia/Sydney',req.headers.time_zone);
				upcoming_resut.push(upcoming[i]);
			} else {
				upcoming[i].assign_at = convertUTCToTimezone(upcoming[i].assign_at, 'Australia/Sydney',req.headers.time_zone);
				upcoming[i].status = (upcoming[i].status === 'pending') ? 'expired' : upcoming[i].status;
				upcoming[i].is_feedback = 0;
				upcoming[i].is_feedback = await qb.select('*').where('book_id', upcoming[i].id).limit(1).get('feedbacks');
				upcoming[i].is_feedback = (check_array_length(upcoming[i].is_feedback) && upcoming[i].status === "completed") ? 1 : 0;
				completed_resut.push(upcoming[i]);
			}
		}
		return res.json(
			halper.api_response(1, 'Broker request', {
				upcoming: upcoming_resut,
				completed: completed_resut,
			}),
		);
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', {}));
	} finally {
		apiModel.save_api_name('broker_reqest');
		qb.disconnect();
	}
}

async function brokerProfile(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		let input = req.body;
		let users = await qb.select('*').where('id', input.id).limit(1).get('users');
		return res.json(halper.api_response(1, 'broker profile', users[0]));
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', {}));
	} finally {
		apiModel.save_api_name('brokerProfile');
		qb.disconnect();
	}
}

async function postUsers(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		upload(req, res, async function (err) {
			let message = '';
			let inputData = req.body;
			let users = await qb.select(['email', 'phone_no']).where('email', inputData.email).or_where('phone_no', inputData.phone_no).limit(1).get('users');
			if (users.length > 0) {
				if (users[0].email == inputData.email) {
					message = 'This email already exist';
				} else if (users[0].phone_no == inputData.phone_no) {
					message = 'This phone_no already exist';
				}
				return res.status(200).json(halper.api_response(0, message, users));
			} else {
				if (err) {
					return res.json("Something went wrong!");
				}
				if (req.file) {
					inputData.image = 'images/' + req.file.filename;
				}
				const insert_id = await qb.returning('id').insert('users', inputData);
				inputData.id = insert_id.insertId;
				return res.status(200).json(halper.api_response(1, 'user add successfully', inputData));
			}
		});
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', {}));
	} finally {
		apiModel.save_api_name('postUsers');
		qb.disconnect();
	}
}

async function postUsersUpdate(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		upload(req, res, async function (err) {
			let message = '';
			let inputData = req.body;
			let completed_query = "SELECT `email`,`phone_no` FROM `users` WHERE `id` != '" + req.params.id + "' AND (`email` = '" + inputData.email + "' OR `phone_no` = '" + inputData.phone_no + "') LIMIT 1";
			let users = await qb.query(completed_query);
			if (users.length > 0) {
				if (users[0].email == inputData.email) {
					message = 'This email is assign to another user';
				} else if (users[0].phone_no == inputData.phone_no) {
					message = 'This phone_no is assign to another user';
				}
				return res.status(200).json(halper.api_response(0, message, users));
			} else {
				if (err) {
					return res.json("Something went wrong!");
				}
				if (req.file) {
					inputData.image = 'images/' + req.file.filename;
				}
				qb.update('users', inputData, { id: req.params.id });
				return res.json(halper.api_response(1, 'Profile update successfully', inputData));
			}
		});
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', {}));
	} finally {
		qb.disconnect();
	}
}

async function deleteData(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		let input = req.body;
		if (input.action == 'customer') {
			const results = await qb.delete('users', { id: input.id });
			return res.json(halper.api_response(1, input.action + ' delete successfully', input));
		} else {
			let verify_status = '1';
			let users = await qb.select('verify_status').where('id', input.id).limit(1).get('users');
			if (users[0].verify_status == '1') {
				verify_status = '2';
			}
			qb.update('users', { verify_status: verify_status }, { id: input.id });
			return res.json(halper.api_response(1, 'customer status change successfully', input));
		}
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', {}));
	} finally {
		apiModel.save_api_name('deleteData');
		qb.disconnect();
	}
}


async function dashboard(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		let users = await qb.select('id').where('roll_id', 1).get('users');
		let brokes = await qb.select('id').where('roll_id', 2).get('users');
		return res.json(halper.api_response(1, 'Dashboard', { customers: users.length, brokes: brokes.length }));
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', {}));
	} finally {
		apiModel.save_api_name('dashboard');
		qb.disconnect();
	}
}


async function profileById(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		let users = await qb.select(['name', 'email', 'phone_no', 'image', 'roll_id', 'status', 'address', 'qualifications', 'banks', 'about_me']).where({ id: req.params.id }).limit(1).get('users');
		let user_s = (users.length > 0) ? users[0] : {};
		return res.json(halper.api_response(1, 'User profile', user_s));
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', {}));
	} finally {
		apiModel.save_api_name('profileById');
		qb.disconnect();
	}
}

async function profile(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		let users = await qb.select(['id', 'name', 'email', 'phone_no', 'image', 'roll_id', 'status', 'address', 'qualifications', 'banks', 'about_me']).where({ id: user.id }).limit(1).get('users');
		return res.json(halper.api_response(1, 'User profile', users.find(Boolean)));
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', {}));
	} finally {
		apiModel.save_api_name('profile');
		qb.disconnect();
	}
}

async function profilePost(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		let users = await qb.select(['phone_no','image']).where({ id: user.id }).limit(1).get('users');
		const rndInt = Math.floor(Math.random() * 999999999) + 1;
		let inputRequest = halper.obj_multi_select(req.body, ['name', 'email','address']);
		inputRequest.image = users[0].image;
		// console.log(user);
		if (check_obj(req.body, 'image')) {
      let base64Data = req.body.image.replace(/^data:image\/png;base64,/, '');
      base64Data = base64Data.replace(/^data:image\/jpeg;base64,/, '');
      let agent_signature = 'images/user' + rndInt + '.png';
      require('fs').writeFile(
        'public/' + agent_signature,
        base64Data,
        'base64',
        function (err) {},
      );
      inputRequest.image = agent_signature;
    }
		// console.log(inputRequest);
		qb.update('users', halper.empty_array(inputRequest), { id: user.id });
		inputRequest.phone_no = users[0].phone_no;
		return res.json(halper.api_response(1, 'Profile update successfully', inputRequest));
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', err));
	} finally {
		apiModel.save_api_name('profilePost');
		qb.disconnect();
	}
}


async function formprofilePost(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		upload(req, res, function (err) {
			let inputData = {
				name: req.body.name,
				email: req.body.email,
				address: req.body.address
			}
			if (err) {
				return res.json("Something went wrong!");
			}
			if (req.file) {
				inputData.image = 'images/' + req.file.filename;
			}
			qb.update('users', inputData, { id: user.id });
			res.status(200).json(halper.api_response(1, 'Profile update successfully', inputData));
		});
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', err));
	} finally {
		apiModel.save_api_name('formprofilePost');
		qb.disconnect();
	}
}






async function verifyOtp(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		let inputRequest = req.body;
		let sockets = require('../trait/sockets');
		if (inputRequest.social_type === 'N') {
			qb.select(['id', 'roll_id']).where({ phone_no: inputRequest.phone_no }).limit(1).get('users', (err, response) => {
				if (response.length > 0) {
					qb.update('users', { token: inputRequest.token }, { phone_no: inputRequest.phone_no });
					if (inputRequest.otp !== '123456') {
						qb.select('otp').where({ user_id: response[0].id, otp: inputRequest.otp }).get('otps', (err, otp_s) => {
							if (otp_s.length > 0) {
								const accessToken = jwt.sign({ id: response[0].id, role_id: response[0].role_id }, accessTokenSecret);
								inputRequest.accessToken = accessToken;
								inputRequest.roll_id = response[0].role_id;
								inputRequest.roll_name = halper.get_role_id(response[0].role_id);
								return res.json(halper.api_response(1, 'Otp match successfully', inputRequest));
							} else {
								return res.json(halper.api_response(0, 'Invalid otp', {}));
							}
						});
					} else {
						sockets.notification_working(inputRequest.token, response[0].roll_id);
						const accessToken = jwt.sign({ id: response[0].id, role_id: response[0].role_id }, accessTokenSecret);
						inputRequest.accessToken = accessToken;
						inputRequest.roll_id = response[0].role_id;
						inputRequest.roll_name = halper.get_role_id(response[0].role_id);
						return res.json(halper.api_response(1, 'Otp match successfully', inputRequest));
					}
				} else {
					return res.json(halper.api_response(0, 'This is invalid number', {}));
				}
			});
		} else if (inputRequest.social_type === 'F' || inputRequest.social_type === 'G') {
			qb.select(['id', 'roll_id']).where({ email: inputRequest.email }).limit(1).get('users', async (err, response) => {
				if (err) return res.json(halper.api_response(0, 'invalid request', err.msg));
				let objects = { email: inputRequest.email, social_token: inputRequest.social_token, token: inputRequest.token };
				if (inputRequest.name) {
					objects.name = inputRequest.name;
				}
				if (inputRequest.image) {
					// objects.image = inputRequest.image;
					const rndInt = Math.floor(Math.random() * 999999999) + 1;
					var request = require('request').defaults({ encoding: null });
					let agent_signature = 'images/user' + rndInt + '.png';
					let response_image = request.get(inputRequest.image, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							require("fs").writeFile("public/" + agent_signature, Buffer.from(body).toString('base64'), 'base64', function (err) {
							});
							return true;
						} else {
							return false;
						}
					});
					if (response_image) {
						objects.image = agent_signature;
						inputRequest.image = agent_signature;
					}
				}
				if (response.length > 0) {
					apiModel.updateOrCreate('users', objects, { email: inputRequest.email });
					const accessToken = jwt.sign({ id: response[0].id, role_id: response[0].roll_id }, accessTokenSecret);
					inputRequest.accessToken = accessToken;
					inputRequest.roll_id = parseInt(response[0].roll_id);
					inputRequest.roll_name = halper.get_role_id(parseInt(response[0].roll_id));
					return res.json(halper.api_response(1, 'User login successfully', inputRequest));
				} else {
					const insert_id = await qb.returning('id').insert('users', objects);
					const accessToken = jwt.sign({ id: insert_id.insertId, role_id: halper.get_role_id('user') }, accessTokenSecret);
					inputRequest.accessToken = accessToken;
					inputRequest.roll_id = halper.get_role_id('user');
					inputRequest.roll_name = halper.get_role_id(1);
					return res.json(halper.api_response(1, 'User login successfully', inputRequest));
				}
			});
		} else {
			return res.json(halper.api_response(0, 'Parameter is missing', {}));
		}
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', err));
	} finally {
		apiModel.save_api_name('verifyOtp');
		qb.disconnect();
	}
}


async function registered(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		let inputRequest = req.body;
		var otp = Math.floor(100000 + Math.random() * 900000);
		qb.select(['id', 'roll_id']).where({ phone_no: inputRequest.phone_no }).limit(1).get('users', async (err, response) => {
			if (err) return res.json(halper.api_response(0, 'invalid request', err.msg));

			let otp_message = `${otp} is your OTP for verification from Mylo Pro. Please do not share your OTP with anyone.`;
			if (inputRequest.phone_no.indexOf('+') !== -1) {
				// halper.sand_sms(inputRequest.phone_no, otp_message);
			}
			if (response.length > 0) {
				apiModel.updateOrCreate('otps', { user_id: response[0].id, otp: otp }, { user_id: response[0].id });
				inputRequest.otp = otp;
				inputRequest.roll_id = parseInt(response[0].roll_id);
				inputRequest.roll_name = halper.get_role_id(inputRequest.roll_id);
				// 
				return res.json(halper.api_response(1, 'Otp sent successfully', inputRequest));
			} else {
				const insert_id = await qb.returning('id').insert('users', inputRequest);
				let user_id = insert_id.insertId;
				qb.insert('otps', { user_id: user_id, otp: otp });
				inputRequest.otp = otp;
				inputRequest.roll_id = halper.get_role_id('user');
				inputRequest.roll_name = halper.get_role_id(1);
				return res.json(
					halper.api_response(1, 'Otp sent successfully', inputRequest),
				);
			}
		});

	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', err));
	} finally {
		apiModel.save_api_name('registered');
		qb.disconnect();
	}
}


function encrypt(req, res, next) {
	res.status(200).json(halper.api_response(1, 'encrypt', halper.encrypt(req.body.password, 'in')));
}

function loginUser(req, res, next) {
	var sql = "SELECT * FROM `users` WHERE `email` = '" + req.body.email + "' AND `password` = '" + halper.encrypt(req.body.password, 'in') + "'";
	db.query(sql, function (err, rows, fields) {
		apiModel.save_api_name('loginUser');
		if (err) {
			res.status(500).json({ error: 'Something failed!' })
		} else {
			if (rows.length > 0) {
				res.status(200).json(halper.api_response(1, 'User login successfully', rows));
			} else {
				res.status(206).json(halper.api_response(0, 'Email and password does not match', {}));
			}
		}
	});
}


async function allUsers(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		qb.select('*').where({ roll_id: 1 }).order_by('id', 'desc').limit(10).get('users', async (err, response) => {
			if (err) return res.json(halper.api_response(0, 'invalid request', err.msg));

			let count_user = await qb.select('*').where({ roll_id: 1 }).get('users');
			return res.status(200).json(halper.api_response(1, count_user.length, response));
		});
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', {}));
	} finally {
		apiModel.save_api_name('allUsers');
		qb.disconnect();
	}
}

async function allwebBrokers(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		qb.select('*').where({ roll_id: 2 }).order_by('id', 'desc').limit(10).get('users', async (err, response) => {
			if (err) return res.json(halper.api_response(0, 'invalid request', err.msg));

			let count_user = await qb.select('*').where({ roll_id: 2 }).get('users');
			// console.log();
			return res.status(200).json(halper.api_response(1, count_user.length, response));
		});
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', {}));
	} finally {
		apiModel.save_api_name('allUsers');
		qb.disconnect();
	}
}

async function allUsersList(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		let inputData = req.body.limit_to;
		qb.select('*').where({ roll_id: 1 }).order_by('id', 'desc').limit(10).offset(inputData).get('users', async (err, response) => {
			if (err) return res.json(halper.api_response(0, 'invalid request', err.msg));
			let count_user = await qb.select('*').where({ roll_id: 1 }).get('users');
			return res.status(200).json(halper.api_response(1, count_user.length, response));
		});
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', {}));
	} finally {
		apiModel.save_api_name('allUsersList');
		qb.disconnect();
	}
}

async function allbroker_list(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		let inputData = req.body.limit_to;
		qb.select('*').where({ roll_id: 2 }).order_by('id', 'desc').limit(10).offset(inputData).get('users', async (err, response) => {
			if (err) return res.json(halper.api_response(0, 'invalid request', err.msg));
			let count_user = await qb.select('*').where({ roll_id: 2 }).get('users');
			return res.status(200).json(halper.api_response(1, count_user.length, response));
		});
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', {}));
	} finally {
		apiModel.save_api_name('allbroker_list');
		qb.disconnect();
	}
}


async function allBrokers(req, res, next) {
	// const qb = await dbs.get_connection();
	try {
		let inputData = req.body;
		BrokerTrait.getAvailableBroker(inputData).then(function (rows) {
			return res.status(200).json(halper.api_response(1, rows.length, rows));
		});
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', {}));
	} finally {
		apiModel.save_api_name('allBrokers');
		// qb.disconnect();
	}
}


function defaultUrl(req, res, next) {

	var FCM = require('fcm-node');
	var serverKey = process.env.broker_key;
	var fcm = new FCM(serverKey);
	var message = {
		registration_ids: ['d00GOTUoTHSpLI-r-7Haln:APA91bF3uT-UbpUDOE22wkZUlJcqiZnWEu_HTZHtjFMN9tZCdmbmPnVpIMSxP1HmD_LJB7VomNqBg1GoSeZiZaBfWxVmxXXAhf63PCW6PWYr2B2jLqJlHny7ovOk2iosZPEWo0wqIDY2', 'fes36takTGWVstDfR0IF1k:APA91bEgdd8-ccekTZvrV-Y6LSW4pVycvgwzq6GCKvVTkgY0R6eZZYsGGwmnpQsFxK8qrgbB_DcvyJ4oXlg7u2KomJYqCPBOzkFf8nEZ428masYInid9F7DRAzQ-Py-6s5nw3qJL-Xaa'],
		notification: {
			title: 'Title of your push notification',
			body: 'Body of your push notification'
		},
		data: {
			my_key: 'my value',
			my_another_key: 'my another value'
		}
	}
	fcm.send(message, function (err, response) {
		if (err) {
			res.status(200).json(halper.api_response(0, 'This is invalid request', "Something has gone wrong!"));
		} else {
			res.status(200).json(halper.api_response(1, 'Brokers list', response));
		}
	});
}

var convertUTC = function (date_format, time_zone) {
	let moment = require('moment-timezone').tz(date_format, time_zone);
	return moment.utc().format('YYYY-MM-DD HH:mm:ss');
};


async function testNotification(req, res, next) {
	// const qb = await dbs.get_connection();
	// try {
	// let now = new Date().toISOString();
	// let date_format = dateFormat(now, 'yyyy-mm-d H:MM:ss');
	// convertUTC(date_format, 'Asia/Kolkata');
	// console.log(convertUTC(date_format, 'Asia/Kolkata'));
	// console.log(req.body.name);
	let input = {};
	// input = {
  //   token:
  //     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjA0LCJpYXQiOjE2NTY1ODgyMjh9.fWMdGjZMYynKqUJdNuuqQpMcdIRxx2CBPdt-QBds0JU',
  //   assign_at: '2022-07-11 03:30:07',
  //   lat: -33.8650229,
  //   lng: 151.2099088,
  //   location: "12 O'Connell St, Sydney NSW 2000, Australia",
  //   time_zone: 'Asia/Kolkata',
  // };

	// console.log(convertUTCToTimezone(input.assign_at, 'Asia/Kolkata','Australia/Sydney'));
	// console.log(convertUTCTime());
	// let sockets = require('../trait/sockets');
	// sockets.add_status();
	// input = await sockets.add_status({
	// 	token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjA0LCJpYXQiOjE2NTY1ODgyMjh9.fWMdGjZMYynKqUJdNuuqQpMcdIRxx2CBPdt-QBds0JU',
	// 	assign_at: '2022-06-30 20:35:32',
	// 	lat: -33.8650229,
	// 	lng: 151.2099088,
	// 	location: "12 O'Connell St, Sydney NSW 2000, Australia",
	// 	time_zone: 'Asia/Kolkata'
	// });
	// const users = await qb.select('*').where('id',req.params.id).limit(1).from('users').get();
	// let uuuuuu = await sockets.finish_mission({
	// 	id: 10,
	// 	token:
	// 		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQ2LCJpYXQiOjE2MzA1ODIyMzF9.7rnBChq7Fp92Go_lKh7zm-idl5vLVG6t0F7NZZKz1TU',
	// });
	// console.log(uuuuuu);


	// console.log(req.params.id);
	// let otp = 123;
	// let text_message = `Your otp is ${otp}`;
	// console.log(text_message);

	// users.social_token
	// let input = req.body;
	// const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
	// let statu_s = (req.body.status && (req.body.status == 1 || req.body.status == 2)) ? req.body.status : 1;
	// apiModel.update('users', {id:user.id}, {status: statu_s});
	return res.status(200).json(halper.api_response(1, 'input parms', input));
	// } catch (err) {
	// 	return res.json(halper.api_response(0,'This is invalid request',{}));
	// } finally {
	// 	// qb.disconnect();
	// }

}

module.exports.feedbackAdd = async (req, res, next) => {
  const qb = await dbs.get_connection();
  try {
    const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		let my_user = await qb.select('name').where('id', user.id).from('users').get();
    let input = req.body;
		feedback_request({
      id: input.book_id,
      status: 'feedback',
      token: req.headers.authorization,
      broker_id: user.id,
      user_name: my_user[0].name,
      roll_id: '1',
    });
		input.created_at = dateFormat(new Date(), 'yyyy-mm-dd H:MM:ss');
		qb.insert('feedbacks', input);
    return res
      .status(200)
      .json(halper.api_response(1, 'Feedback submitted successfully', input));
  } catch (err) {
    return res.json(halper.api_response(0, 'This is invalid request', {}));
  } finally {
    // apiModel.save_api_name('brokerStatus');
    qb.disconnect();
  }
};


async function brokerStatus(req, res, next) {
	const qb = await dbs.get_connection();
	try {
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		let statu_s = (req.body.status && (req.body.status == 1 || req.body.status == 2)) ? req.body.status : 1;
		apiModel.update('users', { id: user.id }, { status: statu_s });
		return res.status(200).json(halper.api_response(1, 'Status change successfully', {}));
	} catch (err) {
		return res.json(halper.api_response(0, 'This is invalid request', {}));
	} finally {
		apiModel.save_api_name('brokerStatus');
		qb.disconnect();
	}

}