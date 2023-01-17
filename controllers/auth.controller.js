import User from "../models/user.schema";
import asyncHandler from "../services/asyncHandler";
import CustomError from "../utils/customError";
import cookieOptions from "../utils/cookieOptions";
import mailHelper from "../utils/mailHelper";
import crypto from "crypto";

/******************************************************
 * @SIGNUP
 * @route http://localhost:5000/api/auth/signup
 * @description User signUp Controller for creating new user
 * @parameters name, email, password
 * @returns User Object
 ******************************************************/

export const signUp = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  //checking if all fields are filled
  if (!name || !email || !password) {
    throw new CustomError("Please fill all fields", 400);
  }

  //check if user exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new CustomError("User already exists", 400);
  }

  //creating user in db
  const user = await User.create({
    name,
    email,
    password,
  });
  const token = user.getJwtToken(); //method defined in userSchema not in User db
  console.log(user);
  user.password = undefined;

  res.cookie("token", token, cookieOptions);

  res.status(200).json({
    success: true,
    token,
    user,
  });
});

/******************************************************
 * @LOGIN
 * @route http://localhost:5000/api/auth/login
 * @description User signIn Controller for loging user
 * @parameters  email, password
 * @returns User Object
 ******************************************************/

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  //checking if all fields are filled
  if (!email || !password) {
    throw new CustomError("Please fill all fields", 400);
  }

  //check if user exists
  const user = await User.findOne({ email }).select("+password"); // select("+pas..") override select:false

  if (!user) {
    throw new CustomError("Invalid credentials", 400);
  }

  //compare Password
  const isPasswordMatched = await user.comparePassword(password);

  if (isPasswordMatched) {
    const token = user.getJwtToken();
    user.password = undefined;
    res.cookie("token", token, cookieOptions);
    return res.status(200).json({
      success: true,
      token,
      user,
    });
  }

  throw new CustomError("Invalid credentials - pass", 400);
});

/******************************************************
 * @LOGOUT
 * @route http://localhost:5000/api/auth/logout
 * @description User logout by clearing user cookies
 * @parameters
 * @returns success message
 ******************************************************/

export const logout = asyncHandler(async (_req, res) => {
  // res.clearCookie()
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

/******************************************************
 * @FORGOT_PASSWORD
 * @route http://localhost:5000/api/auth/password/forgot
 * @description User will submit email and we will generate a token
 * @parameters  email
 * @returns success message - email send
 ******************************************************/

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  //check email for null or ""
  if (!email) {
    throw new CustomError("Please enter email", 400);
  }

  //check email in db
  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError("User not found", 404);
  }
  const resetToken = user.generateForgotPasswordToken(); //method from userSchema to generateToken

  //validate turned off & forcefully storing only forgotToken for forgotPasswordToken to db
  await user.save({ validateBeforeSave: false });

  //resetUrl
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/auth/password/reset/${resetToken}`;

  const text = `Your password reset url is
  \n\n ${resetUrl}\n\n
  `;

  try {
    await mailHelper({
      email: user.email,
      subject: "Password reset email for website",
      text: text,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email}`,
    });
  } catch (err) {
    //roll back - clear fields and save
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save({ validateBeforeSave: false });

    throw new CustomError(err.message || "Email sent failure", 500);
  }
});

/******************************************************
 * @RESET_PASSWORD
 * @route http://localhost:5000/api/auth/password/reset/:resetToken
 * @description User will be able to reset password based on url token
 * @parameters  token from url, password and confirm pass
 * @returns User object
 ******************************************************/

export const resetPassword = asyncHandler(async (req, res) => {
  const { token: resetToken } = req.params;
  const { password, confirmPassword } = req.body;

  // encrypting resetToken
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // return data only when it matches the token && dateField should be greater than Date.now();
  const user = await User.findOne({
    forgotPasswordToken: resetPasswordToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  // user not found
  if (!user) {
    throw new CustomError("Password token is invalid or expired", 400);
  }

  //checking pwd & confirm pwd
  if (password !== confirmPassword) {
    throw new CustomError("password and conf password does not match", 400);
  }

  // setting pwd && undefined to values of fields which are not needed anymore in db
  user.password = password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  await user.save();

  //create token and sent as response
  const token = user.getJwtToken();
  user.password = undefined;

  res.cookie("token", token, cookieOptions);
  res.status(200).json({
    success: true,
    user,
  });
});

/******************************************************
 * @UPDATE_PASSWORD
 * @route http://localhost:5000/api/auth/update/
 * @description User will able to update password based only if he is login (middleware will check wheter user is loggedIn or not)
 * @parameters  userid from req.user body will be inserted by route, oldPassword and newPassword
 * @returns User object
 ******************************************************/

export const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new CustomError("Both new and old password requried", 400);
  }

  // req.user will be inserted by middleware in route file
  const user = await User.findById(req.user.id);

  user.password = newPassword;
  user.save();

  // send message to frontend
  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

/******************************************************
 * @GET_PROFILE
 * @REQUEST_TYPE GET
 * @route http://localhost:5000/api/auth/profile
 * @description check for token and populate req.user
 * @parameters
 * @returns User Object
 ******************************************************/
export const getProfile = asyncHandler(async (req, res) => {
  // req.user
  const { user } = req;
  if (!user) {
    throw new CustomError("User not found", 404);
  }
  res.status(200).json({
    success: true,
    user,
  });
});
