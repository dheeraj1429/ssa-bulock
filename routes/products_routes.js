const express = require("express")
const router = express.Router()
const multer = require('multer');
const Product_Controllers = require("../controllers/Products_Controller")


const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./uploads");
      },
      filename: function(req, file, cb) {
        cb(null, file.originalname);
        req.fileName = file.originalname
      }
});
const upload = multer({ storage: storage });

// all products routes 
router.get("/all/products",Product_Controllers.getAllProducts);
router.post("/add/new/product",Product_Controllers.createProducts);
router.get("/get/single/product/:product_id",Product_Controllers.getproductById);
router.patch("/edit/product/:product_id",Product_Controllers.editProduct);
router.patch("/remove/product/image/:product_id/:product_image",Product_Controllers.deleteProductImage);
router.delete("/delete/product",Product_Controllers.deleteProducts);
router.get("/search/in/products",Product_Controllers.searchProducts);
router.get("/filter/products",Product_Controllers.filterProducts);
router.patch("/set/products/as/new/arrivals",Product_Controllers.setNewArrivalProducts);
router.patch("/remove/products/as/new/arrivals",Product_Controllers.removeNewArrivalProducts);

router.post('/update-product-price', upload.single('file'), Product_Controllers.updateProductPrice);

module.exports = router