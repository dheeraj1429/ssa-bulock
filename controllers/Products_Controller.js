const Products_Schema = require("../modals/Products");
const Brands_Schema = require("../modals/Brands");
const product_status = require("../utils/configs/product_status");
const Utils = require("../utils/Utils");
const usersModel = require("../modals/Users");
const b2BUserModel = require("../modals/B2BUser");
const b2CUserModel = require("../modals/B2CUser");
const { default: mongoose } = require("mongoose");
const MessageService = require("../utils/messageService");
const catchAsync = require("../middlewares/catchAsync");
const fs = require("fs");
const xlsx = require("xlsx");

// create new product

const generateArrayOfPhoneNumbers = function (arr) {
  return arr.map((el) => `+91${el?.phone_number || el?.mobile}`);
};

const createProducts = async (req, res) => {
  try {
    // const checkExisting = await Products_Schema.findOne({product_code:req.body.product_code})
    // if(checkExisting.length > 0 ){
    //     return res.status(203).send({status:false,message:'product code already exists !!'})

    // }
    const getProductsCount = await Products_Schema.find().count();
    console.log("prod_00" + (getProductsCount + 1));
    const productCustomId = "prod_00" + (getProductsCount + 1);
    const create = new Products_Schema({
      product_id: productCustomId,
      product_name: req.body.product_name?.toLowerCase(),
      product_slug: req.body.product_name?.toLowerCase(),
      product_code: req.body.product_code,
      product_price: req.body.product_price,
      quantity: req.body.product_quantity,
      original_quantity: req.body.product_quantity,
      product_images: req.body.product_images,
      product_main_category: req.body.product_main_category?.toLowerCase(),
      product_main_category_slug: req.body.product_main_category?.toLowerCase(),
      product_category: req.body.product_category?.toLowerCase(),
      product_category_slug: req.body.product_category?.toLowerCase(),
      product_subcategory: req.body.product_subcategory?.toLowerCase(),
      product_subcategory_slug: req.body.product_subcategory?.toLowerCase(),
      new_arrival: req.body?.new_arrival,
      cartoon_total_products: req.body?.cartoon_total_products,
      color: req.body?.color?.toLowerCase(),
      size: req.body?.size?.toLowerCase(),
      product_tag: req.body?.product_tag?.trim(),
      product_description: req.body.product_description?.toLowerCase(),
      product_variant: req.body.product_variant?.toLowerCase(),
      product_price: req.body?.product_price,
      b2b_user_product_price: req.body?.b2b_user_product_price,
      b2c_user_product_price: req.body?.b2c_user_product_price,
      product_collected_points: req.body?.product_collected_points,
    });
    const result = await create.save();

    if (req.body?.new_arrival) {
      const userPhoneNumberList = await usersModel.find(
        {},
        { phone_number: 1, _id: 0 }
      );
      const b2bUsersNumbersList = await b2BUserModel.find(
        {},
        { mobile: 1, _id: 0 }
      );
      const b2CUserNumbersList = await b2CUserModel.find(
        {},
        { mobile: 1, _id: 0 }
      );
      const messageService = new MessageService();
      const allUsersNumbers = [
        ...generateArrayOfPhoneNumbers(userPhoneNumberList),
        ...generateArrayOfPhoneNumbers(b2bUsersNumbersList),
        ...generateArrayOfPhoneNumbers(b2CUserNumbersList),
      ];
      for (let i = 0; i < allUsersNumbers.length; i++) {
        messageService.sendMessage({
          to: allUsersNumbers[i],
          message: `Get ready to place your order 🛒\nStart filling up your cart with groceries & more. Utilize your wallet balance before it expires to get an instant discount of 10% 😍\n\nWhy wait? 🥳`,
          file: "https://upi-gateway.s3.ap-south-1.amazonaws.com/c95e12d70f72831a80642cff762b4ccc.jpg",
        });
      }
    }

    // res.status(200).send(result)
    res
      .status(200)
      .send({ status: true, message: "product created successfully !" });
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong !!");
  }
};

