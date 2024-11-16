import mongoose from "mongoose";

const carSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title."],
      minLength: [1, "Title must contain at least 3 Characters!"],
      maxLength: [30, "Title cannot exceed 30 Characters!"],
    },
    description: {
      type: String,
      required: [true, "Please provide a description."],
      minLength: [1, "Description must contain at least 30 Characters!"],
      maxLength: [500, "Description cannot exceed 500 Characters!"],
    },
    tags: {
      company: {
        type: String,
        required: [true, "Please provide a company."],
      },
      carType: {
        type: String,
        required: [true, "Please provide a car type."],
      },
      dealer: {
        type: String,
        required: [true, "Please provide a dealer name."],
      },
    },
    images: {
      type: [String],
      validate: {
        validator: function (val) {
          return val.length <= 10; // Max size is 10 images
        },
        message: "You can only add up to 10 images.",
      },
      required: [true, "Please provide images."],
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Car = mongoose.model("Car", carSchema);
