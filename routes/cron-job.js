var express = require('express');
var router = express.Router();
var dbs = require('../db1');
var bodyParser = require('body-parser');
var halper = require('../halpers/halper');
var apiModel = require('../Model/model');
const dateFormat = require('dateformat');
const { convertUTCTime, filter_by_id_fix, filter_by_id, check_array_length } = require('../halpers/halper');
router.use(bodyParser.json());



// apiController = require('../controllers/user.controller');

const notification_expire_req = async function (result) {
  if (result.length > 0) {
    var FCM = require('fcm-node');
    let serverKey = process.env.cus_key;
    var fcm = new FCM(serverKey);
    var message = {
      registration_ids: result,
      notification: {
        title: 'Expired request',
        body: 'Your booking request has been expired please book again for new request',
      },
      data: {
        my_key: 'my value',
        my_another_key: 'my another value',
      },
    };
    fcm.send(message, function (err, response) {
      if (err) {
        console.log(err);
        // res.status(200).json(halper.api_response(0,'This is invalid request',"Something has gone wrong!"));
      } else {
        console.log(response);
        // res.status(200).json(halper.api_response(1,'Brokers list',response));
      }
    });
  }
}

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
        // var oldDateObj = new Date();
        var now = new Date();
        var newDateObj = new Date(convertUTCTime());
        // console.log(dateFormat(newDateObj, 'yyyy-mm-dd HH:MM:00'));
        newDateObj.setTime(newDateObj.getTime() + 05 * 60 * 1000);
        let my_query_oldDateObj = dateFormat(newDateObj, 'yyyy-mm-dd HH:MM:00');
        // console.log(my_query_oldDateObj);
        // let date_format_oldDateObj = dateFormat(newDateObj, 'yyyy-mm-dd HH:MM:00');
        // let date_format_newDateObj = dateFormat(newDateObj, 'yyyy-mm-dd HH:MM:59');
        // console.log(date_format_newDateObj);
        let my_query = "SELECT * FROM `book_nows` WHERE `status` = 'pending' AND `assign_at` <= '"+my_query_oldDateObj+"'";
        // console.log(my_query);
        // console.log(my_query);
        // let up_query =
        //   "select book_nows.broker_id,book_nows.assign_at,users.token from book_nows inner join users on users.id = book_nows.broker_id where users.token != 'null' and book_nows.status = 'accepted' and book_nows.assign_at between '" +
        //   date_format_oldDateObj +
        //   "' and '" +
        //   date_format_newDateObj +
        //   "'";
        // console.log(up_query);
        // let book_now = await qb.query(up_query);
        let my_query_data = await qb.query(my_query);

        if (check_array_length(my_query_data)) {
          for (let my_query of my_query_data) {
              qb.insert('notifications', {
                booking_id: my_query.id,
                cus_id: my_query.cus_id,
                broker_id: null,
                message: `Your booking request has been expired please book again for new request`,
                cus_badge: 1,
                brok_badge: 0,
                notification_for: 1,
                status: 'expired',
                created_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
                updated_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
              });
            qb.update('book_nows', { status: 'expired' }, { id: my_query.id });
          }
        }
        let user_token = await qb.select('token').where_in('id',filter_by_id(my_query_data, 'cus_id')).get('users');
        // let user_cus_id = ;
        
        // console.log(user_token);
        // let result_id = book_now.map((a) => a.token);
        // notification_s(['eXg_nNKrSYyLrjgbAXcxEg:APA91bG_OH6oBzKcvhwT7O-J9TYDF_FzOujBr7ZRNu-GI_mMZ1dxmI2puOpPgLDPXh5GsuLGmCzleQGuIRRuLARJhdLkhVK-ol4lnnVqxiWNo72FGMEAPlRxFmhu2wr8agd0_52xq4Xz']);
        if (check_array_length(user_token)) {
          notification_expire_req(filter_by_id(user_token, 'token'));
        }
        // console.log(result_id);
        return res.json(my_query_data);
    } catch (err) {
        return res.json(halper.api_response(0, 'This is invalid request', {}));
    } finally {
        apiModel.save_api_name('cronjob');
        qb.disconnect();
    }
});


module.exports = router;