// get all products
const getAllProducts = async (req, res) => {
  try {
    const getProductsCount = await Products_Schema.find({}).count();
    const categoryForFilter = await Brands_Schema.aggregate([
      { $group: { _id: "$main_category_name" } },
    ]);
    const allProducts = await Products_Schema.find({}).sort({ createdAt: -1 });
    res.status(200).send({
      allProducts: allProducts,
      getProductsCount: getProductsCount,
      getAllProductStatus: product_status,
      categoryForFilter: categoryForFilter,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong !!");
  }
};

// get product by id
const getproductById = async (req, res) => {
  const productId = req.params.product_id;
  try {
    if (!productId) {
      return res
        .status(404)
        .send({ status: false, message: "product not found !!" });
    }
    // const findProductById = await Products_Schema.findById(productId);
    // console.log('-> ',findProductById)

    const findProductById = await Products_Schema.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(productId) } },
      {
        $project: {
          _id: 1,
          product_id: 1,
          product_code: 1,
          product_name: 1,
          product_slug: 1,
          product_variant: 1,
          new_arrival: 1,
          color: 1,
          size: 1,
          cartoon_total_products: 1,
          quantity: 1,
          original_quantity: 1,
          product_images: 1,
          product_main_category: 1,
          product_main_category_slug: 1,
          product_category: 1,
          product_category_slug: 1,
          product_subcategory: 1,
          product_subcategory_slug: 1,
          product_description: 1,
          createdAt: 1,
          updatedAt: 1,
          product_price: {
            $convert: { input: "$product_price", to: "string" },
          },
          b2b_user_product_price: {
            $convert: { input: "$b2b_user_product_price", to: "string" },
          },
          b2c_user_product_price: {
            $convert: { input: "$b2c_user_product_price", to: "string" },
          },
          product_reward_points: 1,
          product_collected_points: 1,
        },
      },
    ]);

    const data = findProductById?.[0];
    if (!data) {
      return res
        .status(404)
        .send({ status: false, message: "product not found !!" });
    }
    res.status(200).send(data);
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong !!");
  }
};

// edit products
const editProduct = async (req, res) => {
  const productId = req.params.product_id;
  console.log("productId=>", productId);
  console.log(req.body);

  try {
    if (!productId) {
      return res.status(404).send("Not Found !!");
    }
    const updateProduct = await Products_Schema.findByIdAndUpdate(productId, {
      $set: req.body,
    });
    if (!updateProduct) {
      return res.status(404).send("product not found !!");
    }
    res.status(200).send(updateProduct);
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong !!");
  }
};

// SEARCH IN PRODUCTS
const searchProducts = async (req, res) => {
  const searchValue = req.query.search;
  const searchRegex = Utils.createRegex(searchValue);
  let result = [];
  try {
    const products = await Products_Schema.find({
      product_name: { $regex: searchRegex },
    }).sort({ createdAt: -1 });
    result = products;
    // if(!result.length > 0){
    const findmoreproducts = await Products_Schema.find({
      product_code: { $regex: searchRegex },
    }).sort({ createdAt: -1 });
    result.push(...findmoreproducts);
    // }
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong !!");
  }
};

// Filter for products table
const filterProducts = async (req, res) => {
  const { by_status, date_from, date_to, by_category, by_product_status } =
    req.query;
  let result;
  console.log("by_status,date_from,date_to", by_status, date_from, date_to);
  try {
    const endDate = new Date(`${date_to}`);
    // seconds * minutes * hours * milliseconds = 1 day
    const dayTime = 60 * 60 * 24 * 1000;
    let increaseEndDateByOne = new Date(endDate.getTime() + dayTime);
    // console.log("INCREASED DATE",increaseEndDateByOne)

    // filter users by todays date and by their status
    let user_status;
    if (date_from && date_to && by_category) {
      if (by_category != "all") {
        result = await Products_Schema.aggregate([
          {
            $match: {
              product_main_category: by_category,
              createdAt: {
                $lte: Utils.convertDate(increaseEndDateByOne),
                $gte: Utils.convertDate(date_from),
              },
            },
          },
        ]).sort({ createdAt: -1 });
        return res.status(200).send(result);
      }
    } else {
      result = await Products_Schema.find({
        product_main_category: by_category,
      }).sort({ createdAt: -1 });
      // return res.status(200).send(result)
    }

    if (date_from && date_to) {
      result = await Products_Schema.aggregate([
        {
          $match: {
            createdAt: {
              $lte: Utils.convertDate(increaseEndDateByOne),
              $gte: Utils.convertDate(date_from),
            },
          },
        },
      ]).sort({ createdAt: -1 });
      console.log("RESULT NEW----", result);
      return res.status(200).send(result);
    }

    if (by_category != "all") {
      result = await Products_Schema.find({
        product_main_category: by_category,
      }).sort({ createdAt: -1 });
      return res.status(200).send(result);
    }
    if (by_product_status != "all") {
      console.log(by_product_status);
      result = await Products_Schema.find({
        product_status: by_product_status,
      }).sort({ createdAt: -1 });
      return res.status(200).send(result);
    }
  } catch (err) {
    console.log(err);
    res.status(200).send("Somthing went wrong !!");
  }
};

// delete products
const deleteProducts = async (req, res) => {
  // console.log("body=>",req.body)
  // console.log("body=>",req.body?.length)
  try {
    if (req.body?.length) {
      const deleteSelected = await Products_Schema.deleteMany({
        _id: {
          $in: req.body,
        },
      });
      if (!deleteSelected) {
        return res
          .status(200)
          .send({ message: "product delete failed", status: false });
      }
      return res
        .status(200)
        .send({ message: "product delete success", status: true });
    }

    res.status(200).send({ message: "product delete failed", status: false });
  } catch (err) {
    console.log(err);
    res.status(200).send({ message: "product delete failed", status: false });
  }
};

