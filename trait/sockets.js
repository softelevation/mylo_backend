var apiModel = require('../Model/model');
var db = require('../db');
var dbs = require('../db1');
const jwt = require('jsonwebtoken');
const accessTokenSecret = 'youraccesstokensecret';
const dateFormat = require('dateformat');
const moment = require('moment-timezone');
const { check, check_array_length, convertUTCTime, convertUTCToTimezone } = require('../halpers/halper');

module.exports = {
  add_status: add_status,
  change_status: change_status,
  broker_detail: broker_detail,
  notification_badge: notification_badge,
  user_location: user_location,
  travel_to_booking: travel_to_booking,
  arrived_on_destination: arrived_on_destination,
  tracking_for_booking: tracking_for_booking,
  finish_mission: finish_mission,
  feedback_request: feedback_request,
  notification_working: notification_working,
};

async function notification_working(token, roll_id) {
  try {
    var FCM = require('fcm-node');
    let serverKey = process.env.cus_key;
    // if(roll_id == 1){
    // serverKey = process.env.cus_key;
    // }else{
    // serverKey = process.env.broker_key;
    // }
    var fcm = new FCM(serverKey);
    let username = '';
    var message = {
      to: token,
      notification: {
        title: 'Welcome to Mylo Pro',
        body: username,
      },
      data: {
        my_key: 'my value',
        my_another_key: 'my another value',
      },
    };
    fcm.send(message, function (err, response) {
      if (err) {
        console.log('errror');
      } else {
        console.log(response);
      }
    });
  } catch (err) {}
}

var remove_notification_badge = async function (msg) {
  try {
    let user_id = '-' + msg.broker_id + '-';
    let users = await msg.qb
      .select(['id', 'broker_id'])
      .where('id', msg.id)
      .get('notifications');
    let for_broker_string = users[0].broker_id.split(',');
    let index_broker_string = for_broker_string.indexOf(user_id);
    for_broker_string.splice(index_broker_string, 1);
    msg.qb.update(
      'notifications',
      { broker_id: for_broker_string.toString() },
      { id: msg.id },
    );
    return true;
  } catch (err) {
    return false;
  } finally {
  }
};

async function tracking_for_booking(msg) {
  const qb = await dbs.get_connection();
  try {
    const user = await jwt.verify(msg.token, accessTokenSecret);
    let book_now = await qb
      .select('cus_id')
      .where('id', msg.booking_id)
      .get('book_nows');
    let user_tracking = await qb
      .select(['user_id', 'current_latitude', 'current_longitude'])
      .where('user_id', user.id)
      .get('user_trackings');
    if (check_array_length(user_tracking)) {
      qb.update(
        'user_trackings',
        {
          current_latitude: msg.current_latitude,
          current_longitude: msg.current_longitude,
          current_angle: msg.current_angle,
        },
        { user_id: user.id },
      );
    } else {
      qb.insert('user_trackings', {
        user_id: user.id,
        current_latitude: msg.current_latitude,
        current_longitude: msg.current_longitude,
        current_angle: msg.current_angle,
      });
    }
    return check_array_length(book_now) ? book_now[0].cus_id : 0;
  } catch (err) {
    console.log(err);
  } finally {
    qb.disconnect();
  }
  // return msg;
}

async function notification_badge(msg) {
  const qb = await dbs.get_connection();
  try {
    const user = await jwt.verify(msg.token, accessTokenSecret);
    let users = await qb.select('roll_id').where('id', user.id).get('users');
    if (users[0].roll_id == '1') {
      if (msg.id != 'all') {
        apiModel.update('notifications', { id: msg.id }, { cus_badge: 0 });
      } else {
        apiModel.update('notifications', { cus_id: user.id }, { cus_badge: 0 });
      }
      return user.id;
    } else {
      if (msg.id != 'all') {
        remove_notification_badge({
          id: msg.id,
          broker_id: user.id,
          qb: qb,
        });
        return user.id;
      } else {
        let user_id = '-' + user.id + '-';
        let user_notifications = await qb
          .select('id')
          .like('broker_id', user_id)
          .get('notifications');
        for (let user_notification of user_notifications) {
          remove_notification_badge({
            id: user_notification.id,
            broker_id: user.id,
            qb: qb,
          });
        }
        return user.id;
      }
    }
  } catch (err) {
    console.log(err);
  } finally {
    qb.disconnect();
  }
}

