var express = require('express');
var router = express.Router();
var dbs = require('../db1');
var bodyParser = require('body-parser');
var halper = require('../halpers/halper');
var apiModel = require('../Model/model');
const dateFormat = require('dateformat');
router.use(bodyParser.json());



// apiController = require('../controllers/user.controller');

var notification_s = async function (result) {

    if (result.length > 0){
        var FCM = require('fcm-node');
        let serverKey = process.env.cus_key;
        var fcm = new FCM(serverKey);
        var message = {
          registration_ids: result,
          notification: {
            title: 'Booking request',
            body: 'Booking is coming soon',
          },
          data: {
            my_key: 'my value',
            my_another_key: 'my another value',
          },
        };
        fcm.send(message, function(err, response){
              if (err) {
                console.log(err);
                // res.status(200).json(halper.api_response(0,'This is invalid request',"Something has gone wrong!"));
              } else {
                console.log(response);
                // res.status(200).json(halper.api_response(1,'Brokers list',response));
              }
        });
    }
};

router.get('/',async function(req,res){
    const qb = await dbs.get_connection();
    try {
        var oldDateObj = new Date();
        var newDateObj = new Date();
        newDateObj.setTime(oldDateObj.getTime() + 30 * 60 * 1000);
        let my_query_oldDateObj = dateFormat(newDateObj, 'yyyy-mm-dd HH:MM:00');
        let date_format_oldDateObj = dateFormat(newDateObj, 'yyyy-mm-dd HH:MM:00');
        let date_format_newDateObj = dateFormat(newDateObj, 'yyyy-mm-dd HH:MM:59');
        console.log(date_format_newDateObj);

        let my_query = "SELECT * FROM `book_nows` WHERE `status` = 'pending' AND `assign_at` <= '"+my_query_oldDateObj+"'";
        

        let up_query =
          "select book_nows.broker_id,book_nows.assign_at,users.token from book_nows inner join users on users.id = book_nows.broker_id where users.token != 'null' and book_nows.status = 'accepted' and book_nows.assign_at between '" +
          date_format_oldDateObj +
          "' and '" +
          date_format_newDateObj +
          "'";
        // console.log(up_query);
        let book_now = await qb.query(up_query);
        let my_query_data = await qb.query(my_query);
        
        // console.log(my_query_data);
        // let result_id = book_now.map((a) => a.token);
        // notification_s(['eXg_nNKrSYyLrjgbAXcxEg:APA91bG_OH6oBzKcvhwT7O-J9TYDF_FzOujBr7ZRNu-GI_mMZ1dxmI2puOpPgLDPXh5GsuLGmCzleQGuIRRuLARJhdLkhVK-ol4lnnVqxiWNo72FGMEAPlRxFmhu2wr8agd0_52xq4Xz']);
        // notification_s(result_id);
        // console.log(result_id);

        return res.json(halper.api_response(1, date_format_newDateObj, book_now));
    } catch (err) {
        return res.json(halper.api_response(0, 'This is invalid request', {}));
    } finally {
        apiModel.save_api_name('cronjob');
        qb.disconnect();
    }
});


module.exports = router;
