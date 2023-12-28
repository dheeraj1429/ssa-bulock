const Brands_Schema = require("../modals/Brands");
const Order_Schema = require("../modals/Orders");
const Products_Schema = require("../modals/Products");
const Users_Schema = require("../modals/Users");
const Banners_Schema = require("../modals/Banners");
const Enquiry_Schema = require("../modals/Enquiry");
const Utils = require("../utils/Utils");
const { v4: uuidv4 } = require("uuid");
const generateOrderId = require("order-id")("key");
const {
  verifyB2BAccountData,
  verifyUpdatePassword,
} = require("../validations/b2bUser");
const { verifyB2CAccountData } = require("../validations/b2cUser");
const catchAsync = require("../middlewares/catchAsync");
const httpStatus = require("../utils/configs/httpStatus");
const B2BUser = require("../modals/B2BUser");
const B2CUser = require("../modals/B2CUser");
const TokenService = require("../utils/TokenService");
const CaptureError = require("../utils/CaptureError");
const { default: mongoose } = require("mongoose");
const { isValidObjectId } = require("mongoose");
const { verifyOrderData } = require("../validations/order");
const bcrypt = require("bcryptjs");
const withTransaction = require("../utils/withTransaction");
const B2BUserSession = require("../modals/B2BUserSession");
const B2CUserSession = require("../modals/B2CUserSession");

const getSearchProducts = catchAsync(async (req, res, next) => {
  const { search } = req.query;
  if (!search) {
    return res.status(400).json({
      success: false,
      message: "product name is required!",
    });
  }
  const findDocuments = await Products_Schema.find(
    { $text: { $search: search } },
    { product_name: 1 }
  );

  if (findDocuments) {
    return res.status(200).json({
      success: true,
      products: findDocuments,
    });
  }

  return res.status(400).json({
    success: false,
    message: "Products not found!",
  });
});

// all brands screen api
const showAllBrands = async (req, res) => {
  try {
    const allBrands = await Brands_Schema.aggregate([
      {
        $group: {
          _id: "$main_category_name",
          categories: {
            $push: {
              category_id: "$_id",
              brandName: "$category_name",
              brandImage: "$category_image",
            },
          },
        },
      },
    ]).sort({ _id: 1 });
    console.log(allBrands);
    res.status(200).send(allBrands);
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong !!");
  }
};

// brands for home screen
const brandsForHomeScreen = async (req, res) => {
  try {
    const allBrandsForHomeScreen = await Brands_Schema.aggregate([
      {
        $group: {
          _id: "$main_category_name",
          brands: {
            $push: {
              category_id: "$_id",
              brandName: "$category_name",
              brandImage: "$category_image",
            },
          },
        },
      },
      { $project: { _id: 1, brands: { $slice: ["$brands", 7] } } },
    ]).sort({ _id: 1 });
    console.log(allBrandsForHomeScreen);
    res.status(200).send(allBrandsForHomeScreen);
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong !!");
  }
};

// get all brands for search suggestions
const getAllBrands = async (req, res) => {
  try {
    const allBrands = await Brands_Schema.aggregate([
      { $group: { _id: "$main_category_name" } },
    ]).sort({ _id: 1 });
    res.status(200).send(allBrands);
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wroog !!");
  }
};

// get brands sub category & related products
const brandsSubCategoryAndProducts = async (req, res) => {
  const brandId = req.query.brand_id;
  const brandName = req.query.brand_name;
  try {
    const findBrandSubcategory = await Brands_Schema.find({ _id: brandId })
      .sort({ createdAt: -1 })
      .slice({ subcategory: 7 })
      .limit(7);
    console.log(findBrandSubcategory);
    const findProducts = await Products_Schema.find({
      product_category: brandName,
    })
      .sort({ createdAt: -1 })
      .select(
        "product_id product_name new_arrival product_images product_main_category product_category product_subcategory product_variant product_description product_code"
      )
      .limit(10);
    console.log("PRODUCTS=>", findProducts);
    if (findProducts?.length <= 15) {
      const findMoreProducts = await Products_Schema.find({}).select(
        "product_id product_name new_arrival product_images product_main_category product_category product_subcategory product_variant product_description product_code"
      );
    }
    res
      .status(200)
      .send({ subcategory: findBrandSubcategory, products: findProducts });
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong !!");
  }
};

// get product by id
const getProductById = async (req, res) => {
  const productId = req.params.product_id;
  try {
    if (!productId) {
      return res
        .status(404)
        .send({ status: false, message: "product not found !!" });
    }

    // const findProduct = await Products_Schema.findById(productId).select(
    //   'product_id color size product_name product_images product_main_category product_category product_subcategory product_variant product_description product_code cartoon_total_products product_price b2b_user_product_price b2c_user_product_price'
    // );

    const findProduct = await Products_Schema.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(productId) } },
      {
        $project: {
          product_id: 1,
          color: 1,
          size: 1,
          product_name: 1,
          product_images: 1,
          product_main_category: 1,
          product_category: 1,
          product_subcategory: 1,
          product_variant: 1,
          product_description: 1,
          product_code: 1,
          cartoon_total_products: 1,
          product_price: 1,
          b2b_user_product_price: {
            $convert: {
              input: "$b2b_user_product_price",
              to: "string",
            },
          },
          b2c_user_product_price: {
            $convert: {
              input: "$b2c_user_product_price",
              to: "string",
            },
          },
        },
      },
    ]);

    const data = findProduct?.[0];

    if (!data) {
      return res
        .status(404)
        .send({ status: false, message: "product not found !!" });
    }
    res.status(200).send(data);
  } catch (err) {
    console.log(er);
    res.status(500).send("Somwthing went wrong !!");
  }
};