var convertGMT = function (date_format, time_zone) {
  return moment(date_format).tz(time_zone).format('YYYY-MM-DD HH:mm:00');
  // let moment = require('moment-timezone').tz(date_format, time_zone);
  // return moment.utc().format('');
};

async function add_status(object1) {
  const qb = await dbs.get_connection();
  try {
    var now = new Date();
    const user = await jwt.verify(object1.token, accessTokenSecret);
    let customer = await qb.select('name').where('id', user.id).get('users');
    let brokers = await qb
      .select(['id', 'status', 'token'])
      .where('roll_id', '2')
      .get('users');
    let result = [];
    for (let i = 0; i < brokers.length; i++) {
      if (brokers[i].token !== null && brokers[i].status == '1')
        result.push(brokers[i].token);
    }

    let result_id = brokers.map((a) => '-' + a.id + '-');
    let object_add = {
      cus_id: user.id,
      created_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
      updated_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
      for_broker: result_id.toString(),
    };

    if (object1.assign_at) {
      object_add.assign_at = convertUTCToTimezone(object1.assign_at, object1.time_zone,'Australia/Sydney');
      // convertGMT(object1.assign_at, object1.time_zone);
      object_add.type = 'later';
    } else {
      object_add.assign_at = convertUTCTime();
    }
    if (object1.lat) {
      object_add.latitude = object1.lat;
    }
    if (object1.lng) {
      object_add.longitude = object1.lng;
    }
    if (object1.lng) {
      object_add.location = object1.location;
    }
    let book_now = await qb.returning('id').insert('book_nows', object_add);
    qb.insert('notifications', {
      booking_id: book_now.insert_id,
      cus_id: user.id,
      broker_id: result_id.toString(),
      message: `${customer[0].name} have a new mission request`,
      cus_badge: 0,
      brok_badge: 1,
      notification_for: 2,
      status: 'pending',
      created_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
      updated_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
    });
    notification_s(user.id, result);
    let users = await qb.select('*').where('id', user.id).limit(1).get('users');
    return {
      users: users[0],
      book_now: book_now,
    };
  } catch (err) {
    console.log(err);
  } finally {
    qb.disconnect();
  }
}

async function travel_to_booking(msg) {
  const qb = await dbs.get_connection();
  try {
    let now = new Date();
    const user = await jwt.verify(msg.token, accessTokenSecret);
    apiModel.update(
      'book_nows',
      { id: msg.id },
      { status: 'travel_to_booking' },
    );
    let cus_id = await qb
      .select(['book_nows.cus_id', 'users.token'])
      .join('users', 'users.id=book_nows.cus_id')
      .where('book_nows.id', msg.id)
      .limit(1)
      .get('book_nows');
    let message_s = `Request #${msg.id} is travel for booking`;
    if (cus_id[0].token) {
      push_notification_s(cus_id[0].token, message_s);
    }
    qb.insert('notifications', {
      booking_id: msg.id,
      cus_id: cus_id[0].cus_id,
      broker_id: user.id,
      message: message_s,
      cus_badge: 1,
      brok_badge: 0,
      notification_for: 1,
      status: 'in_progress',
      created_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
      updated_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
    });
    return cus_id[0].cus_id;
  } catch (err) {
    return flase;
  } finally {
    qb.disconnect();
  }
}

