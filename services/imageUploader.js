import s3 from "../config/s3.config";

/******************************************************
 * @IMAGE_UPLOAD_S3_AWS
 * @route
 * @description uploading file to Bucket of S3-aws
 * @parameters bucketName, key, body, contentType
 * @returns Collection Object
 ******************************************************/

export const s3FileUpload = async ({ bucketName, key, body, contentType }) => {
  return await s3
    .upload({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
    .promise();
};

/******************************************************
 * @IMAGE_DELETE_S3_AWS
 * @route
 * @description deleting file from Bucket of S3-aws
 * @parameters bucketName, key
 * @returns Collection Object
 ******************************************************/

export const s3FileDelete = async ({ bucketName, key }) => {
  return await s3
    .deleteObject({
      Bucket: bucketName,
      Key: key,
    })
    .promise();
};
