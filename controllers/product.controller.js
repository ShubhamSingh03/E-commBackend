import fs from "fs";
import Mongoose from "mongoose";
import formidable from "formidable";

import Product from "../models/product.schema";
import { s3FileDelete, s3FileUpload } from "../services/imageUploader";
import asyncHandler from "../services/asyncHandler";
import CustomError from "../utils/customError";
import config from "../config/index.js";

/**********************************************************
 * @ADD_PRODUCT
 * @route https://localhost:5000/api/product
 * @description Controller used for creating a new product
 * @description Only admin can create the coupon
 * @descriptio Uses AWS S3 Bucket for image upload
 * @parameter name, price, description, photos[], stock, sold, colectionId
 * @returns Product Object
 *********************************************************/

export const addProduct = asyncHandler(async (req, res) => {
  const form = formidable({
    multiples: true, // multiples file can be selected
    keepExtensions: true, // extensions have to be kept
  });

  form.parse(req, async function (err, fields, files) {
    try {
      if (err) {
        throw new CustomError(
          err.message || "Something went wrong while parsing...",
          500
        );
      }

      // every fileName should be unique
      let productId = new Mongoose.Types.ObjectId().toHexString();

      // check for fields
      if (
        !fields.name ||
        !fields.price ||
        !fields.description ||
        !fields.collectionId
      ) {
        throw new CustomError("Please fill all details", 500);
      }

      // handling images or files
      let imgArrayResp = Promise.all(
        Object.keys(files).map(async (filekey, index) => {
          const element = files[filekey]; // all the information/options of file such as extension type,filepath, etc..

          const data = fs.readFileSync(element.filepath);

          const upload = await s3FileUpload({
            bucketName: config.S3_BUCKET_NAME,
            key: `products/${productId}/photo_${index + 1}.png`,
            body: data,
            contentType: element.mimetype,
          });

          return {
            secure_url: upload.Location,
          };
        })
      );

      // to database
      let imgArray = await imgArrayResp;

      const product = await Product.create({
        _id: productId,
        photos: imgArray,
        ...fields,
      });

      if (!product) {
        throw new CustomError("Product was not created", 400);
      }

      res.status(200).json({
        success: true,
        message: "Product created successfully",
        product,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Something went wrong...",
      });
    }
  });
});

/**********************************************************
 * @GET_ALL_PRODUCT
 * @route https://localhost:5000/api/product
 * @description Controller used for getting all products details
 * @description User and admin can get all the products
 * @parameter name, price, description, photos[], stock, sold, colectionId
 * @returns Products Object
 *********************************************************/

export const getAllProducts = asyncHandler(async (_req, res) => {
  const products = await Product.find({});

  if (!products) {
    throw new CustomError("No product was found", 404);
  }
  res.status(200).json({
    success: true,
    message: "Product found",
    products,
  });
});

/**********************************************************
 * @GET_PRODUCT_BY_ID
 * @route https://localhost:5000/api/product
 * @description Controller used for getting single product details
 * @description User and admin can get single product details
 * @returns Product Object
 *********************************************************/

export const getProductById = asyncHandler(async (req, res) => {
  const { id: productId } = req.params;

  const product = await Product.findById(productId);

  if (!product) {
    throw new CustomError("No product was found", 404);
  }
  res.status(200).json({
    success: true,
    message: "Product found",
    product,
  });
});

// TODO: Delete a product, update a product
