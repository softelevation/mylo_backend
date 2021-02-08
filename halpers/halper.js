var crypto = require('crypto');
var algorithm = 'aes256';
var key = 'password';



class halper {

	get_role_id(input){
			let role_id = {
				user:1,
				broker:2
			}
			if (typeof input != "string"){
				return Object.keys(role_id).find(key => role_id[key] === input);
			}else{
				return role_id[input];
			}
		}
		
	encrypt(text,type) {
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


	api_response(status,message,data){
		
		return {
			status : status,
			message : message,
			data : data
		};
	}
	
	
	empty_array(obj){
		   let result =  Object.entries(obj).reduce((a,[k,v]) => (v == '' ? a : (a[k]=v, a)), {});
		   return result;
	}

}

module.exports = new halper();