async function arrived_on_destination(msg) {
  const qb = await dbs.get_connection();
  try {
    let now = new Date();
    const user = await jwt.verify(msg.token, accessTokenSecret);
    apiModel.update('book_nows', { id: msg.id }, { status: 'in_progress' });
    let cus_id = await qb
      .select(['book_nows.cus_id', 'users.token'])
      .join('users', 'users.id=book_nows.cus_id')
      .where('book_nows.id', msg.id)
      .limit(1)
      .get('book_nows');
    let message_s = `Request #${msg.id} is arrived on destination`;
    if (cus_id[0].token) {
      push_notification_s(cus_id[0].token, message_s);
    }
    qb.insert('notifications', {
      booking_id: msg.id,
      cus_id: cus_id[0].cus_id,
      broker_id: user.id,
      message: message_s,
      cus_badge: 1,
      brok_badge: 0,
      notification_for: 1,
      status: 'in_progress',
      created_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
      updated_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
    });
    return cus_id[0].cus_id;
  } catch (err) {
    return flase;
  } finally {
    qb.disconnect();
  }
}

async function finish_mission(msg) {
  const qb = await dbs.get_connection();
  try {
    let now = new Date();
    const user = await jwt.verify(msg.token, accessTokenSecret);
    apiModel.update(
      'book_nows',
      { id: msg.id },
      {
        status: 'completed',
        finished_at: dateFormat(now, 'yyyy-mm-dd H:MM:ss'),
      },
    );
    let cus_id = await qb
      .select(['book_nows.cus_id', 'users.token'])
      .join('users', 'users.id=book_nows.cus_id')
      .where('book_nows.id', msg.id)
      .limit(1)
      .get('book_nows');
    let message_s = `Request #${msg.id} is complete`;
    if (cus_id[0].token) {
      push_notification_s(cus_id[0].token, message_s);
    }
    qb.insert('notifications', {
      booking_id: msg.id,
      cus_id: cus_id[0].cus_id,
      broker_id: user.id,
      message: message_s,
      cus_badge: 1,
      brok_badge: 0,
      notification_for: 1,
      status: 'in_progress',
      created_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
      updated_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
    });
    return cus_id[0].cus_id;
  } catch (err) {
    console.log(err);
    return flase;
  } finally {
    qb.disconnect();
  }
}

async function user_location(msg) {
  try {
    let now = new Date();
    let now_date = dateFormat(now, 'yyyy-mm-dd H:MM:ss');
    const user = await jwt.verify(msg.token, accessTokenSecret);
    let obj = {
      user_id: user.id,
      current_latitude: msg.latitude,
      current_longitude: msg.longitude,
      current_latitudeDelta: msg.latitudeDelta,
      current_longitudeDelta: msg.longitudeDelta,
      current_angle: msg.angle,
      created_at: now_date,
      updated_at: now_date,
    };
    apiModel.updateOrCreate('user_trackings', obj, { user_id: user.id });
    return {
      current_latitude: msg.latitude,
      current_longitude: msg.longitude,
      current_latitudeDelta: msg.latitudeDelta,
      current_longitudeDelta: msg.longitudeDelta,
      current_angle: msg.angle,
    };
  } catch (err) {
    return flase;
  } finally {
  }
}

async function broker_detail(msg) {
  const qb = await dbs.get_connection();
  try {
    const user = await jwt.verify(msg.token, accessTokenSecret);
    let users = await qb.select('*').where('id', user.id).limit(1).get('users');
    let booking_customer = await qb
      .select('cus_id')
      .where('id', msg.id)
      .limit(1)
      .get('book_nows');
    return { customer: booking_customer[0].cus_id, broker: users[0] };
  } catch (err) {
    return res.json(halper.api_response(0, 'This is invalid request', {}));
  } finally {
    qb.disconnect();
  }
}

