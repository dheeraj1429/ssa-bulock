const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const B2C_User_Session_Schema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      default: uuidv4,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    profile: {
      image_name: { type: String, default: null },
      image_url: { type: String, default: null },
      path: { type: String, default: null },
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    reward_points: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('B2CUserSession', B2C_User_Session_Schema);
