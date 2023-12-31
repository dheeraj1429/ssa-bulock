const express = require("express");
const app = express();
require("dotenv").config();
const cookieparser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const port = process.env.PORT || 5000;
const BASE_URL = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3003",
  "https://ssa-admin.blackhatcode.in",
  "https://octopus-app-9lk2b.ondigitalocean.app",
  "https://hammerhead-app-k2njf.ondigitalocean.app",
]; // http://ssa-admin.ssgoldindia.com/login    http://localhost:3000 https://ssa-admin.blackhatcode.in
const errorHandler = require("./middlewares/errorHandler");
const cronJobs = require("./cron");

// Admin Dashboard routes
const Admin_Routes = require("./routes/admin_routes");
const Vendor_Routes = require("./routes/vendors_routes");
const Brands_Routes = require("./routes/brands_routes");
const Order_Routes = require("./routes/order_routes");
const Products_Routes = require("./routes/products_routes");
const User_Routes = require("./routes/user_routes");
const Enquiry_Routes = require("./routes/enquiry_routes");
const Banners_Routes = require("./routes/banners_routes");
const B2BUser_Routes = require("./routes/b2b_user_routes");
const Reward_Order_Routes = require("./routes/reward_order_routes");
const Review_Routes = require("./routes/review_routes");

// App Routes
const App_All_Routes = require("./routes/app_routes/app_all_routes");

app.use(
  cors({
    origin: BASE_URL,
    credentials: true,
  })
);

app.use(cookieparser());
app.use(express.json());
app.use(morgan("dev"));
// app.use(express.urlencoded({extended: false}));

// logger
app.use((req, res, next) => {
  console.log({
    path: req.path,
    headers: req.headers,
    params: req.params,
    query: req.query,
    body: req.body,
  });

  next();
});

// Define a custom middleware function to log responses
const logResponseMiddleware = (req, res, next) => {
  const originalSend = res.send;

  res.send = function (body) {
    console.log(`Response status: ${res.statusCode}`);
    try {
      const responseBody = JSON.parse(body);
      console.log(`Response body: `, responseBody);
    } catch (error) {
      console.log(`Response body: `, body);
    }

    originalSend.apply(res, arguments);
  };

  next();
};

// Use the custom middleware for all routes
app.use("/api/csv", express.static("uploads"));

app.use(logResponseMiddleware);

app.use("/api", Admin_Routes);
app.use("/api", Vendor_Routes);
app.use("/api", Brands_Routes);
app.use("/api", Order_Routes);
app.use("/api", Products_Routes);
app.use("/api", User_Routes);
app.use("/api", Enquiry_Routes);
app.use("/api", Banners_Routes);
app.use("/api", App_All_Routes);
app.use("/api", B2BUser_Routes);
app.use("/api", Reward_Order_Routes);
app.use("/api", Review_Routes);
// app.use("/api",UploadImage_Routes);

app.use("/", (req, res) => {
  console.log("Working ");
  res.send("WORKING");
});

app.use(errorHandler);

cronJobs();

app.listen(port, () => {
  console.log("Server is Listen on ", port);
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log("Mongodb connected !!");
    })
    .catch((err) => {
      console.log(err, "Not connected to Mongodb !!");
    });
});
