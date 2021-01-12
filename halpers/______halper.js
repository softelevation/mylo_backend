var crypto = require('crypto');
var algorithm = 'aes256';
var key = 'password';

class halper {
	
		get_role_id(input){
			let role_id = {
				customer:1,
				agent:2,
				operator:3,
				admin:4
			}
			if (typeof input != "string"){
				return Object.keys(role_id).find(key => role_id[key] === input);
			}else{
				return role_id[input];
			}
		}


		get_agent_type_list(input){
			let agentList = {
				1:"Agent SSIAP 1",
				2:"Agent SSIAP 2",
				3:"Agent SSIAP 3",
				4:"ADS",
				5:"Body Guard Without Weapon",
				6:"Dog Handler",
				7:"Hostesses"
			}
			if (typeof input == "string"){
				return Object.keys(agentList).find(key => agentList[key] === input);
			}else{
				return agentList[input];
			}
		}


		get_agent_rate(agentType,quickBooking){
			
			// 1 //Agent SSIAP 1
			// 2 //Agent SSIAP 2
			// 3 //Agent SSIAP 3
			// 4 //ADS
			// 5 //Body Guard Without Weapon
			// 6 //Dog Handler
			// 7 //Hostesses
			// 8 //Intervention
			// 9 //security patrol
			// if(quickBooking==0){
				let rate = {
					1 : 25,
					2 : 28,
					3 : 75,
					4 : 25,
					5 : 100,
					6 : 28,
					7 : 25,
					8 : 60,
					9 : 80
				}
			// }
			// if(quickBooking==1){
				// let rate = {
					// 1 : 35,
					// 2 : 37,
					// 3 : 75,
					// 4 : 35,
					// 5 : 120,
					// 6 : 37,
					// 7 : 35,
					// 8 : 60,
					// 9 : 80
				// }
			// }
			
			return rate[agentType];
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

}

module.exports = new halper();