// search in products api
const searchProducts = async (req, res) => {
  const search = req.query.search_by;
  const searchBySubCategory = req.query.subcategory;
  const searchByCategory = req.query.category;
  const searchByBrandCategory = req.query.brand_category?.trim();
  const productTag = req.query.product_tag;
  const limit = req.query.limit || 10;
  const page = req.query.page || 1;
  console.log("REQUEST->", req.query);
  let result;
  let count;
  try {
    if (
      !search &&
      !searchBySubCategory &&
      !searchByCategory &&
      !searchByBrandCategory
    ) {
      res.status(404).send({ status: false, message: "not found !!" });
      return;
    }
    // =========== SEARCH BY TEXT INPUT AND SELECTED PRODUCT TAG ===========
    if (search?.length && productTag) {
      const searchRegex = Utils.createRegex(search);
      result = await Products_Schema.find({
        product_name: { $regex: searchRegex },
        product_tag: productTag,
      })
        .select(
          "product_id product_name new_arrival product_images product_main_category product_category product_subcategory product_variant product_description product_code"
        )
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
      count = await Products_Schema.find({
        product_name: { $regex: searchRegex },
        product_tag: productTag,
      }).count();

      if (!result.length > 0) {
        result = await Products_Schema.find({
          product_code: { $regex: searchRegex },
          product_tag: productTag,
        })
          .select(
            "product_id product_name new_arrival product_images product_main_category product_category product_subcategory product_variant product_description product_code"
          )
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip((page - 1) * limit);
        count = await Products_Schema.find({
          product_code: { $regex: searchRegex },
          product_tag: productTag,
        }).count();
      }
      //    console.log("Result normal search=>",result)
      return res.status(200).send({ result, pages: Math.ceil(count / limit) });
    }
    // =========== SEARCH BY TEXT INPUT AND SELECTED PRODUCT TAG ===========

    // ========== SEARCH BY SUB CATEGORY AND SELECTED PRODUCT TAG ===========
    if (searchBySubCategory && productTag) {
      const searchBySubCategoryObj = JSON.parse(searchBySubCategory);
      // console.log('NEW OBJ',searchBySubCategoryObj)
      // const searchBySubCategoryRegex = Utils.createRegex(searchBySubCategoryObj?.sub_category);
      result = await Products_Schema.find({
        product_main_category: searchBySubCategoryObj.main_category,
        product_category: searchBySubCategoryObj.category,
        product_subcategory: searchBySubCategoryObj.sub_category,
        product_tag: productTag,
      })
        .select(
          "product_id product_name new_arrival product_images product_main_category product_category product_subcategory product_variant product_description product_code"
        )
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
      console.log("Result Sub category=>", result);
      count = await Products_Schema.find({
        product_main_category: searchBySubCategoryObj.main_category,
        product_category: searchBySubCategoryObj.category,
        product_subcategory: searchBySubCategoryObj.sub_category,
        product_tag: productTag,
      }).count();
      console.log("count", count);
      return res.status(200).send({ result, pages: Math.ceil(count / limit) });
    }
    // ========== SEARCH BY SUB CATEGORY AND SELECTED PRODUCT TAG ===========

    // ========== SEARCH BY CATEGORY AND SELECTED PRODUCT TAG ==========
    if (searchByCategory && productTag) {
      console.log("MAIN CATEGORY and productTag SEARCH");
      const searchByCategoryRegex = Utils.createRegex(searchByCategory);
      result = await Products_Schema.find({
        product_main_category: { $regex: searchByCategoryRegex },
        product_tag: productTag,
      })
        .select(
          "product_id product_name new_arrival product_images product_main_category product_category product_subcategory product_variant product_description product_code"
        )
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
      //    console.log("Result Category=>",result)
      count = await Products_Schema.find({
        product_main_category: searchByCategory,
        product_tag: productTag,
      }).count();
      // console.log("Count -> category=",count)
      return res.status(200).send({ result, pages: Math.ceil(count / limit) });
    }
    // ========== SEARCH BY CATEGORY AND SELECTED PRODUCT TAG ==========

    //==========  SEARCH BY BRAND CATEGORY AND SELECTED PRODUCT TAG ==========
    if (searchByBrandCategory && productTag) {
      console.log("CATEGORY and productTag SEARCH ");
      const searchByBrandCategoryRegex = Utils.createRegex(
        searchByBrandCategory
      );
      result = await Products_Schema.find({
        product_category: { $regex: searchByBrandCategoryRegex },
        product_tag: productTag,
      })
        .select(
          "product_id product_name new_arrival product_images product_main_category product_category product_subcategory product_variant product_description product_code"
        )
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
      count = await Products_Schema.find({
        product_category: searchByBrandCategory,
        product_tag: productTag,
      }).count();
      return res.status(200).send({ result, pages: Math.ceil(count / limit) });
    }
    //==========  SEARCH BY BRAND CATEGORY AND SELECTED PRODUCT TAG ==========

    //  SEARCH BY TEXT INPUT
    if (search?.length) {
      const searchRegex = Utils.createRegex(search);
      result = await Products_Schema.find({
        product_name: { $regex: searchRegex },
      })
        .select(
          "product_id product_name new_arrival product_images product_main_category product_category product_subcategory product_variant product_description product_code"
        )
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
      count = await Products_Schema.find({
        product_name: { $regex: searchRegex },
      }).count();

      if (!result.length > 0) {
        result = await Products_Schema.find({
          product_code: { $regex: searchRegex },
        })
          .select(
            "product_id product_name new_arrival product_images product_main_category product_category product_subcategory product_variant product_description product_code"
          )
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip((page - 1) * limit);
        count = await Products_Schema.find({
          product_code: { $regex: searchRegex },
        }).count();
      }
      //    console.log("Result normal search=>",result)
      return res.status(200).send({ result, pages: Math.ceil(count / limit) });
    }
    //  SEARCH BY SUB CATEGORY
    if (searchBySubCategory) {
      const searchBySubCategoryObj = JSON.parse(searchBySubCategory);
      // console.log("SUB CATEGORY SEARCH--->",'parent',searchBySubCategory?.main_category,"cat",searchBySubCategory?.category,searchBySubCategory?.sub_category)
      // console.log('NEW',JSON.parse(searchBySubCategory))
      console.log("NEW OBJ", searchBySubCategoryObj);
      const searchBySubCategoryRegex = Utils.createRegex(
        searchBySubCategoryObj?.sub_category
      );
      result = await Products_Schema.find({
        product_main_category: searchBySubCategoryObj.main_category,
        product_category: searchBySubCategoryObj.category,
        product_subcategory: searchBySubCategoryObj.sub_category,
      })
        .select(
          "product_id product_name new_arrival product_images product_main_category product_category product_subcategory product_variant product_description product_code"
        )
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
      console.log("Result Sub category=>", result);
      count = await Products_Schema.find({
        product_main_category: searchBySubCategoryObj.main_category,
        product_category: searchBySubCategoryObj.category,
        product_subcategory: searchBySubCategoryObj.sub_category,
      }).count();
      console.log("count", count);
      return res.status(200).send({ result, pages: Math.ceil(count / limit) });
    }
    //  SEARCH BY CATEGORY
    if (searchByCategory) {
      console.log("MAIN CATEGORY SEARCH");
      const searchByCategoryRegex = Utils.createRegex(searchByCategory);
      result = await Products_Schema.find({
        product_main_category: { $regex: searchByCategoryRegex },
      })
        .select(
          "product_id product_name new_arrival product_images product_main_category product_category product_subcategory product_variant product_description product_code"
        )
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
      //    console.log("Result Category=>",result)
      count = await Products_Schema.find({
        product_main_category: searchByCategory,
      }).count();
      // console.log("Count -> category=",count)
      return res.status(200).send({ result, pages: Math.ceil(count / limit) });
    }
    //  SEARCH BY BRAND CATEGORY
    if (searchByBrandCategory) {
      console.log("CATEGORY SEARCH");
      const searchByBrandCategoryRegex = Utils.createRegex(
        searchByBrandCategory
      );
      result = await Products_Schema.find({
        product_category: { $regex: searchByBrandCategoryRegex },
      })
        .select(
          "product_id product_name new_arrival product_images product_main_category product_category product_subcategory product_variant product_description product_code"
        )
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
      //    console.log("Result Category=>",result)
      count = await Products_Schema.find({
        product_category: searchByBrandCategory,
      }).count();
      // console.log("Count -> category=",count)
      return res.status(200).send({ result, pages: Math.ceil(count / limit) });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("something went wrong !!");
  }
};

// FILTER FOR SEARCH PRODUCTS
const filterForProducts = async (req, res) => {
  const searchBySubCategory = req.query.subcategory;
  // console.log("searchBySubCategory",searchBySubCategory)
  try {
    if (searchBySubCategory) {
      const searchBySubCategoryObj = JSON.parse(searchBySubCategory);
      const getAllProductTags = await Products_Schema.aggregate([
        {
          $match: {
            product_main_category: searchBySubCategoryObj?.main_category,
            product_category: searchBySubCategoryObj?.category,
            product_subcategory: searchBySubCategoryObj?.sub_category,
          },
        },
        { $group: { _id: "$product_tag" } },
      ]).sort({ _id: 1 });
      // console.log("INSIDE",getAllProductTags)
      return res.status(200).send(getAllProductTags);
    }
    const getAllProductTags = await Products_Schema.aggregate([
      { $group: { _id: "$product_tag" } },
    ]).sort({ _id: 1 });
    // console.log("OUT SIDE",getAllProductTags)
    res.status(200).send(getAllProductTags);
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong !!");
  }
};

// GET NEW ARRIVALS PRODUCTS
const getNewArrivalProducts = async (req, res) => {
  const searchForNewArrival = req.query.category;
  const brandCategory = req.query.brand_category;
  const limit = req.query.limit || 10;
  const page = req.query.page || 1;
  // console.log(searchForNewArrival)
  let result;
  let count;
  try {
    //  SEARCH FOR NEW ARRIVALS
    const searchRegex = Utils.createRegex(searchForNewArrival);
    const searchRegexBrandCategory = Utils.createRegex(brandCategory);

    if (searchForNewArrival?.length && brandCategory != undefined) {
      result = await Products_Schema.find({
        product_main_category: { $regex: searchRegex },
        product_category: { $regex: searchRegexBrandCategory },
        new_arrival: true,
      })
        .select(
          "product_id product_name product_images new_arrival product_main_category product_category product_subcategory product_variant product_description product_code"
        )
        .sort({ updatedAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
      //    console.log("Result Category=>",result)
      count = await Products_Schema.find({
        product_main_category: searchForNewArrival,
        product_category: { $regex: searchRegexBrandCategory },
        new_arrival: true,
      }).count();
      // console.log("Count -> category=",count)
      return res.status(200).send({ result, pages: Math.ceil(count / limit) });
    } else {
      result = await Products_Schema.find({
        product_main_category: { $regex: searchRegex },
        new_arrival: true,
      })
        .select(
          "product_id product_name product_images new_arrival product_main_category product_category product_subcategory product_variant product_description product_code"
        )
        .sort({ updatedAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
      //    console.log("Result Category=>",result)
      count = await Products_Schema.find({
        product_main_category: searchForNewArrival,
        new_arrival: true,
      }).count();
      // console.log("Count -> category=",count)
      res.status(200).send({ result, pages: Math.ceil(count / limit) });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("something went wrong !!");
  }
};

// get category for new arrivals filter
const getBrandCategory = async (req, res) => {
  const brandName = req.params.brand_name;
  try {
    if (!brandName)
      return res
        .status(404)
        .send({ status: false, message: "not found brands !!" });
    const findBrand = await Brands_Schema.find({
      main_category_name: brandName,
    }).select(" category_name ");
    if (!findBrand)
      return res
        .status(404)
        .send({ status: false, message: "not found brands !!" });
    res
      .status(200)
      .send({ status: true, result: findBrand, message: "success !!" });
  } catch (err) {}
};

// Cart Checkout
const cartCheckout = async (req, res) => {
  // console.log(req.body);
  console.log(req.body?.products, "checkout products");

  try {
    const getOrdersCount = await Order_Schema.find().count();

    // console.log("order_00"+(getOrdersCount+1))
    const ordersCustomId = "order_00" + (getOrdersCount + 1);
    const getOrderId = "order-" + generateOrderId.generate(); //ordersCustomId
    console.log(getOrderId);
    const create = new Order_Schema({
      order_id: getOrderId,
      customer_phone_number: parseInt(req.body.customer_phone_number),
      customer_id: req.body.customer_id,
      customer_name: req.body.customer_name?.toLowerCase(),
      customer_email: req.body.customer_email?.toLowerCase(),
      order_status: "pending",
      products: req.body.products,
      shipping_address: req.body.shipping_address,
      state: req.body?.state,
      pincode: parseInt(req.body?.pincode),
      customer_gst: req.body?.customer_gst,
      customer_business: req.body?.customer_business,
      transport_detail: req.body?.transport_detail,
    });
    const result = await create.save();
    const updateUser = await Users_Schema.findOneAndUpdate(
      { user_id: req.body?.customer_id },
      {
        $set: {
          gst_number: req.body?.customer_gst,
          pincode: parseInt(req.body?.pincode),
          state: req.body?.state,
          address: req.body.shipping_address,
          user_business: req.body?.customer_business,
          email: req.body?.customer_email?.toLowerCase(),
        },
      }
    );

    res
      .status(200)
      .send({ status: true, message: "order created successfully !!" });
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong !!");
  }
};

/**
 * @author  Sam
 * @route   /app/cart/checkout/for/products/v2
 * @method  POST
 * @access  Protected
 * @desc    Create/place order and set its status as pending.
 */
const placeOrder = catchAsync(async (req, res, next) => {
  const user = req.user;
  const userType = req.userType;

  // Validate the data coming from the client side.
  const { data: orderData, error } = await verifyOrderData(req.body);

  if (error)
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      statusCode: httpStatus.BAD_REQUEST,
      message: error.message,
      error,
    });

  let billing_amount = 0;
  let rewardPoints = 0;
  let rewardPercentage = 0;
  const products = [];
  for (const product of orderData.products) {
    const productDetail = await Products_Schema.findOne({ _id: product._id });

    if (!productDetail) {
      const message = `Product with id "${product._id}" not found!`;
      throw new CaptureError(message, httpStatus.NOT_FOUND);
    }

    // if (
    //   !productDetail.product_price ||
    //   !productDetail.b2b_user_product_price ||
    //   !productDetail.b2c_user_product_price
    // ) {
    //   const message = `Product price not available. Please contact admin to resolve this issue.`;
    //   throw new CaptureError(message, httpStatus.INTERNAL_SERVER_ERROR);
    // }

    // switch (userType) {
    //   case "b2b": {
    //     productPrice = productDetail.b2b_user_product_price;
    //     break;
    //   }

    //   case "b2c": {
    //     productPrice = productDetail.b2c_user_product_price;
    //     break;
    //   }

    //   case "basic": {
    //     productPrice = productDetail.product_price;
    //     break;
    //   }

    //   default: {
    //     const message = "Something went wrong!!";
    //     throw new CaptureError(message, httpStatus.INTERNAL_SERVER_ERROR);
    //   }
    // }

    billing_amount += 0;
    // parseInt(product.product_quantity) * parseFloat(productPrice);

    const product_subcategory = productDetail?.product_subcategory;
    const product_category = productDetail?.product_category;

    // find the product category
    const productCategory = await Brands_Schema.findOne(
      {
        category_name: product_category,
      },
      { subcategory: 1 }
    );

    const findSubCategory = productCategory?.subcategory.find(
      (item) => item?.name === product_subcategory
    );
    if (findSubCategory) {
      rewardPercentage += findSubCategory?.rewardPercentage;
    }

    products.push({
      product_unique_id: productDetail._id,
      product_code: productDetail.product_code,
      product_id: productDetail.product_id,
      product_name: productDetail.product_name,
      product_main_category: productDetail.product_main_category,
      product_category: productDetail.product_category,
      product_subcategory: productDetail.product_subcategory,
      product_variant: productDetail.product_variant,
      product_quantity: product.product_quantity,
      // product_price: productPrice ,
      product_price: 0,
      product_quantity_by: product?.product_quantity_by,
      product_images: productDetail.product_images,
    });
  }
  console.log(rewardPercentage, "rewardPercentage");
  rewardPoints = (billing_amount / 100) * rewardPercentage;

  delete orderData.products;
  const order = {
    order_id: "order-" + generateOrderId.generate(), //ordersCustomId
    user: user._id,
    customer_id: user.user_id,
    total_amount: billing_amount,
    billing_amount: billing_amount,
    products,
    order_status: "pending",
    ...orderData,
  };

  const placedOrder = await withTransaction(async (session) => {
    const updateQueryArgs = [
      { _id: user._id },
      { $inc: { reward_points: rewardPoints } },
      { session },
    ];
    let updateRes = null;

    switch (userType) {
      case "b2b": {
        order.user_type = "B2BUsers";
        updateRes = await B2BUser.updateOne(...updateQueryArgs);
        break;
      }

      case "b2c": {
        order.user_type = "B2CUsers";
        updateRes = await B2CUser.updateOne(...updateQueryArgs);
        break;
      }

      case "basic": {
        order.user_type = "Users";
        updateRes = await Users_Schema.updateOne(...updateQueryArgs);
        break;
      }

      default: {
        const message = "Something went wrong";
        throw new CaptureError(message, httpStatus.INTERNAL_SERVER_ERROR);
      }
    }

    if (!updateRes.matchedCount)
      throw new CaptureError("Something went wrong please try again later!");

    const newOrder = new Order_Schema(order);
    await newOrder.save({ session });

    return newOrder;
  });

  if (!placedOrder)
    throw new CaptureError("Could not place order. Please try again later!");

  return res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Your order has been placed successfully!",
    order: placedOrder,
  });
});

// ========== USER AUTHENTICATION FLOW =============
// check user is exists or not
const checkExistingUser = async (req, res) => {
  const phoneNumber = req.params.phone_number;
  try {
    if (!phoneNumber) {
      return res
        .status(404)
        .send({ status: false, message: "user not found !!" });
    }
    const findUser = await Utils.doesEmailPhoneExist({ phone: phoneNumber });
    // console.log();
    // for sign up
    if (!findUser) {
      return res
        .status(200)
        .send({ user_exists: false, message: "user not found !!" });
    }
    // for sign in
    return res.status(200).send({
      user_exists: true,
      // user_id: findUser.user_id,
      message: "user found success !!",
    });
  } catch (err) {
    console.log(err);
    res.state(500).send("Something went wrong !!");
  }
};

// creating new user
const createUser = async (req, res) => {
  const { phone_number, username, user_id } = req.body;
  const convertPhone = phone_number.split(" ");
  const phoneNumber = convertPhone[1];
  try {
    const findUserPhone = await Users_Schema.findOne({
      phone_number: phoneNumber,
    });
    if (findUserPhone) {
      return res.send("User Already Exists !!");
    }
    const getUserId = uuidv4();
    // console.log(getUserId);
    const create = new Users_Schema({
      user_id: getUserId,
      username: username?.toLowerCase(),
      phone_number: parseInt(phoneNumber),
      joining_date: new Date().toUTCString(),
    });
    const result = await create.save();
    const findUser = await Users_Schema.findOne({
      phone_number: parseInt(phoneNumber),
    }).select("user_id username phone_number profile");
    if (!findUser) {
      return res.status(404).send("unauthenticated !!");
    }
    res.status(200).send({
      status: true,
      user: findUser,
      message: "created user success !!",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong");
  }
};
const loginUser = async (req, res) => {
  const { phone_number } = req.params;
  const convertPhone = phone_number.split(" ");
  const phoneNumber = convertPhone[1];
  console.log(phoneNumber, phone_number, convertPhone);
  try {
    if (!phoneNumber) {
      return res.status(404).send("unauthenticated !!");
    }
    const findUser = await Users_Schema.findOne({
      phone_number: parseInt(phoneNumber),
    }).select("user_id username phone_number profile");
    if (!findUser) {
      return res.status(404).send("unauthenticated !!");
    }
    res.status(200).send({ status: true, user: findUser });
  } catch (err) {
    console.log(err);
    res.status(500).send("something went wrong !!");
  }
};
// ========== USER AUTHENTICATION FLOW =============

// get user by user id
const getUserById = async (req, res) => {
  const userId = req.params.user_id;
  console.log(req.headers);
  const userType = req.headers?.usertype;

  if (!userType) {
    return res.status(400).json({
      success: false,
      message: "Please provide a user type!",
    });
  }

  try {
    if (!userId)
      return res
        .status(404)
        .send({ status: false, message: "Please provide a user id!" });

    let findUser;

    if (userType === "b2b") {
      findUser = await B2BUser.findOne(
        { _id: userId },
        { password: 0, is_approved: 0, profile: 0, __v: 0 }
      );
    }

    if (userType === "b2c") {
      findUser = await B2CUser.findOne({ _id: userId }, { password: 0 });
    }

    if (!findUser)
      return res
        .status(404)
        .send({ status: false, message: "not found user !!" });
    res.status(200).send({ status: true, message: "success", user: findUser });
  } catch (err) {
    console.log(err);
    res.status(500).send("something went wrong !!");
  }
};

// edit users by id
const editUserByID = async (req, res) => {
  const userId = req.params.user_id;
  console.log("USER ID=>", userId, "REQUEST BODY", req.body);
  try {
    if (!userId) {
      return res.send("please provide a user id");
    }
    const findUser = await Users_Schema.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          username: req.body.username,
          gst_number: req.body?.gst_number,
          pincode: parseInt(req.body?.pincode),
          transport_detail: req.body?.transport_detail,
          state: req.body?.state,
          address: req.body.shipping_address,
          user_business: req.body?.customer_business,
          email: req.body?.customer_email?.toLowerCase(),
        },
      }
    );
    console.log(findUser);
    if (!findUser) {
      return res.send("user not found");
    }
    res.status(200).send({
      status: true,
      user: {
        _id: findUser._id,
        user_id: findUser.user_id,
        username: findUser.username,
        phone_number: findUser.phone_number,
      },
      message: "user updated successfully !!",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong !!");
  }
};

// get all orders
const getAllOrdersByUserId = async (req, res) => {
  const { customer_id, user_id } = req.query;
  console.log("userId", user_id);

  try {
    if (!customer_id && !user_id) {
      return res.status(404).send("please provide a valid customer id");
    }
    let filterObject = {};
    if (customer_id) {
      filterObject.customer_id = customer_id;
    }
    if (user_id) {
      filterObject.user = mongoose.Types.ObjectId(user_id);
    }

    const findOrders = await Order_Schema.find(filterObject).sort({
      createdAt: -1,
    });
    res.status(200).send(findOrders);
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong !!");
  }
};

// get all banners
const getAllHomeScreenbanner = async (req, res) => {
  try {
    const findAll = await Banners_Schema.find({})
      .select("image_url selected_category category_chain")
      .sort({ createdAt: -1 });
    res.status(200).send(findAll);
  } catch (err) {
    console.log(err);
    res.status(500).send("something went wrong !!");
  }
};

// cancel order by order id
const cancelOrderById = async (req, res) => {
  const orderId = req.params.order_id;
  console.log("orderId", orderId);
  try {
    if (!orderId) {
      return res.status(404).send({ status: false, message: "not found !!" });
    }
    const findOrder = await Order_Schema.findByIdAndUpdate(orderId, {
      $set: { order_status: "cancelled" },
    });
    if (!findOrder) {
      return res.status(404).send({ status: false, message: "not found !!" });
    }
    res
      .status(200)
      .send({ status: true, message: "order cancelled success !!" });
  } catch (err) {
    console.log(err);
    res.status(500).send("something went wrong !! ");
  }
};

// send message for order enquiry
const sendMessageEnquiry = async (req, res) => {
  console.log(req.body);
  try {
    const create = new Enquiry_Schema({
      order_id: req.body?.order_id,
      user_id: req.body?.user_id,
      username: req.body.username,
      message: req.body.message,
      phone_number: req.body.phone_number,
    });
    const result = await create.save();
    res
      .status(200)
      .send({ status: true, message: "you message has been received !!" });
  } catch (err) {
    console.log(err);
    res.status(500).send("something went wrong !!");
  }
};

const editUserProfilePicture = async (req, res) => {
  const user_id = req.params?.user_id;
  console.log("user_id", user_id);
  console.log("user_id", req.body);
  try {
    if (!user_id) {
      return res.status(404).send({ status: false, message: "not found!!" });
    }
    const findUser = await Users_Schema.findById(user_id);
    if (!findUser) {
      return res.status(404).send({ status: false, message: "not found!!" });
    }
    const updatedUser = await Users_Schema.findByIdAndUpdate(user_id, {
      $set: { profile: req.body },
    });
    console.log(updatedUser);
    res.status(200).send({
      status: true,
      previousProfile: findUser?.profile,
      message: "user profile updated sccuess!!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("something went wrong !!");
  }
};

const getUserProfilePicture = async (req, res) => {
  const user_id = req.params?.user_id;
  try {
    if (!user_id) {
      return res.status(404).send({ status: false, message: "not found!!" });
    }
    const findUser = await Users_Schema.findById(user_id);
    if (!findUser) {
      return res.status(404).send({ status: false, message: "not found!!" });
    }
    res.status(200).send({
      status: true,
      profile: findUser?.profile,
      message: "user profile updated sccuess!!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("something went wrong !!");
  }
};

/**
 * @author  Sam
 * @route   /api/app/create/user/b2b
 * @access  Public
 * @desc    Create a B2B user and set its isApproved to false.
 */
const createB2BAccount = catchAsync(async (req, res, next) => {
  // Verify the incoming data.
  const { data: userData, error } = await verifyB2BAccountData(req.body);
  if (error)
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      statusCode: httpStatus.BAD_REQUEST,
      message: error.message,
      error,
    });

  const phoneEmailExists = await Utils.doesEmailPhoneExist({
    email: userData.email,
    phone: userData.mobile,
  });

  if (phoneEmailExists)
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      statusCode: httpStatus.BAD_REQUEST,
      message: "Email or phone already registered!",
    });

  const newB2BUserSession = new B2BUserSession(userData);
  await newB2BUserSession.save();

  const savedUser = newB2BUserSession.toObject();
  delete savedUser.password;

  return res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: httpStatus.CREATED,
    sessionId: savedUser._id,
    sessionExpiryTime: "5m",
    userType: "b2b",
  });
});

/**
 * @author  Sam
 * @route   /api/app/create/user/b2c
 * @method  POST
 * @access  Public
 * @desc    Create a B2C user.
 */
const createB2CAccount = catchAsync(async (req, res, next) => {
  // Verify the incoming data.
  const { data: userData, error } = await verifyB2CAccountData(req.body);

  if (error)
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      statusCode: httpStatus.BAD_REQUEST,
      message: error.message,
      error,
    });

  const phoneEmailExists = await Utils.doesEmailPhoneExist({
    email: userData.email,
    phone: userData.mobile,
  });

  if (phoneEmailExists)
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      statusCode: httpStatus.BAD_REQUEST,
      message: "Email or phone already registered!",
    });

  const newB2CUserSession = new B2CUserSession(userData);
  await newB2CUserSession.save();

  const savedUser = newB2CUserSession.toObject();
  delete savedUser.password;

  return res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: httpStatus.CREATED,
    sessionId: savedUser._id,
    sessionExpiryTime: "5m",
    userType: "b2c",
  });
});

