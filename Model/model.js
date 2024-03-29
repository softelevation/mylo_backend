var db = require('../db');


module.exports = {
  insert: insert,
  update: update,
  select: select,
  insertQuery: insertQuery,
  save_api_name: save_api_name,
  updateOrCreate: updateOrCreate,
};


function save_api_name(input) {
  insert('api_requests', { name: input });
  return true;
}

function updateOrCreate(table, obj,where = null) {
	var sql = 'SELECT * FROM `'+table+'`';
		let keys = [];
		let key_s = [];
		for (var k in where) keys.push(k);
		let value = Object.values(where);
		
		if(where !== null){
				sql += ' WHERE ';
				for ( var k = 0; k < keys.length ; k++ ) {
					sql += '`'+keys[k]+'` = "'+value[k]+'" AND ';
				}
				
				let lastIndex = sql.lastIndexOf(" ");
				sql = sql.substring(0, lastIndex);
				lastIndex = sql.lastIndexOf(" ");
				sql = sql.substring(0, lastIndex);
		}
		db.query(sql, function(err, rows, fields) {
			if (err) {
				return 'Something failed!';
			}else {
				if(rows.length >0){
					let update_data = 'UPDATE `'+table+'` SET ';
					for (var k in obj) key_s.push(k);
					let obj_value = Object.values(obj)
	
					
					for ( var j = 0; j < key_s.length ; j++ ) {
						update_data += '`'+key_s[j]+'` = "'+obj_value[j]+'",';
					}
					let lastIndex = update_data.lastIndexOf(",");
					update_data = update_data.substring(0, lastIndex);
					
					let con_keys = [];
					for (var k in where) con_keys.push(k);
					let con_value = Object.values(where);
					
					update_data += ' WHERE ';
					for ( var k = 0; k < con_keys.length ; k++ ) {
						update_data += '`'+con_keys[k]+'` = "'+con_value[k]+'" AND ';
					}
					
					lastIndex = update_data.lastIndexOf(" ");
					update_data = update_data.substring(0, lastIndex);
					lastIndex = update_data.lastIndexOf(" ");
					update_data = update_data.substring(0, lastIndex);
					db.query(update_data);
					return true;
				}else{
					for (var k in obj) key_s.push(k);
					let obj_value = Object.values(obj)
					
					let insert_data = '(';
					for ( var k = 0; k < obj_value.length ; k++ ) {
						insert_data += "'"+obj_value[k]+"',";		
					}
					let lastIndex = insert_data.lastIndexOf(",");
					insert_data = insert_data.substring(0, lastIndex);
					insert_data += ')';
					db.query('INSERT INTO `'+table+'` ('+key_s+') VALUES '+insert_data);
					return true;
				}
			}
		});
	
}


function select(table, obj,where = null) {
	return new Promise(function(resolve, reject) {
		
		var sql = 'SELECT ';
		if(Array.isArray(obj)) {
			for ( var j = 0; j < obj.length ; j++ ) {
				sql += '`'+obj[j]+'`,';
			}
			let lastIndex = sql.lastIndexOf(",");
			sql = sql.substring(0, lastIndex);
		}else{
			sql += obj;
		}
		
		sql += ' FROM `'+table+'`';
	
		if(where !== null){
				let keys = [];
				for (var k in where) keys.push(k);
				let value = Object.values(where);
				
				sql += ' WHERE ';
				for ( var k = 0; k < keys.length ; k++ ) {
					sql += '`'+keys[k]+'` = "'+value[k]+'" AND ';
				}
				
				let lastIndex = sql.lastIndexOf(" ");
				sql = sql.substring(0, lastIndex);
				lastIndex = sql.lastIndexOf(" ");
				sql = sql.substring(0, lastIndex);
		}
	
	
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


function insertQuery(table, obj) {
	var keys = [];
	for (var k in obj) keys.push(k);
	let value = Object.values(obj);
	sql = '(';
	for ( var k = 0; k < value.length ; k++ ) {
		sql += "'"+value[k]+"',";		
	}
	let lastIndex = sql.lastIndexOf(",");
	sql = sql.substring(0, lastIndex);
	sql += ')';
	
	return new Promise(function(resolve, reject) {
		db.query('INSERT INTO `'+table+'` ('+keys+') VALUES '+sql,function(err, result, fields) {
			if (err) {
				return 'Something failed!';
			}else {
				select(table, '*',{id: result.insertId}).then(function(rows){
					resolve(rows);
				}).catch((err) => setImmediate(() => { throw err; }));
			}
		});
	});
}


function insert(table, obj) {
	var keys = [];
	for (var k in obj) keys.push(k);
	let value = Object.values(obj);
	sql = '(';
	for ( var k = 0; k < value.length ; k++ ) {
		sql += "'"+value[k]+"',";		
	}
	let lastIndex = sql.lastIndexOf(",");
	sql = sql.substring(0, lastIndex);
	sql += ')';
	db.query('INSERT INTO `'+table+'` ('+keys+') VALUES '+sql);
	return true;
}


function update(table, where, input) {
	let keys = [];
	let sql = 'UPDATE `'+table+'` SET ';
	for (var k in input) keys.push(k);
	let value = Object.values(input);
	
	for ( var j = 0; j < keys.length ; j++ ) {
		sql += '`'+keys[j]+'` = "'+value[j]+'",';
	}
	
	let lastIndex = sql.lastIndexOf(",");
	sql = sql.substring(0, lastIndex);
	
	let con_keys = [];
	for (var k in where) con_keys.push(k);
	let con_value = Object.values(where);
	
	sql += ' WHERE ';
	for ( var k = 0; k < con_keys.length ; k++ ) {
		sql += '`'+con_keys[k]+'` = "'+con_value[k]+'" AND ';
	}
	
	lastIndex = sql.lastIndexOf(" ");
	sql = sql.substring(0, lastIndex);
	lastIndex = sql.lastIndexOf(" ");
	sql = sql.substring(0, lastIndex);
	db.query(sql);
	return true;
}
