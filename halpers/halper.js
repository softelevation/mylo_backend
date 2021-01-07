var crypto = require('crypto');
var algorithm = 'aes256';
var key = 'password';

module.exports = {
	encrypt: encrypt,
	api_response: api_response
};

function encrypt(text,type) {
		if(type == 'dec') {
			var decipher = crypto.createDecipher(algorithm, key);
			var decrypted = decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
			return decrypted;
		}else {
			var cipher = crypto.createCipher(algorithm, key);  
			var encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
			return encrypted;
		}
}


function api_response(status,message,data){
	
	return {
		status : status,
		message : message,
		data : data
	};
}