/**
 * @author  Sam
 * @route   /app/verify/register/with/otp
 * @method  POST
 * @access  Semi Protected
 * @desc    Successfully completes the registration process of B2B and B2C user. Take user data out
 *          from the appropriate session schema and put it in the respective user schema.
 */
const completeRegistration = catchAsync(async (req, res, next) => {
  const { sessionId, userType } = req.body;

  if (!sessionId) {
    const message = "Please send the session id!";
    throw new CaptureError(message, httpStatus.BAD_REQUEST);
  }

  if (!isValidObjectId(sessionId)) {
    const message = "Session id you sent is not valid!";
    throw new CaptureError(message, httpStatus.BAD_REQUEST);
  }

  let user = null;
  switch (userType?.toLowerCase()) {
    case "b2b": {
      user = await B2BUserSession.findById({ _id: sessionId });

      break;
    }
    case "b2c": {
      user = await B2CUserSession.findById(sessionId);
      break;
    }

    default: {
      const message = "Invalid user type provided!";
      throw new CaptureError(message, httpStatus.BAD_REQUEST);
    }
  }

  if (!user) {
    const message = "Session id does not exist! Please register first!";
    throw new CaptureError(message, httpStatus.BAD_REQUEST);
  }

  if (Utils.hasElapsedMinutes(user.createdAt, 1)) {
    await user.delete();

    const message = "Please register yourself again";
    throw new CaptureError(message, httpStatus.BAD_REQUEST);
  }

  let accessToken = null;
  const secret = process.env.JWT_TOKEN_SECRET;
  if (userType?.toLowerCase() === "b2b") {
    const newB2bUser = new B2BUser(user.toObject());
    await newB2bUser.save();
    await user.delete();

    const payload = {
      _id: user._id,
      userType: "b2b",
      isApproved: user.is_approved,
    };
    accessToken = TokenService.signToken(payload, secret);

    res.header("x-b2b-access-token", accessToken);
  } else {
    const newB2cUser = new B2CUser(user.toObject());
    await newB2cUser.save();
    await user.delete();

    const payload = {
      _id: user._id,
      name: user.name,
      userType: "b2c",
    };
    accessToken = TokenService.signToken(payload, secret);

    res.header("x-b2c-access-token", accessToken);
  }

  return res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    user: {
      _id: user._id,
      email: user.email,
      mobile: user.mobile,
      type: userType,
    },
    accessToken,
  });
});

