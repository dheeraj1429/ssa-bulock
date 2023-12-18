const { isValidObjectId } = require('mongoose');
const yup = require('yup');

const orderSchema = yup.object({
  customer_name: yup.string().min(3).max(64).required().label('Name'),
  customer_phone_number: yup
    .string()
    .matches(/^[6-9]\d{9}$/, 'Please enter valid phone number!')
    .required()
    .label('Phone number'),
  customer_business: yup
    .string()
    .min(3)
    .max(256)
    .required()
    .label('Business Name'),
  customer_email: yup.string().email().optional().label('E-mail'),
  customer_gst: yup
    .string()
    .matches(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Please enter valid GST number'
    )
    .optional()
    .label('GST Number'),
  products: yup
    .array(
      yup.object({
        _id: yup
          .string()
          .test('is-valid-object-id', 'Invalid ObjectId', isValidObjectId)
          .required()
          .label('Product ID'),
        product_quantity: yup
          .number()
          .min(1)
          .required()
          .label('Product quantity!'),
        product_quantity_by: yup.string(),
      })
    )
    .min(1, 'Please order at least 1 product')
    .required()
    .label('Products'),
  shipping_address: yup
    .string()
    .min(10)
    .max(512)
    .required()
    .label('Shipping Address'),
  state: yup.string().min(3).max(64).required().label('State'),
  pincode: yup
    .string()
    .matches(/^[1-9][0-9]{5}$/, 'Please enter valid pincode')
    .required()
    .label('Pincode'),
  transport_detail: yup
    .string()
    .min(3)
    .max(256)
    .optional()
    .label('Transport Details'),
  ordered_products_transport_detail: yup
    .string()
    .min(3)
    .max(256)
    .optional()
    .label('Ordered Products Transport Details'),
});

const verifyOrderData = async (payload) => {
  try {
    const validationResult = await orderSchema.validate(payload, {
      stripUnknown: true,
    });

    return { data: validationResult, error: null };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return {
        data: null,
        error: {
          key: error.path,
          value: error?.params?.originalValue,
          message: error.message,
        },
      };
    } else {
      throw error;
    }
  }
};

module.exports = { verifyOrderData };
