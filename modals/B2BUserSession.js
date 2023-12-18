const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const B2B_User_Session_Schema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      default: uuidv4,
    },
    is_approved: {
      type: Boolean,
      required: true,
      default: false,
    },
    company_name: {
      type: String,
      required: true,
    },
    owner_name: {
      type: String,
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
    pan: {
      number: { type: String, default: null },
      images: [
        {
          image_name: { type: String },
          image_url: { type: String },
          path: { type: String },
        },
      ],
    },
    aadhaar: {
      number: { type: String, default: null },
      images: [
        {
          image_name: { type: String },
          image_url: { type: String },
          path: { type: String },
        },
      ],
    },
    gstNo: {
      number: { type: String, default: null },
      images: [
        {
          image_name: { type: String },
          image_url: { type: String },
          path: { type: String },
        },
      ],
    },
    address: {
      type: String,
      required: true,
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

module.exports = mongoose.model('B2BUserSession', B2B_User_Session_Schema);
