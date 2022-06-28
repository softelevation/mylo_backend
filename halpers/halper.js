var crypto = require('crypto');
var algorithm = 'aes256';
var key = 'password';

class halper {
  get_role_id(input) {
    let role_id = {
      user: 1,
      broker: 2,
    };
    if (typeof input != 'string') {
      return Object.keys(role_id).find((key) => role_id[key] === input);
    } else {
      return role_id[input];
    }
  }

  encrypt(text, type) {
    if (type == 'dec') {
      var decipher = crypto.createDecipher(algorithm, key);
      var decrypted =
        decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
      return decrypted;
    } else {
      var cipher = crypto.createCipher(algorithm, key);
      var encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
      return encrypted;
    }
  }

  filter_by_id_fix(target, input) {
    // 👈 return single value in array format from multidimensional array
    let return_object = [];
    if (target.length > 0) {
      return_object = target.map(function (key) {
        return key[input];
      });
    }
    return return_object;
  }

  filter_by_id(target, input) {
    // 👈 return single value in array format from multidimensional array
    let return_object = [0];
    if (target.length > 0) {
      return_object = target.map(function (key) {
        return key[input];
      });
    }
    return return_object;
  }

  check(obj) {
    // 👈 check string is valid or not
    if (
      obj &&
      obj !== null &&
      obj !== undefined &&
      obj !== '' &&
      obj !== false
    ) {
      return true;
    } else {
      return false;
    }
  }

  check_array_length(array, num = false) {
    // 👈 check array lenth and min length of array
    if (Array.isArray(array)) {
      if (!num) {
        return array.length ? true : false;
      } else {
        return array.length && array.length >= num ? true : false;
      }
    } else {
      return false;
    }
  }

  check_obj(myObj, key = null) {
    // 👈 check object is valid and check key is exit in object
    if (
      myObj &&
      Object.keys(myObj).length === 0 &&
      Object.getPrototypeOf(myObj) === Object.prototype
    ) {
      return false;
    } else {
      if (key) {
        return myObj[key] && myObj[key] !== undefined ? true : false;
      } else {
        return true;
      }
    }
  }

  api_response(status, message, data) {
    return {
      status: status,
      message: message,
      data: data,
    };
  }

  empty_array(obj) {
    let result = Object.entries(obj).reduce(
      (a, [k, v]) => (v == '' ? a : ((a[k] = v), a)),
      {},
    );
    return result;
  }

  async sand_sms(mobile, text_message) {
    let plivo = require('plivo');
    let client = new plivo.Client(
      'MAMTG5ZWJLMME5NJFMYM',
      'MGE1NWQ2YjEyYmY2MGFkZWRhZTA1NTNiZGY1M2Ix',
    );
    client.messages
      .create('+1 970-614-3632', mobile, text_message)
      .then(function (err, response) {
        console.log('error ', err);
        console.log('success ', response);
      });
  }

  merge_object(object1, object2) {
    const object3 = { ...object1, ...object2 };
    return object3;
  }

  array_duplicates(chars) {
    // 👈 reverse array value
    return [...new Set(chars)];
  }

  array_to_str(obj) {
    return obj.toString();
  }

  array_to_str_space(obj) {
    return obj.join(', ');
  }

  str_to_array(obj) {
    return obj.split(',');
  }

  int_str_to_array(obj) {
    let final_obj = obj.split(',');
    return final_obj.map(function (key) {
      return parseInt(key);
    });
  }

  validation_message(obj) {
    let key_name = Object.keys(obj)[0];
    return obj[key_name].message;
  }

  shorting_string_val(input) {
    if (this.check(input)) {
      input = this.int_str_to_array(input);
      input.sort((a, b) => a - b);
      return this.array_to_str(input);
    } else {
      return '';
    }
  }

  array_short(input) {
    return input.sort((a, b) => a - b);
  }
}

module.exports = new halper();