/**
 * @author  Sam
 * @route   /app/login/user/b2b/b2c
 * @method  POST
 * @access  Public
 * @desc    Login B2B and B2C user by returning appropriate tokens.
 */
const loginB2bAndB2cUser = catchAsync(async (req, res, next) => {
  const { emailOrPhone, password, userType } = req.body;

  if (!emailOrPhone) {
    const message = "Please provide either email or phone!";
    throw new CaptureError(message, httpStatus.BAD_REQUEST);
  }

  if (!password)
    throw new CaptureError("Please provide password", httpStatus.BAD_REQUEST);

  if (userType.toLowerCase() !== "b2b" && userType.toLowerCase() !== "b2c") {
    const message = "Please provide correct user type";
    throw new CaptureError(message, httpStatus.BAD_REQUEST);
  }

  let user = null;

  const emailOrPhoneRegEx = new RegExp(emailOrPhone, "i");
  if (userType.toLowerCase() === "b2b") {
    user = await B2BUser.findOne({
      $or: [{ email: emailOrPhoneRegEx }, { mobile: emailOrPhoneRegEx }],
    });
  } else if (userType.toLowerCase() === "b2c") {
    user = await B2CUser.findOne({
      $or: [{ email: emailOrPhoneRegEx }, { mobile: emailOrPhoneRegEx }],
    });
  }

  if (!user)
    throw new CaptureError("Email or Mobile not found", httpStatus.NOT_FOUND);

  if (!(await user.isCorrectPassword(password))) {
    const message = "You entered wrong password!";
    throw new CaptureError(message, httpStatus.BAD_REQUEST);
  }

  let payload = null;
  let accessToken = null;
  const secret = process.env.JWT_TOKEN_SECRET;

  if (userType.toLowerCase() === "b2b") {
    payload = {
      _id: user._id,
      userType: "b2b",
      isApproved: user.is_approved,
    };
    accessToken = TokenService.signToken(payload, secret);

    res.header("x-b2b-access-token", accessToken);
  } else if (userType.toLowerCase() === "b2c") {
    payload = {
      _id: user._id,
      name: user.name,
      userType: "b2c",
    };
    accessToken = TokenService.signToken(payload, secret);

    res.header("x-b2c-access-token", accessToken);
  }

  return res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    user: {
      _id: user._id,
      email: user.email,
      mobile: user.mobile,
      type: payload.userType,
    },
    accessToken,
  });
});