async function change_status(msg) {
  const qb = await dbs.get_connection();
  try {
    // console.log('change_status change_status');
    const user = await jwt.verify(msg.token, accessTokenSecret);
    let user_detail = await qb
      .select(['id', 'name', 'roll_id'])
      .where('id', user.id)
      .limit(1)
      .get('users');
    let booking_customer = await qb
      .select('cus_id')
      .where('id', msg.id)
      .limit(1)
      .get('book_nows');
    msg.broker_id = user.id;
    msg.roll_id = user_detail[0].roll_id;
    msg.user_name = user_detail[0].name;
    console.log(msg);
    if (msg.status == 'in_progress') {
      notification_change_request(msg, 'in_progress');
      apiModel.update(
        'book_nows',
        { id: msg.id },
        { status: 'accepted', broker_id: user.id },
      );
    } else if (msg.status == 'cancelled') {
      notification_change_request(msg, 'cancelled');
      if (msg.roll_id == '2') {
        remove_broker(msg);
      } else {
        apiModel.update('book_nows', { id: msg.id }, { status: msg.status });
      }
    } else if (msg.status == 'travel_to_booking') {
      notification_change_request(msg, 'travel_to_booking');
      apiModel.update(
        'book_nows',
        { id: msg.id },
        { status: 'travel_to_booking' },
      );
    } else if (msg.status == 'completed') {
      notification_change_request(msg, 'completed');
      apiModel.update('book_nows', { id: msg.id }, { status: 'completed' });
    } else if (msg.status == 'rejected') {
      notification_change_request(msg, 'rejected');
      remove_broker(msg);
    }
    return true;
  } catch (err) {
    return res.json(halper.api_response(0, 'This is invalid request', {}));
  } finally {
    qb.disconnect();
  }
}

const remove_specific_broker = async function (msg, qb) {
  try {
    let users = await qb
      .select('*')
      .where('id', msg.id)
      .limit(1)
      .get('book_nows');
    let for_broker_string = users[0].for_broker.split(',');
    let index_broker_string = for_broker_string.indexOf(
      '-' + msg.broker_id + '-',
    );
    for_broker_string.splice(index_broker_string, 1);
    // console.log(users);
    let check_val = await qb.update(
      'book_nows',
      { for_broker: for_broker_string.toString() },
      { id: msg.id },
    );
    // console.log(msg);
    // console.log(check_val);
    return true;
  } catch (err) {
    return false;
  } finally {
  }
};

var remove_broker = async function (msg) {
  const qb = await dbs.get_connection();
  try {
    let users = await qb
      .select('*')
      .where('id', msg.id)
      .limit(1)
      .get('book_nows');
    let updated_data = { status: msg.status };
    if (msg.roll_id == '2') {
      let for_broker_string = users[0].for_broker.split(',');
      let index_broker_string = for_broker_string.indexOf(
        '-' + msg.broker_id + '-',
      );
      for_broker_string.splice(index_broker_string, 1);
      updated_data.for_broker = for_broker_string.toString();
      if (!check(users[0].broker_id)) {
        updated_data.broker_id = '';
        updated_data.status = 'pending';
      }
    }
    // console.log(updated_data);
    qb.update('book_nows', updated_data, { id: msg.id });
    // if (msg.roll_id == '2') {
    //   remove_specific_broker({id: msg.id,broker_id:msg.broker_id},qb);
    //   qb.update('book_nows', { broker_id: NULL, status: 'pending' }, { id: msg.id });
    // }
    apiModel.insert('broker_bookings', {
      book_id: msg.id,
      broker_id: msg.broker_id,
      status: 'rejected',
    });
    return true;
  } catch (err) {
    return false;
  } finally {
    qb.disconnect();
  }
};

async function feedback_request(msg) {
  notification_change_request(msg, 'feedback');
}

