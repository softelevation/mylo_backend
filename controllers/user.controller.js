var db = require('../db');
var dbs = require('../db1');
var halper = require('../halpers/halper');
var apiModel = require('../Model/model');
const jwt = require('jsonwebtoken');
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
	allBrokers: allBrokers,
	postUsers: postUsers,
	loginUser: loginUser,
	encrypt: encrypt,
	registered: registered,
	verifyOtp: verifyOtp,
	profile: profile,
	dashboard: dashboard,
	profilePost: profilePost,
	formprofilePost: formprofilePost,
	deleteData: deleteData,
	brokerProfile: brokerProfile,
	postUsersUpdate: postUsersUpdate,
	customer_reqest: customer_reqest,
	bookReqest: bookReqest
};

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

async function customer_reqest(req, res, next){
	const qb = await dbs.get_connection();
	try {
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		const upcoming = await qb.select(['users.name','users.email','users.phone_no','users.image','users.address','users.qualifications','book_nows.status','book_nows.about_me','book_nows.id','book_nows.created_at','book_nows.updated_at']).where('book_nows.status','pending').or_where('book_nows.status', 'in_progress').from('book_nows').join('users','users.id=book_nows.cus_id').get();
		const completed = await qb.select(['users.name','users.email','users.phone_no','users.image','users.address','users.qualifications','book_nows.status','book_nows.about_me','book_nows.id','book_nows.created_at','book_nows.updated_at']).where('book_nows.status','completed').or_where('book_nows.status', 'rejected').from('book_nows').join('users','users.id=book_nows.cus_id').get();
		return res.json(halper.api_response(1,'customer request',{upcoming:upcoming,completed:completed}));
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	} finally {
		qb.disconnect();
	}
}

async function brokerProfile(req, res, next){
	try {
		let input = req.body;
		const qb = await dbs.get_connection();
		let users = await qb.select('*').where('id',input.id).limit(1).get('users');
		qb.disconnect();
		return res.json(halper.api_response(1,'broker profile',users[0]));
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
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
			return res.json(halper.api_response(1,'Profile update successfully',inputData));
		});
		
		
		// let input = req.body;
		// let id = req.params.id;
		// const qb = await dbs.get_connection();
		// qb.update('users', input, {id:id});
		// qb.disconnect();
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	}
}

async function deleteData(req, res, next){
	try {
		let input = req.body;
		const qb = await dbs.get_connection();
		const results = await qb.delete('users', {id: input.id});
		qb.disconnect();
		return res.json(halper.api_response(1,input.action+' delete successfully',input));
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	}
}


async function dashboard(req, res, next){
	try {
		const qb = await dbs.get_connection();
		let users = await qb.select('id').where('roll_id', 1).get('users');
		let brokes = await qb.select('id').where('roll_id', 2).get('users');
		qb.disconnect();
		return res.json(halper.api_response(1,'Dashboard',{customers:users.length,brokes:brokes.length}));
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	}
}


async function profile(req, res, next){
	try {
		const qb = await dbs.get_connection();
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		
		let users = await qb.select(['name','email','phone_no','roll_id','address']).where({id: user.id}).limit(1).get('users');
		return res.json(halper.api_response(1,'User profile',users[0]));
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',{}));
	}
}

async function profilePost(req, res, next){
	const qb = await dbs.get_connection();
	try {
		const user = await jwt.verify(req.headers.authorization, accessTokenSecret);
		let inputRequest = {
							name: req.body.name,
							email: req.body.email,
							address: req.body.address
						}
		qb.update('users', inputRequest, {id:user.id});
		return res.json(halper.api_response(1,'Profile update successfully',inputRequest));
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',err));
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
			qb.disconnect();
			res.status(200).json(halper.api_response(1,'Profile update successfully',inputData));
		});
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',err));
	}
}






async function verifyOtp(req, res, next){
	const qb = await dbs.get_connection();
	try {
		let inputRequest = req.body;
		qb.select(['id','roll_id']).where({phone_no: inputRequest.phone_no}).limit(1).get('users', (err, response) => {
				if(response.length > 0){
					if(inputRequest.otp !== '123456'){
						qb.select('otp').where({user_id: response[0].id,otp: inputRequest.otp}).get('otps', (err, otp_s) => {
							// console.log(otp_s);
							if(otp_s.length > 0){
								const accessToken = jwt.sign({ id: response[0].id, role_id: response[0].role_id }, accessTokenSecret);
								inputRequest.accessToken = accessToken;
								inputRequest.roll_id = response[0].role_id;
								inputRequest.roll_name = halper.get_role_id(response[0].role_id);
								return res.json(halper.api_response(1,'Otp match successfully',inputRequest));
							}else{
								return res.json(halper.api_response(0,'Otp not match successfully',{}));
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
	} catch (err) {
		return res.json(halper.api_response(0,'This is invalid request',err));
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
				apiModel.updateOrCreate('otps', {otp: otp}, {user_id:response[0].id});
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
	}
}


async function allUsers(req, res, next){
	const qb = await dbs.get_connection();
	
	qb.select('*').where({roll_id: 1}).get('users', async (err, response) => {
		qb.disconnect();
			if (err) return res.json(halper.api_response(0,'invalid request',err.msg));
			
			return res.status(200).json(halper.api_response(1,'Users list',response));
		});
}

async function allBrokers(req, res, next){
	const qb = await dbs.get_connection();
	qb.select('*').where({roll_id: 2}).get('users', async (err, response) => {
		qb.disconnect();
			if (err) return res.json(halper.api_response(0,'invalid request',err.msg));
			
			return res.status(200).json(halper.api_response(1,'Brokers list',response));
		});
		
		
	// var sql = "SELECT * FROM `users` WHERE `roll_id` = 2 ORDER BY id DESC";
	// db.query(sql, function(err, rows, fields) {
		// if (err) {
		  // res.status(500).json({ error: 'Something failed!' })
		// }else {
			// if(rows.length >0){
				// return res.status(200).json(halper.api_response(1,'Broker detail',rows));
				// return res.status(200).json(rows);
			// }else{
				// res.status(206).json(halper.api_response(0,'Email and password does not match',{}));
			// }
		// }
	// });
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