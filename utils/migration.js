const mongoose = require('mongoose');
require('dotenv').config();
const withTransaction = require('./withTransaction');
const Order = require('../modals/Orders');
const Users = require('../modals/Users');
// const Products = require('../modals/Products');

const connectDB = async (cb) => {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('Mongodb connected !!');
      await cb();
    })
    .catch((err) => {
      console.log(err, 'Not connected to Mongodb !!');
    });
};

const migrateDatabase = async () => {
  const migrationResult = await withTransaction(async (session) => {
    console.log('Starting data migration...');
    const orders = await Order.find({});
    console.log(
      'Please wait, updating ',
      orders.length,
      ' documents in the database...'
    );

    for (const order of orders) {
      const user = await Users.findOne({ user_id: order.customer_id });

      order.user_type = 'Users';
      order.user = user?._id ?? null;
      order.total_amount = 0;
      order.billing_amount = 0;

      // This is taking so much time that transaction error occurs because of this.
      // for (const product of order.products) {
      //   const productDetails = await Products.findOne({
      //     product_code: product.product_code,
      //   });

      //   if (productDetails) product.product_unique_id = productDetails._id;
      //   else product.product_unique_id = null;
      // }

      await order.save({ session });
    }

    return true;
  });

  if (!migrationResult) {
    console.log('Data migration Failed!');
  } else {
    console.log('Data migration succeeded!');
  }
  process.exit(1);
};

connectDB(migrateDatabase);
