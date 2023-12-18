const catchAsync = require('../middlewares/catchAsync');
const httpStatus = require('../utils/configs/httpStatus');
const CaptureError = require('../utils/CaptureError');
const Review = require('../modals/Review');
const { verifyReviewData } = require('../validations/review');
const Products = require('../modals/Products');

/**
 * @author  Sam
 * @route   /reviews
 * @method  POST
 * @access  Protected
 * @desc    Post a review on a product.
 */
const createReview = catchAsync(async (req, res, next) => {
  const userType = req.userType;
  const user = req.user;

  const { data, error } = await verifyReviewData(req.body);
  if (error)
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      statusCode: httpStatus.BAD_REQUEST,
      message: error.message,
      error,
    });

  const productExist = await Products.findOne({ _id: data.product });

  if (!productExist)
    throw new CaptureError('Product not found', httpStatus.NOT_FOUND);

  const reviewData = {
    ...data,
    user: user._id,
  };

  switch (userType) {
    case 'b2b': {
      reviewData.user_type = 'B2BUsers';

      break;
    }

    case 'b2c': {
      reviewData.user_type = 'B2CUsers';

      break;
    }

    case 'basic': {
      reviewData.user_type = 'Users';

      break;
    }

    default: {
      throw new CaptureError(
        'Something went wrong',
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  const newReview = new Review(reviewData);
  await newReview.save();

  return res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Your review has been posted!',
    review: newReview,
  });
});

/**
 * @author  Sam
 * @route   /reviews
 * @method  GET
 * @access  Protected
 * @desc    Get list of reviews.
 */
const getReviews = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;

  const totalResults = await Review.find({}).count();
  const reviews = await Review.find({})
    .sort({ createdAt: -1 })
    .populate('user', '-password')
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  const newReviews = [];
  for (const review of reviews) {
    const reviewCopy = review.toObject();
    const user = {};

    switch (review.user_type) {
      case 'B2BUsers': {
        user.name = review.user.owner_name;
        user.profile = review.user.profile;

        break;
      }

      case 'B2CUsers': {
        user.name = review.user.name;
        user.profile = review.user.profile;

        break;
      }

      case 'Users': {
        user.name = review.user.username;
        user.profile = review.user.profile;

        break;
      }
    }

    reviewCopy.user = user;
    newReviews.push(reviewCopy);
  }

  return res.json({
    success: true,
    statusCode: httpStatus.OK,
    page,
    pageSize,
    totalResults,
    reviews: newReviews,
  });
});

module.exports = { createReview, getReviews };
