const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const B2BUser = require('../modals/B2BUser');
const B2CUser = require('../modals/B2CUser');
const Users = require('../modals/Users');

// All global function

// signing JWT
function create_Jwt(payload, key) {
  const token = jwt.sign(payload, key);
  return token;
}

function verifying_Jwt(token, key) {
  const verify_token = jwt.verify(token, key);
  return verify_token;
}

// Creating hash password
function Hashing_Password(password) {
  const createHash = bcrypt.hash(password, 12);
  return createHash;
}

//comparing hashed password
function compare_Password(password, hashedPassword) {
  const checkPassword = bcrypt.compare(password, hashedPassword);
  return checkPassword;
}

// creating regex
function createRegex(value) {
  let createdRegex = new RegExp(value?.toLowerCase(), 'i');

  return createdRegex;
}

// get previous date
function getDateXDaysAgo(numOfDays, date = new Date()) {
  const daysAgo = new Date(date.getTime());

  daysAgo.setDate(date.getDate() - numOfDays);

  return daysAgo;
}

// CONVERT DATE
function convertDate(date) {
  let currentDate = new Date(date).toJSON().slice(0, 10);
  console.log(currentDate); // "2022-06-17"
  const customDate = new Date(currentDate);
  // console.log("Custom Date",customDate)
  return customDate;
}

/**
 *
 * @param {*} email
 * @param {*} phone
 * @returns Boolean indicates whether email and phone exists in the DB.
 */
const doesEmailPhoneExist = async ({ email = null, phone = null }) => {
  const existInB2b = await B2BUser.find({
    $or: [{ email: new RegExp(email, 'i') }, { mobile: phone }],
  }).count();

  const existInB2c = await B2CUser.find({
    $or: [{ email: new RegExp(email, 'i') }, { mobile: phone }],
  }).count();

  const existInUser = await Users.find({
    $or: [{ email: new RegExp(email, 'i') }, { phone_number: phone }],
  }).count();

  return !!(existInB2b || existInB2c || existInUser);
};

/**
 * Check if the given date is older than a specified number of minutes from the current date.
 *
 * @param {Date} date - The date to compare.
 * @param {number} minutes - The number of minutes for the comparison (default is 5 minutes).
 * @returns {boolean} - True if the given date is older than the specified minutes from the current date, false otherwise.
 */
const hasElapsedMinutes = (date, minutes = 5) => {
  const currentDate = new Date();
  const differenceInMillis = currentDate - new Date(date);
  const differenceInMinutes = differenceInMillis / (1000 * 60);

  return differenceInMinutes > minutes;
};

module.exports = {
  convertDate,
  create_Jwt,
  verifying_Jwt,
  getDateXDaysAgo,
  Hashing_Password,
  compare_Password,
  createRegex,
  doesEmailPhoneExist,
  hasElapsedMinutes,
};
