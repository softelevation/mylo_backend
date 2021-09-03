var express = require('express');
var router = express.Router();
var dbs = require('../db1');
var bodyParser = require('body-parser');
var halper = require('../halpers/halper');
const dateFormat = require('dateformat');
router.use(bodyParser.json());



// apiController = require('../controllers/user.controller');

router.get('/',async function(req,res){
    const qb = await dbs.get_connection();
    try {
        let now = new Date();
        let date_format = dateFormat(now, 'yyyy-mm-dd H:MM:ss');
        // console.log(date_format);
        let book_now = await qb.select('*').where('status', 'cancelled').get('book_nows');
        return res.json(halper.api_response(1, date_format, book_now));
    } catch (err) {
        return res.json(halper.api_response(0, 'This is invalid request', {}));
    } finally {
        qb.disconnect();
    }
});


module.exports = router;