const checkMobileNumber = catchAsync(async (req, res, next) => {
  const { phoneNumber } = req.query;
  if (!phoneNumber) {
    return res.status(httpStatus.BAD_REQUEST).json({
      statusCode: httpStatus.BAD_REQUEST,
      message: "Please provide a phone number",
    });
  }

  const findUserAccount = await Users_Schema.findOne(
    { phone_number: phoneNumber },
    { phone_number: 1 }
  );
  const findB2BUserAccount = await B2BUser.findOne(
    { mobile: phoneNumber },
    { mobile: 1 }
  );
  const findB2CUserAccount = await B2CUser.findOne(
    { mobile: phoneNumber },
    { mobile: 1 }
  );

  if (!findUserAccount && !findB2BUserAccount && !findB2CUserAccount) {
    return res.status(httpStatus.NOT_FOUND).json({
      statusCode: httpStatus.NOT_FOUND,
      message: "Mobile number not found!",
    });
  }

  return res.status(httpStatus.OK).json({
    statusCode: httpStatus.OK,
    message: "User account found",
  });
});

const updatePassword = catchAsync(async (req, res, next) => {
  const { phoneNumber, newPassword, confirmPassword } = req.body;
  if (!phoneNumber) {
    return res.status(httpStatus.BAD_REQUEST).json({
      statusCode: httpStatus.BAD_REQUEST,
      message: "Please provide a phone number",
    });
  }
  if (!newPassword) {
    return res.status(httpStatus.BAD_REQUEST).json({
      statusCode: httpStatus.BAD_REQUEST,
      message: "Please provide a password",
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(httpStatus.BAD_REQUEST).json({
      statusCode: httpStatus.BAD_REQUEST,
      message: "New password and confirm password is not same.",
    });
  }

  const { error } = await verifyUpdatePassword(req.body);

  if (error)
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      statusCode: httpStatus.BAD_REQUEST,
      message: error.message,
    });

  const findUserAccount = await Users_Schema.findOne(
    { phone_number: phoneNumber },
    { phone_number: 1 }
  );
  const findB2BUserAccount = await B2BUser.findOne(
    { mobile: phoneNumber },
    { mobile: 1 }
  );
  const findB2CUserAccount = await B2CUser.findOne(
    { mobile: phoneNumber },
    { mobile: 1 }
  );

  if (!findUserAccount && !findB2BUserAccount && !findB2CUserAccount) {
    return res.status(httpStatus.NOT_FOUND).json({
      statusCode: httpStatus.NOT_FOUND,
      message: "Mobile number not found!",
    });
  }

  const hash = await bcrypt.hash(newPassword, 12);

  if (findUserAccount) {
    const updateAccountPassword = await Users_Schema.updateOne(
      { phone_number: phoneNumber },
      {
        $set: {
          password: hash,
        },
      }
    );
    if (updateAccountPassword.modifiedCount) {
      return res.status(httpStatus.OK).json({
        statusCode: httpStatus.OK,
        message: "Password updated successfully",
      });
    }
  }
  if (findB2BUserAccount) {
    const updateAccountPassword = await B2BUser.updateOne(
      { mobile: phoneNumber },
      {
        $set: {
          password: hash,
        },
      }
    );
    if (updateAccountPassword.modifiedCount) {
      return res.status(httpStatus.OK).json({
        statusCode: httpStatus.OK,
        message: "Password updated successfully",
      });
    }
  }
  if (findB2CUserAccount) {
    const updateAccountPassword = await B2CUser.updateOne(
      { mobile: phoneNumber },
      {
        $set: {
          password: hash,
        },
      }
    );
    if (updateAccountPassword.modifiedCount) {
      return res.status(httpStatus.OK).json({
        statusCode: httpStatus.OK,
        message: "Password updated successfully",
      });
    }
  }

  return res.status(httpStatus.BAD_REQUEST).json({
    statusCode: httpStatus.BAD_REQUEST,
    message: "Please try again later",
  });
});

