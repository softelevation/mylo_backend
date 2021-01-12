const { body, validationResult } = require('express-validator')



module.exports.validate  = (method) => {
  switch (method) {
    case 'signUp': {
     return [
        body('first_name', 'first_name doesn exists').exists(),
        body('last_name', 'last_name doesn exists').exists(),
		body('email', 'Invalid email').exists().isEmail(),
		body('phone', 'phone doesn exists').exists(),
		body('home_address', 'home_address doesn exists').exists(),
		body('customer_type', 'customer_type doesn exists').exists(),
		body('password', 'password doesn exists').exists(),
		body('terms_conditions', 'terms_conditions doesn exists').exists()
       ]
    }
	case 'logIn': {
     return [
        body('email', 'email doesn exists').exists(),
        body('password', 'password doesn exists').exists()
       ]
    }
	case 'availableAgents': {
     return [
        body('latitude', 'latitude doesn exists').exists(),
        body('mission_id', 'mission_id doesn exists').exists(),
        body('agent_type', 'agent_type doesn exists').exists(),
        body('longitude', 'longitude doesn exists').exists()
       ]
    }
	case 'bookNow': {
     return [
        body('agent_id', 'agent_id doesn exists').exists(),
        body('mission_id', 'mission_id doesn exists').exists()
       ]
    }
	case 'quickCreateMission': {
     return [
        body('title', 'title doesn exists').exists(),
        body('location', 'location doesn exists').exists(),
        body('latitude', 'latitude doesn exists').exists(),
        body('longitude', 'longitude doesn exists').exists(),
        body('intervention', 'intervention doesn exists').exists(),
        body('agent_type', 'agent_type doesn exists').exists(),
        body('total_hours', 'total_hours doesn exists').exists(),
        body('quick_book', 'quick_book doesn exists').exists().isInt(),
        body('vehicle_required', 'vehicle_required doesn exists').exists().isInt(),
        body('start_date_time', 'start_date_time doesn exists').exists(),
        body('description', 'description doesn exists').exists()
       ]
    }
	case 'cardDetails': {
     return [
        body('name', 'name doesn exists').exists(),
        body('card_number', 'card_number doesn exists').exists().isInt(),
        body('expire_month', 'expire_month doesn exists').exists().isInt(),
        body('expire_year', 'expire_year doesn exists').exists().isInt()
       ]
    }
	case 'changePassword': {
     return [
        body('current_password', 'current_password doesn exists').exists().isInt(),
        body('new_password', 'new_password doesn exists').exists().isInt(),
        body('confirm_password', 'confirm_password doesn exists').exists().isInt()
       ]
    }
  }
}
