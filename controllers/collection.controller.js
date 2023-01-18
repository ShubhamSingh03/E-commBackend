import Collection from "../models/collection.schema";
import asyncHandler from "../services/asyncHandler";
import CustomError from "../utils/customError";

/******************************************************
 * @CREATE_COLLECTION
 * @route http://localhost:5000/api/collection
 * @description creation of new collection in db [can be done by Admin]
 * @parameters name
 * @returns Collection Object
 ******************************************************/

export const createCollection = asyncHandler(async (req, res) => {
  // take name from frontend
  const { name } = req.body;

  if (!name) {
    throw new CustomError("Collection name is required", 400);
  }

  // add this name to database
  const collection = await Collection.create({
    name,
  });

  // send this response value to frontend
  res.status(200).json({
    success: true,
    message: "Collection created with success",
    collection,
  });
});

/******************************************************
 * @UPDATE_COLLECTION
 * @route http://localhost:5000/api/collection/update/:collectionId
 * @description updation of collection in db [can be done by Admin]
 * @parameters name, collectionId in params
 * @returns Collection Object
 * // needs two values from request 1. what's unique thing have to update with collection i.e.CollectionId, 2. new value to which it updates
 ******************************************************/

export const updateCollection = asyncHandler(async (req, res) => {
  // existing value to be updated
  const { id: collectionId } = req.params; // from url

  // new value to get updated
  const { name } = req.body;

  if (!name) {
    throw new CustomError("Collection name is required", 400);
  }

  let updatedCollection = await Collection.findByIdAndUpdate(
    collectionId, //collection Id
    {
      name, // what's need to be updated
    },
    {
      //options after update
      new: true,
      runValidators: true,
    }
  );

  //if above method fails, it fails gracefully
  if (!updatedCollection) {
    throw new CustomError("Collection not found", 400);
  }

  // send response to frontend
  res.status(200).json({
    success: true,
    message: "Collection updated successfully",
    updatedCollection,
  });
});

/******************************************************
 * @DELETE_COLLECTION
 * @route http://localhost:5000/api/collection/delete/:collectionId
 * @description deletion of collection in db [can be done by Admin]
 * @parameters collectionId
 * @returns Collection Object
 ******************************************************/

export const deleteCollection = asyncHandler(async (req, res) => {
  // existing value to be deleted
  const { id: collectionId } = req.params;

  const collectionToDelete = await Collection.findByIdAndDelete(collectionId);

  if (!collectionToDelete) {
    throw new CustomError("Collection not found", 400);
  }

  collectionToDelete.remove(); // removed after it's job is done(garbage)

  // send response to frontend
  res.status(200).json({
    success: true,
    message: "Collection deleted successfully",
  });
});

/******************************************************
 * @GETALL_COLLECTION
 * @route http://localhost:5000/api/collection
 * @description get all collections [for Admin]
 * @parameters
 * @returns Collection Object
 ******************************************************/

export const getAllCollections = asyncHandler(async (_req, res) => {
  const getAllCollections = await Collection.find();

  if (!getAllCollections) {
    throw new CustomError("No collection found", 400);
  }

  // send response to frontend
  res.status(200).json({
    success: true,
    message: "All the collections",
    getAllCollections,
  });
});