//  delete product image
const deleteProductImage = async (req, res) => {
  const productId = req.params.product_id;
  const productImageName = req.params.product_image;
  console.log("request=>", productId, productImageName);
  try {
    if (!productId) {
      return res
        .status(404)
        .send({ status: false, message: "product not found !!" });
    }
    const findProduct = await Products_Schema.findById(productId).select(
      "product_images"
    );
    console.log(findProduct);
    let result = findProduct;
    console.log("result=>", result);
    const filteredProductsImages = await result?.product_images?.filter(
      (value, index) => value.image_name !== productImageName
    );
    console.log("result----->", result);
    const updateProductImage = await Products_Schema.findByIdAndUpdate(
      productId,
      { $set: { product_images: filteredProductsImages } }
    );
    console.log("updated products=>", updateProductImage);
    res
      .status(200)
      .send({ status: true, message: "product image deleted successfully !!" });
  } catch (err) {
    console.log(err);
    res.status(200).send({ status: false, message: "image delete failed !!" });
  }
};

// set  new arrivals products
const setNewArrivalProducts = async (req, res) => {
  // console.log("body=>",req.body)
  // console.log("body=>",req.body?.data)
  try {
    if (req.body?.data?.length) {
      const updateSelected = await Products_Schema.updateMany(
        { _id: { $in: req.body.data } },
        { $set: { new_arrival: true } },
        { multi: true }
      );
      if (!updateSelected) {
        return res.status(200).send({
          message: "product set as new arrival failed",
          status: false,
        });
      }
      return res
        .status(200)
        .send({ message: "product set as new arrival success", status: true });
    }
    res
      .status(200)
      .send({ message: "product set as new arrival failed", status: false });
  } catch (err) {
    console.log(err);
    res
      .status(200)
      .send({ message: "product set as new arrival failed", status: false });
  }
};

// set  new arrivals products
const removeNewArrivalProducts = async (req, res) => {
  // console.log("body=>",req.body)
  // console.log("body=>",req.body?.data)
  try {
    if (req.body?.data?.length) {
      const updateSelected = await Products_Schema.updateMany(
        { _id: { $in: req.body.data } },
        { $set: { new_arrival: false } },
        { multi: true }
      );
      if (!updateSelected) {
        return res.status(200).send({
          message: "product remove as new arrival failed",
          status: false,
        });
      }
      return res.status(200).send({
        message: "product remove as new arrival success",
        status: true,
      });
    }
    res
      .status(200)
      .send({ message: "product remove as new arrival failed", status: false });
  } catch (err) {
    console.log(err);
    res
      .status(200)
      .send({ message: "product remove as new arrival failed", status: false });
  }
};

const updateProductPrice = catchAsync(async (req, res, next) => {
  const fileName = req.fileName;
  const file = `./uploads/${fileName}`;
  const workbook = xlsx.readFile(file);
  let workbook_sheet = workbook.SheetNames;
  let workbook_response = xlsx.utils.sheet_to_json(
    workbook.Sheets[workbook_sheet[0]]
  );
  const invalidProductInformation = [];
  const updatedProductInformation = [];
  const noChanges = [];

  for (product in workbook_response) {
    const hsnNumber =
      workbook_response[product]?.["HSN "] ||
      workbook_response[product]?.["HSN"];

    if (
      workbook_response[product]?.["PRICE"] &&
      workbook_response[product]?.["A PRICE"] &&
      workbook_response[product]?.["PART NO"] &&
      hsnNumber &&
      workbook_response[product]?.["GST"]
    ) {
      const gst = Math.floor(workbook_response[product]?.["GST"] * 100);

      const update = await Products_Schema.updateOne(
        { product_code: workbook_response[product]?.["PART NO"] },
        {
          $set: {
            product_price: workbook_response[product]?.["A PRICE"],
            b2b_user_product_price: Math.round(
              Number(workbook_response[product]?.["PRICE"])
            ),
            b2c_user_product_price: Math.round(
              Number(workbook_response[product]?.["A PRICE"])
            ),
            gst,
            hsnNumber,
          },
        }
      );
      if (update.modifiedCount) {
        updatedProductInformation.push(workbook_response[product]);
      } else {
        noChanges.push(workbook_response[product]);
      }
    } else {
      invalidProductInformation.push(workbook_response[product]);
    }
  }
  if (fileName) {
    fs.unlinkSync(file);
  }
  return res.status(200).json({
    success: true,
    invalidProductInformation,
    noChanges,
    updatedProductInformation,
    message: "Products updated successfully",
  });
});

exports.createProducts = createProducts;
exports.getAllProducts = getAllProducts;
exports.getproductById = getproductById;
exports.editProduct = editProduct;
exports.deleteProducts = deleteProducts;
exports.searchProducts = searchProducts;
exports.filterProducts = filterProducts;
exports.deleteProductImage = deleteProductImage;
exports.setNewArrivalProducts = setNewArrivalProducts;
exports.removeNewArrivalProducts = removeNewArrivalProducts;
exports.updateProductPrice = updateProductPrice;
