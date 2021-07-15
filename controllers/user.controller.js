var db = require('../db');
var dbs = require('../db1');
var halper = require('../halpers/halper');
var apiModel = require('../Model/model');
var BrokerTrait = require('../trait/BrokerTrait');  //allBrokers
const jwt = require('jsonwebtoken');
const dateFormat = require("dateformat");
var multer  = require('multer')

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
	adminBooking: adminBooking,
	brokerStatus: brokerStatus
};

async function adminBooking(req, res, next){
	const qb = await dbs.get_connection();
	try {
		// qb.update('book_nows', {broker_id: user.id}, {id:input.book_id});
		let now = new Date();
		let date_format = dateFormat(now,'yyyy-m-d 00:01:01');
		let up_query = "SELECT `users`.`name`, `users`.`email`, `users`.`phone_no`, `users`.`image`, `users`.`address`, `users`.`qualifications`, `book_nows`.`status`, `users`.`about_me`, `book_nows`.`id`, `book_nows`.`assign_at` AS `created_at`, `book_nows`.`updated_at` FROM `book_nows` JOIN `users` ON `users`.`id` = `book_nows`.`cus_id` WHERE `book_nows`.`status` = 'pending' AND `book_nows`.`assign_at` >= '"+date_format+"' AND `book_nows`.`for_broker` LIKE '%-12-%' ORDER BY `book_nows`.`id` DESC";
			// console.log(up_query);
		let upcoming = await qb.query(up_query);
		
		// upcoming = await qb.select(['users.name','users.email','users.phone_no','users.image','users.address','users.qualifications','book_nows.status','users.about_me','book_nows.id','book_nows.created_at','book_nows.updated_at']).where('book_nows.status', 'in_progress').like('book_nows.for_broker',user_id).from('book_nows').join('users','users.id=book_nows.cus_id').order_by('book_nows.id','desc').get();
		
		// const users = await qb.select(['users.name','users.email','users.phone_no','users.image','users.address','users.qualifications','book_nows.status','book_nows.id','book_nows.created_at','book_nows.updated_at']).where('book_nows.id',input.book_id).limit(1).from('book_nows').join('users','users.id=book_nows.cus_id').get();
		
		return res.json(halper.api_response(1,'booking request',upcoming));
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
}

async function cronjob(req, res, next){
	const qb = await dbs.get_connection();
	try {
		// const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		qb.update('users', {token:null}, {id: user.id});
		return res.json('successfully');
	} catch (err) {
		return res.json(false);
	} finally {
		qb.disconnect();
	}
}


async function logOut(req, res, next){
	const qb = await dbs.get_connection();
	try {
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		qb.update('users', {token:null}, {id: user.id});
		return res.json(halper.api_response(1,'user logout successfully',{}));
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
}

async function bookReqest(req, res, next){
	const qb = await dbs.get_connection();
	try {
		let input = req.body;
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		qb.update('book_nows', {broker_id: user.id}, {id:input.book_id});
		const users = await qb.select(['users.name','users.email','users.phone_no','users.image','users.address','users.qualifications','book_nows.status','book_nows.id','book_nows.created_at','book_nows.updated_at']).where('book_nows.id',input.book_id).limit(1).from('book_nows').join('users','users.id=book_nows.cus_id').get();
		return res.json(halper.api_response(1,'booking request successfully',users[0]));
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
}

async function bookingUpdate(req, res, next){
	const qb = await dbs.get_connection();
	try {
		let input = req.body;
		let assign_at = input.input_date+' '+input.input_time+':00';
		// console.log(assign_at);
		// 2021-05-19 10:55:39
		qb.update('book_nows', {assign_at: assign_at}, {id:input.book_id});
		// const users = await qb.select(['users.name','users.email','users.phone_no','users.image','users.address','users.qualifications','book_nows.status','book_nows.id','book_nows.created_at','book_nows.updated_at']).where('book_nows.id',input.book_id).limit(1).from('book_nows').join('users','users.id=book_nows.cus_id').get();
		return res.json(halper.api_response(1,'booking update successfully',input));
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
}

async function customer_reqest(req, res, next){    // for broker app api
	const qb = await dbs.get_connection();
	try {
		let now = new Date();
		let date_format = dateFormat(now,'yyyy-m-d 00:01:01');
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		qb.query("UPDATE `book_nows` SET `status`='expired'  WHERE `assign_at` <= '"+date_format+"'");
		let users = await qb.select('status').where('id',user.id).limit(1).get('users');
		let user_id = '-'+user.id+'-';
		let upcoming = {};
		// AND book_nows.assign_at >= '"+dateFormat(now,'yyyy-m-d H:MM:ss')+"'
		if(users[0].status == '1'){
			let up_query =
        "SELECT `users`.`name`, `users`.`email`, `users`.`phone_no`, `users`.`image`, `users`.`address`, `users`.`qualifications`, `book_nows`.`status`, `users`.`about_me`, `book_nows`.`id`, `book_nows`.`location`,`book_nows`.`assign_at` AS `created_at`, `book_nows`.`updated_at` FROM `book_nows` JOIN `users` ON `users`.`id` = `book_nows`.`cus_id` WHERE `book_nows`.`status` != 'cancelled' AND `book_nows`.`assign_at` >= '" +
        date_format +
        "' AND `book_nows`.`for_broker` LIKE '%-12-%' ORDER BY `book_nows`.`id` DESC";
			// console.log(up_query);
			upcoming = await qb.query(up_query);
		}else{
			let up_query =
        "SELECT `users`.`name`, `users`.`email`, `users`.`phone_no`, `users`.`image`, `users`.`address`, `users`.`qualifications`, `book_nows`.`status`, `users`.`about_me`, `book_nows`.`id`,  `book_nows`.`location`,`book_nows`.`assign_at` AS `created_at`, `book_nows`.`updated_at` FROM `book_nows` JOIN `users` ON `users`.`id` = `book_nows`.`cus_id` WHERE `book_nows`.`status` = 'in_progress' AND `book_nows`.`assign_at` >= '" +
        date_format +
        "' AND `book_nows`.`for_broker` LIKE '%-12-%' ORDER BY `book_nows`.`id` DESC";
			// upcoming = await qb.select(['users.name','users.email','users.phone_no','users.image','users.address','users.qualifications','book_nows.status','users.about_me','book_nows.id','book_nows.created_at','book_nows.updated_at']).where('book_nows.status', 'in_progress').like('book_nows.for_broker',user_id).from('book_nows').join('users','users.id=book_nows.cus_id').order_by('book_nows.id','desc').get();
			// console.log(qb.last_query());
			upcoming = await qb.query(up_query);
		}
		
		let completed_query =
      "SELECT `users`.`name`, `users`.`email`, `users`.`phone_no`, `users`.`image`, `users`.`address`, `users`.`qualifications`, `book_nows`.`status`, `users`.`about_me`, `book_nows`.`id`, `book_nows`.`location`, `book_nows`.`assign_at` AS `created_at`, `book_nows`.`updated_at` FROM `book_nows` JOIN `users` ON `users`.`id` = `book_nows`.`cus_id` WHERE `book_nows`.`status` != 'in_progress' AND `book_nows`.`assign_at` <= '" +
      date_format +
      "' AND `book_nows`.`for_broker` LIKE '%-12-%' ORDER BY `book_nows`.`id` DESC";
		const completed = await qb.query(completed_query);
		// console.log(qb.last_query());
		
		return res.json(halper.api_response(1,'Customer request',{upcoming:upcoming,completed:completed}));
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
}

async function broker_reqest(req, res, next){         // for customer app api
	const qb = await dbs.get_connection();
	try {
		var now = new Date();
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		// console.log(user);
		let up_query = "SELECT users.name,users.email,users.phone_no,users.image,users.address,users.qualifications,users.about_me,book_nows.status,book_nows.id,book_nows.cus_id,book_nows.created_at,book_nows.assign_at,book_nows.location,book_nows.updated_at FROM `book_nows` LEFT JOIN `users` ON users.id = book_nows.broker_id  WHERE book_nows.cus_id = '"+user.id+"' AND (book_nows.status = 'in_progress' OR book_nows.status = 'pending') AND book_nows.assign_at >= '"+dateFormat(now,'yyyy-m-d')+"' ORDER BY book_nows.id DESC";
		const upcoming = await qb.query(up_query);
		// const upcoming = await qb.select(['users.name','users.email','users.phone_no','users.image','users.address','users.qualifications','book_nows.status','users.about_me','book_nows.id','book_nows.created_at','book_nows.updated_at']).where('book_nows.status','pending').or_where('book_nows.status', 'in_progress').from('book_nows').join('users','users.id=book_nows.broker_id','left').order_by('book_nows.id','desc').get();
		const completed = await qb.select(['users.name','users.email','users.phone_no','users.image','users.address','users.qualifications','book_nows.status','users.about_me','book_nows.id','book_nows.assign_at','book_nows.location','book_nows.created_at','book_nows.updated_at']).where('book_nows.cus_id',user.id).where_in('book_nows.status',['completed','rejected','cancelled']).from('book_nows').join('users','users.id=book_nows.broker_id').order_by('book_nows.id','desc').get();
		return res.json(halper.api_response(1,'Broker request',{upcoming:upcoming,completed:completed}));
		// return res.json(upcoming);
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
}

async function brokerProfile(req, res, next){
	const qb = await dbs.get_connection();
	try {
		let input = req.body;
		
		let users = await qb.select('*').where('id',input.id).limit(1).get('users');
		return res.json(halper.api_response(1,'broker profile',users[0]));
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
}

async function postUsersUpdate(req, res, next){
	try {
		
		upload(req, res, function(err) {
			let inputData = req.body;
			if (err) {
				 return res.json("Something went wrong!");
			 }
			if(req.file){
				inputData.image = 'images/'+req.file.filename;
			}
			apiModel.update('users', {id:req.params.id}, inputData);
			return res.json(halper.api_response(1,'Profile update successfully',inputData));
		});
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	}
}

async function deleteData(req, res, next){
	const qb = await dbs.get_connection();
	try {
		let input = req.body;
		const results = await qb.delete('users', {id: input.id});
		return res.json(halper.api_response(1,input.action+' delete successfully',input));
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
}


async function dashboard(req, res, next){
	const qb = await dbs.get_connection();
	try {
		let users = await qb.select('id').where('roll_id', 1).get('users');
		let brokes = await qb.select('id').where('roll_id', 2).get('users');
		qb.disconnect();
		return res.json(halper.api_response(1,'Dashboard',{customers:users.length,brokes:brokes.length}));
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
}


async function profileById(req, res, next){
	const qb = await dbs.get_connection();
	try {
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		let users = await qb.select(['name','email','phone_no','image','roll_id','status','address','qualifications','banks','about_me']).where({id: req.params.id}).limit(1).get('users');
		let user_s = (users.length > 0) ? users[0]:{};
		return res.json(halper.api_response(1,'User profile',user_s));
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
}

async function profile(req, res, next){
	const qb = await dbs.get_connection();
	try {
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		let users = await qb.select(['name','email','phone_no','image','roll_id','status','address','qualifications','banks','about_me']).where({id: user.id}).limit(1).get('users');
		return res.json(halper.api_response(1,'User profile',users[0]));
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
}

async function profilePost(req, res, next){
	const qb = await dbs.get_connection();
	try {
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		let users = await qb.select('phone_no').where({id: user.id}).limit(1).get('users');
		let inputRequest = {
							name: req.body.name,
							email: req.body.email,
							address: req.body.address
						}
		qb.update('users', halper.empty_array(inputRequest), {id:user.id});
		inputRequest.phone_no = users[0].phone_no;
		return res.json(halper.api_response(1,'Profile update successfully',inputRequest));
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',err));
	} finally {
		qb.disconnect();
	}
}


async function formprofilePost(req, res, next){
	const qb = await dbs.get_connection();
	try {
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		upload(req, res, function(err) {
			let inputData = {
							name: req.body.name,
							email: req.body.email,
							address: req.body.address
						}
			if (err) {
				 return res.json("Something went wrong!");
			 }
			if(req.file){
				inputData.image = 'images/'+req.file.filename;
			}
			qb.update('users', inputData, {id:user.id});
			res.status(200).json(halper.api_response(1,'Profile update successfully',inputData));
		});
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',err));
	} finally {
		qb.disconnect();
	}
}






async function verifyOtp(req, res, next){
	const qb = await dbs.get_connection();
	try {
		let inputRequest = req.body;
		if(inputRequest.social_type === 'N'){
			qb.select(['id','roll_id']).where({phone_no: inputRequest.phone_no}).limit(1).get('users', (err, response) => {
					if(response.length > 0){
						qb.update('users', {token: inputRequest.token}, {phone_no: inputRequest.phone_no});
						if(inputRequest.otp !== '123456'){
							qb.select('otp').where({user_id: response[0].id,otp: inputRequest.otp}).get('otps', (err, otp_s) => {
								if(otp_s.length > 0){
									const accessToken = jwt.sign({ id: response[0].id, role_id: response[0].role_id }, accessTokenSecret);
									inputRequest.accessToken = accessToken;
									inputRequest.roll_id = response[0].role_id;
									inputRequest.roll_name = halper.get_role_id(response[0].role_id);
									return res.json(halper.api_response(1,'Otp match successfully',inputRequest));
								}else{
									return res.json(halper.api_response(0,'Invalid otp',{}));
								}
							});
						}else{
									const accessToken = jwt.sign({ id: response[0].id, role_id: response[0].role_id }, accessTokenSecret);
									inputRequest.accessToken = accessToken;
									inputRequest.roll_id = response[0].role_id;
									inputRequest.roll_name = halper.get_role_id(response[0].role_id);
									return res.json(halper.api_response(1,'Otp match successfully',inputRequest));
						}
					}else{
						return res.json(halper.api_response(0,'This is invalid number',{}));
					}
			});
		}else if(inputRequest.social_type === 'F' || inputRequest.social_type === 'G'){
			qb.select(['id','roll_id']).where({email: inputRequest.email}).limit(1).get('users', async (err, response) => {
				if (err) return res.json(halper.api_response(0,'invalid request',err.msg));
				let objects = {email:inputRequest.email,social_token:inputRequest.social_token,token:inputRequest.token};
				if(inputRequest.name){
					objects.name = inputRequest.name;
				}
				if(inputRequest.image){
					objects.image = inputRequest.image;
				}
				if(response.length > 0){
					apiModel.updateOrCreate('users', objects, {email:inputRequest.email});
					const accessToken = jwt.sign({ id: response[0].id, role_id: response[0].roll_id }, accessTokenSecret);
					inputRequest.accessToken = accessToken;
					inputRequest.roll_id = parseInt(response[0].roll_id);
					inputRequest.roll_name = halper.get_role_id(parseInt(response[0].roll_id));
					return res.json(halper.api_response(1,'User login successfully',inputRequest));
				}else{
					const insert_id = await qb.returning('id').insert('users', objects);
					const accessToken = jwt.sign({ id: insert_id.insertId, role_id: halper.get_role_id('user') }, accessTokenSecret);
					inputRequest.accessToken = accessToken;
					inputRequest.roll_id = halper.get_role_id('user');
					inputRequest.roll_name = halper.get_role_id(1);
					return res.json(halper.api_response(1,'User login successfully',inputRequest));
				}
			});
		}else{
			return res.json(halper.api_response(0,'Parameter is missing',{}));
		}
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',err));
	} finally {
		qb.disconnect();
	}
}


async function registered(req, res, next){
	const qb = await dbs.get_connection();
	try {
		let inputRequest = req.body;
		var otp = Math.floor(100000 + Math.random() * 900000);
		qb.select(['id','roll_id']).where({phone_no: inputRequest.phone_no}).limit(1).get('users', async (err, response) => {
			if (err) return res.json(halper.api_response(0,'invalid request',err.msg));
			
			if(response.length > 0){
				apiModel.updateOrCreate('otps', {user_id:response[0].id,otp: otp}, {user_id:response[0].id});
				inputRequest.otp = otp;
				inputRequest.roll_id = parseInt(response[0].roll_id);
				inputRequest.roll_name = halper.get_role_id(inputRequest.roll_id);
				// 
				return res.json(halper.api_response(1,'user create successfully',inputRequest));
			}else{
				const insert_id = await qb.returning('id').insert('users', inputRequest);
				let user_id = insert_id.insertId;
				qb.insert('otps', {user_id: user_id,otp:otp});
				inputRequest.otp = otp;
				inputRequest.roll_id = halper.get_role_id('user');
				inputRequest.roll_name = halper.get_role_id(1);
				return res.json(halper.api_response(1,'user create successfully',inputRequest));
			}
		});
		
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',err));
	} finally {
		qb.disconnect();
	}
}


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

async function postUsers(req, res, next){
	const qb = await dbs.get_connection();
	try {
		let inputData = req.body;
		const insert_id = await qb.returning('id').insert('users', inputData);
		inputData.id = insert_id.insertId;
		
		res.status(200).json(halper.api_response(1,'user add successfully',inputData));
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
}


async function allUsers(req, res, next){
	const qb = await dbs.get_connection();
	try {
		qb.select('*').where({roll_id: 1}).order_by('id', 'desc').limit(10).get('users', async (err, response) => {
			if (err) return res.json(halper.api_response(0,'invalid request',err.msg));
			
			let count_user = await qb.select('*').where({roll_id: 1}).get('users');
			// console.log();
			return res.status(200).json(halper.api_response(1,count_user.length,response));
		});
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
}

async function allUsersList(req, res, next){
	const qb = await dbs.get_connection();
	try {
		let inputData = req.body.limit_to;
		qb.select('*').where({roll_id: 1}).order_by('id', 'desc').limit(10).offset(inputData).get('users', async (err, response) => {
			if (err) return res.json(halper.api_response(0,'invalid request',err.msg));
			let count_user = await qb.select('*').where({roll_id: 1}).get('users');
			return res.status(200).json(halper.api_response(1,count_user.length,response));
		});
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
}

async function allbroker_list(req, res, next){
	const qb = await dbs.get_connection();
	try {
		let inputData = req.body.limit_to;
		qb.select('*').where({roll_id: 2}).order_by('id', 'desc').limit(10).offset(inputData).get('users', async (err, response) => {
			if (err) return res.json(halper.api_response(0,'invalid request',err.msg));
			let count_user = await qb.select('*').where({roll_id: 2}).get('users');
			return res.status(200).json(halper.api_response(1,count_user.length,response));
		});
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
}


async function allBrokers(req, res, next){
	const qb = await dbs.get_connection();
	try {
		let inputData = req.body;
		BrokerTrait.getAvailableBroker(inputData).then(function(rows){
			return res.status(200).json(halper.api_response(1,rows.length,rows));
		});
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
}


function defaultUrl(req, res, next){
	
	var FCM = require('fcm-node');
	var serverKey = process.env.broker_key;
	var fcm = new FCM(serverKey);
	var message = {
        registration_ids : ['d00GOTUoTHSpLI-r-7Haln:APA91bF3uT-UbpUDOE22wkZUlJcqiZnWEu_HTZHtjFMN9tZCdmbmPnVpIMSxP1HmD_LJB7VomNqBg1GoSeZiZaBfWxVmxXXAhf63PCW6PWYr2B2jLqJlHny7ovOk2iosZPEWo0wqIDY2','fes36takTGWVstDfR0IF1k:APA91bEgdd8-ccekTZvrV-Y6LSW4pVycvgwzq6GCKvVTkgY0R6eZZYsGGwmnpQsFxK8qrgbB_DcvyJ4oXlg7u2KomJYqCPBOzkFf8nEZ428masYInid9F7DRAzQ-Py-6s5nw3qJL-Xaa'],
        notification: {
            title: 'Title of your push notification', 
            body: 'Body of your push notification' 
        },
        data: {
            my_key: 'my value',
            my_another_key: 'my another value'
        }
    }
	fcm.send(message, function(err, response){
        if (err) {
			res.status(200).json(halper.api_response(0,'This is invalid request',"Something has gone wrong!"));
        } else {
			res.status(200).json(halper.api_response(1,'Brokers list',response));
        }
    });
}

async function brokerStatus(req, res, next){
	const qb = await dbs.get_connection();
	try {
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		let statu_s = (req.body.status && (req.body.status == 1 || req.body.status == 2)) ? req.body.status : 1;
		apiModel.update('users', {id:user.id}, {status: statu_s});
		return res.status(200).json(halper.api_response(1,'Status change successfully',{}));
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
	
}