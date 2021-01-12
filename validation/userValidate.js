const { body, validationResult } = require('express-validator')

module.exports.validate  = (method) => {
  switch (method) {
    case 'createUser': {
     return [
        body('username', 'username doesn exists').exists(),
		body('email', 'Invalid email').exists().isEmail()
       ]
    }
  }
}


// module.exports.validationForm = (method) => {
	// const errors = validationResult(req);
	// if (!errors.isEmpty()) {
		// return res.status(400).json({ errors: errors.array() });
	// }
// }




// [ 
        // body('userName', 'userName doesn't exists').exists(),
        // body('email', 'Invalid email').exists().isEmail(),
        // body('phone').optional().isInt(),
        // body('status').optional().isIn(['enabled', 'disabled'])
       // ] 