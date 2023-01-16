import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a product name"],
      trim: true,
      maxLength: [120, "Product name should not exceed 120 chars"],
    },
    price: {
      type: Number,
      required: [true, "Please provide a product price"],
      maxLength: [5, "Product price should not be more than 5 digits"],
    },
    description: {
      type: String,
    },
    photos: [
      {
        secure_url: {
          type: String,
          required: true,
        },
      },
    ],
    stock: {
      type: Number,
      default: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId, //refrence of another schema
      ref: "Collection", //schema name in our project
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Product", productSchema);
