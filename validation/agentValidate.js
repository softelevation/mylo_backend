const { body, validationResult } = require('express-validator')



module.exports.validate  = (method) => {
  switch (method) {
    case 'signUp': {
     return [
        body('first_name', 'first_name doesn exists').exists(),
        body('last_name', 'last_name doesn exists').exists(),
		body('email', 'Invalid email').exists().isEmail(),
		body('phone', 'phone doesn exists').exists(),
		body('identity_card', 'identity_card doesn exists').exists(),
		body('social_security_number', 'social_security_number doesn exists').exists(),
		body('cv', 'cv doesn exists').exists(),
		body('iban', 'iban doesn exists').exists(),
		body('agent_type', 'agent_type doesn exists').exists(),
		body('cnaps_number', 'cnaps_number doesn exists').exists(),
		body('diploma[]', 'diploma doesn exists').exists(),
		body('home_address', 'home_address doesn exists').exists(),
		body('work_location_address', 'work_location_address doesn exists').exists(),
		body('lat', 'lat doesn exists').exists(),
		body('long', 'long doesn exists').exists(),
		body('is_vehicle', 'is_vehicle doesn exists').exists(),
		body('is_subc', 'is_subc doesn exists').exists(),
		body('supplier_company', 'supplier_company doesn exists').exists()
       ]
    }
  }
}