exports.getSearchProducts = getSearchProducts;
exports.showAllBrands = showAllBrands;
exports.brandsForHomeScreen = brandsForHomeScreen;
exports.getAllBrands = getAllBrands;
exports.brandsSubCategoryAndProducts = brandsSubCategoryAndProducts;
exports.getProductById = getProductById;
exports.searchProducts = searchProducts;
exports.cartCheckout = cartCheckout;
exports.placeOrder = placeOrder;
exports.checkExistingUser = checkExistingUser;
exports.createUser = createUser;
exports.loginUser = loginUser;
exports.completeRegistration = completeRegistration;
exports.getAllOrdersByUserId = getAllOrdersByUserId;
exports.getAllHomeScreenbanner = getAllHomeScreenbanner;
exports.cancelOrderById = cancelOrderById;
exports.sendMessageEnquiry = sendMessageEnquiry;
exports.editUserByID = editUserByID;
exports.getUserById = getUserById;
exports.getNewArrivalProducts = getNewArrivalProducts;
exports.getBrandCategory = getBrandCategory;
exports.filterForProducts = filterForProducts;
exports.editUserProfilePicture = editUserProfilePicture;
exports.getUserProfilePicture = getUserProfilePicture;
exports.createB2BAccount = createB2BAccount;
exports.createB2CAccount = createB2CAccount;
exports.loginB2bAndB2cUser = loginB2bAndB2cUser;
exports.updatePassword = updatePassword;
exports.checkMobileNumber = checkMobileNumber;