var notification_change_request = async function (msg, statu_s) {
  const qb = await dbs.get_connection();
  try {
    var FCM = require('fcm-node');
    var serverKey = process.env.cus_key;
    var fcm = new FCM(serverKey);
    var now = new Date();
    let users = {};
    if (msg.roll_id == '2') {
      users = await qb
        .select(['users.id', 'users.name', 'users.token'])
        .where('book_nows.id', msg.id)
        .limit(1)
        .from('book_nows')
        .join('users', 'users.id=book_nows.cus_id')
        .get();
    } else {
      users = await qb
        .select(['users.id', 'users.name', 'users.token'])
        .where('book_nows.id', msg.id)
        .limit(1)
        .from('book_nows')
        .join('users', 'users.id=book_nows.broker_id')
        .get();
    }
    let username = msg.user_name ? msg.user_name : 'Broker';
    let title_message = 'Booking accepted';
    let message_s = username + ' has accepted your request';
    if (statu_s == 'cancelled') {
      title_message = 'Booking cancelled';
      message_s = username + ' has cancelled your request';
    } else if (statu_s == 'travel_to_booking') {
      title_message = 'Inprogress';
      message_s = username + ' has started the booking';
    } else if (statu_s == 'completed') {
      title_message = 'Completed booking';
      message_s = 'Thanks for booking';
    } else if (statu_s == 'rejected') {
      title_message = 'Booking rejected';
      message_s = username + ' has rejected your request';
    }else if (statu_s == 'feedback') {
      title_message = 'feedback';
      message_s = username + ' has give you feedback';
    }
      if (msg.roll_id == '2' && statu_s === 'in_progress') {
        statu_s = 'accepted';
      } else if (msg.roll_id == '2' && statu_s === 'travel_to_booking') {
        statu_s = 'in_progress';
      }
    // console.log(message_s);
    if (msg.roll_id == '2') {
      qb.insert('notifications', {
        booking_id: msg.id,
        cus_id: users[0].id,
        broker_id: msg.broker_id,
        message: message_s,
        cus_badge: 1,
        brok_badge: 0,
        notification_for: 1,
        status: statu_s,
        created_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
        updated_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
      });
    } else {
      qb.insert('notifications', {
        booking_id: msg.id,
        cus_id: msg.broker_id,
        broker_id: `-${users[0].id}-`,
        message: message_s,
        cus_badge: 0,
        brok_badge: 1,
        notification_for: 2,
        status: statu_s,
        created_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
        updated_at: dateFormat(now, 'yyyy-m-d H:MM:ss'),
      });
    }
    var message = {
      to: users[0].token,
      notification: {
        title: title_message,
        body: message_s,
      },
      data: {
        my_key: 'my value',
        my_another_key: 'my another value',
      },
    };
    fcm.send(message, function (err, response) {
      if (err) {
        console.log(err);
      } else {
        console.log(response);
      }
    });
    return true;
  } catch (err) {
    return false;
  } finally {
    qb.disconnect();
  }
};

var push_notification_s = async function (token, message_body) {
  try {
    var FCM = require('fcm-node');
    let serverKey = process.env.cus_key;
    var fcm = new FCM(serverKey);
    var message = {
      to: token,
      notification: {
        title: 'Mission',
        body: message_body,
      },
      data: {
        my_key: 'my value',
        my_another_key: 'my another value',
      },
    };
    fcm.send(message, function (err, response) {
      if (err) {
        console.log(err);
      } else {
        console.log(response);
      }
    });
  } catch (err) {}
};

var notification_s = async function (msg, result, callback) {
  const qb = await dbs.get_connection();
  try {
    var FCM = require('fcm-node');
    let serverKey = process.env.cus_key;
    var fcm = new FCM(serverKey);
    let users = await qb
      .select(['id', 'name', 'email', 'phone_no', 'token'])
      .where({ id: msg })
      .get('users');
    let username = users[0].name ? users[0].name : 'Customer';
    var message = {
      registration_ids: result,
      notification: {
        title: 'New booking',
        body: username + ' has requesting a new booking',
      },
      data: {
        my_key: 'my value',
        my_another_key: 'my another value',
      },
    };
    fcm.send(message, function (err, response) {
      if (err) {
        console.log('errror');
        // res.status(200).json(halper.api_response(0,'This is invalid request',"Something has gone wrong!"));
      } else {
        console.log(response);
        // res.status(200).json(halper.api_response(1,'Brokers list',response));
      }
    });
    // return 'qqqqqqqqqqqqqq';
  } catch (err) {
    // return 'xxxxxxxxx';
  } finally {
    qb.disconnect();
  }
};
