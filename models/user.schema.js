import mongoose from "mongoose";
import AuthRoles from "../utils/authRoles";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";
import crypto from "crypto";
import config from "../config/index";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      maxLength: [30, "Name must be less than 30"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password must be atleast 8 chars"],
      select: false, //whenever  make query to db this field will not return to frontend
    },
    role: {
      type: String,
      enum: Object.values(AuthRoles),
      default: AuthRoles.USER,
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
  },
  {
    timestamps: true, // adds two properties of type date to schema (createdAt & updatedAt)
  }
);

// encrypting the password with mongoose pre-hooks(middleware)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); //if password is not modified return to next middleware if any
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// adding more features directly to schema
userSchema.methods = {
  //compare password
  comparePassword: async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  },

  //   generate JWT token
  getJwtToken: function () {
    return JWT.sign(
      {
        _id: this._id,
        role: this.role,
      },
      config.JWT_SECRET,
      {
        expiresIn: config.JWT_EXPIRY,
      }
    );
  },

  // forget password token
  generateForgotPasswordToken: function () {
    const forgotToken = crypto.randomBytes(20).toString("hex");

    // saving to database
    this.forgotPasswordToken = crypto
      .createHash("sha256")
      .update(forgotToken)
      .digest("hex"); //encrypting the token & creating random hash before storing in db

    this.forgotPasswordExpiry = Date.now() + 20 * 60 * 1000;

    // return token values to user
    return forgotToken;
  },
};

export default mongoose.model("User", userSchema);
