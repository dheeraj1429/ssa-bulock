const express = require("express");
const router = express.Router();
const App_All_Controllers = require("../../app_controllers/app_all_controller");
const auth = require("../../middlewares/auth");

router.get("/get/all/brands", App_All_Controllers.showAllBrands);
router.get("/get/home/screen/brands", App_All_Controllers.brandsForHomeScreen);
router.get(
  "/get/sub/category/and/related/products",
  App_All_Controllers.brandsSubCategoryAndProducts
);
router.get(
  "/get/product/by/id/:product_id",
  App_All_Controllers.getProductById
);
router.get(
  "/get/all/brands/suggestion/for/search",
  App_All_Controllers.getAllBrands
);
router.get("/app/search/for/products", App_All_Controllers.searchProducts);
router.get(
  "/app/check/user/exists/:phone_number",
  App_All_Controllers.checkExistingUser
);
router.get("/app/login/user/:phone_number", App_All_Controllers.loginUser);
router.get(
  "/app/get/all/user/orders",
  App_All_Controllers.getAllOrdersByUserId
);
router.get(
  "/app/get/all/home/screen/banner",
  App_All_Controllers.getAllHomeScreenbanner
);
router.get("/app/get/user/by/userid/:user_id", App_All_Controllers.getUserById);
router.get(
  "/app/get/products/new/arrivals",
  App_All_Controllers.getNewArrivalProducts
);
router.get(
  "/app/get/category/for/new/arrivals/:brand_name",
  App_All_Controllers.getBrandCategory
);
router.get(
  "/app/get/products/tags/for/filter",
  App_All_Controllers.filterForProducts
);
router.get(
  "/app/get/auth/user/profile/picture/:user_id",
  App_All_Controllers.getUserProfilePicture
);
router.post("/app/create/user", App_All_Controllers.createUser);
router.post(
  "/app/cart/checkout/for/products",
  App_All_Controllers.cartCheckout
);
router.post(
  "/app/cart/checkout/for/products/v2",
  auth(),
  App_All_Controllers.placeOrder
);
router.post(
  "/app/send/enquiry/for/order",
  App_All_Controllers.sendMessageEnquiry
);
router.post("/app/create/user/b2b", App_All_Controllers.createB2BAccount);
router.post("/app/create/user/b2c", App_All_Controllers.createB2CAccount);
router.post(
  "/app/verify/register/with/otp",
  App_All_Controllers.completeRegistration
);
router.post("/app/login/user/b2b/b2c", App_All_Controllers.loginB2bAndB2cUser);
router.patch(
  "/app/cancel/order/by/id/:order_id",
  App_All_Controllers.cancelOrderById
);
router.patch(
  "/app/edit/user/profile/:user_id",
  App_All_Controllers.editUserByID
);
router.patch(
  "/app/edit/user/profile/picture/by/id/:user_id",
  App_All_Controllers.editUserProfilePicture
);
router.get("/app/search-products", App_All_Controllers.getSearchProducts);

router.get("/app/check-mobile-number", App_All_Controllers.checkMobileNumber);
router.patch("/app/update-password", App_All_Controllers.updatePassword);

module.exports = router;
