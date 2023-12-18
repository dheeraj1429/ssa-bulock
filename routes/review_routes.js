const express = require("express");
const router = express.Router();
const Review_Controllers = require("../controllers/Review_Controllers");
const auth = require("../middlewares/auth");

router.post("/reviews", auth(), Review_Controllers.createReview);
router.get("/reviews", Review_Controllers.getReviews);

module.exports = router;
