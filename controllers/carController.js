import ErrorHandler from "../middlewares/error.js";
import { v2 as cloudinary } from "cloudinary";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { Car } from "../models/carSchema.js";

const uploadImagesToCloudinary = async (files, folder) => {
  try {
    const urls = [];
    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder,
        resource_type: "auto",
      });
      urls.push(result.secure_url); // Save the secure URL
    }
    return urls;
  } catch (error) {
    console.error("Error uploading images to Cloudinary:", error);
    throw new ErrorHandler("Failed to upload images to Cloudinary.", 500);
  }
};

// Helper function to delete images from Cloudinary
const deleteImagesFromCloudinary = async (imageUrls) => {
  try {
    // Extract the public IDs from the URLs
    const publicIds = imageUrls.map((url) => {
      // Use Cloudinary's URL helper to parse the public ID
      const publicId = cloudinary.utils.extractPublicId(url);
      return publicId;
    });

    // Delete images from Cloudinary
    const result = await cloudinary.api.delete_resources(publicIds);
    console.log("Cloudinary deletion result:", result); // Debugging
  } catch (error) {
    console.error("Error deleting images from Cloudinary:", error);
    throw new ErrorHandler("Failed to delete images from Cloudinary.", 500);
  }
};



// Update car details, including title, description, tags, and images
export const updateCar = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  let car = await Car.findById(id);
  if (!car) {
    return next(new ErrorHandler("OOPS! Car not found.", 404));
  }

  const currUser = req.user._id.toString(); // Convert to string for safe comparison
  const updateUser = car.owner.toString(); // Convert to string for safe comparison

  // Check if the logged-in user is the car owner
  if (currUser !== updateUser) {
    return next(new ErrorHandler("OOPS! You are not authorized to view this car.", 404));
  }

  // // Handle new images if provided
  // const newImages = req.files?.images;

  // // Check if new images are provided
  // if (newImages) {
  //   // Ensure the new images are an array
  //   const newImagesArray = Array.isArray(newImages) ? newImages : [newImages];

  //   // Upload new images to Cloudinary
  //   const uploadedImageUrls = await uploadImagesToCloudinary(newImagesArray, "cars");

  //   // If the car has existing images, delete them from Cloudinary
  //   if (car.images && car.images.length > 0) {
  //     await deleteImagesFromCloudinary(car.images);
  //   }

  //   // Update the car's images
  //   car.images = uploadedImageUrls;
  // }

  // Prepare the updated data for tags and other fields
  const updatedCarData = {};

  // Check and update the title and description if provided
  if (req.body.title) updatedCarData.title = req.body.title;
  if (req.body.description) updatedCarData.description = req.body.description;

  // Check and update tags (company, carType, dealer) if provided
  if (req.body.company) updatedCarData.tags = updatedCarData.tags || {};
  if (req.body.company) updatedCarData.tags.company = req.body.company;
  if (req.body.carType) updatedCarData.tags.carType = req.body.carType;
  if (req.body.dealer) updatedCarData.tags.dealer = req.body.dealer;

  // Update the car in the database
  car = await Car.findByIdAndUpdate(id, updatedCarData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    message: "Car Updated!",
    car,
  });
});

export const deleteImage = catchAsyncErrors(async (req, res, next) => {
  const { carId, imageUrl } = req.body; // Extract carId and imageUrl from request body

  if (!carId || !imageUrl) {
    return res.status(400).json({
      success: false,
      message: "Car ID and Image URL are required",
    });
  }

  // Find the car by ID
  const car = await Car.findById(carId);
  if (!car) {
    return res.status(404).json({
      success: false,
      message: "Car not found",
    });
  }

  // Check if the image exists in the car's images array
  const imageIndex = car.images.indexOf(imageUrl);
  if (imageIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Image not found in car's images array",
    });
  }

  // Delete the image from Cloudinary
  try {
    // await deleteImagesFromCloudinary([imageUrl]); // Assumes this function handles the deletion from Cloudinary
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete image from Cloudinary",
      error: error.message,
    });
  }

  // Remove the image URL from the images array
  car.images.splice(imageIndex, 1);
  await car.save();

  res.status(200).json({
    success: true,
    message: "Image deleted successfully",
    images: car.images, // Return updated images array
  });
});
export const uploadImages = catchAsyncErrors(async (req, res, next) => {
  const { carId } = req.body; // Extract carId and imagePathArray from request body
  const files = req.files?.images;
  if (!carId) {
    return res.status(400).json({
      success: false,
      message: "Car ID and a valid array of image paths are required",
    });
  }

  // Find the car by ID
  const car = await Car.findById(carId);
  if (!car) {
    return res.status(404).json({
      success: false,
      message: "Car not found",
    });
  }
  const filesArray = Array.isArray(files) ? files : [files];

  // Upload images to Cloudinary
  const uploadedImageUrls = await uploadImagesToCloudinary(filesArray, "cars");

  

  // Add the new image URLs to the car's images array
  car.images.push(...uploadedImageUrls);
  await car.save();

  res.status(200).json({
    success: true,
    message: "Images uploaded successfully",
    images: car.images, // Return updated images array
  });
});
export const addCar = catchAsyncErrors(async (req, res, next) => {
  const { title, description, company, carType, dealer } = req.body;

  const files = req.files?.images;

  // Validation for required fields
  if (!title || !description || !company || !carType || !dealer || !files) {
    return next(new ErrorHandler("Please provide full car details, including images.", 400));
  }

  // Ensure files is an array for consistency
  const filesArray = Array.isArray(files) ? files : [files];

  // Upload images to Cloudinary
  const uploadedImageUrls = await uploadImagesToCloudinary(filesArray, "cars");

  const owner = req.user._id;

  // Create a new car document
  const car = await Car.create({
    title,
    description,
    tags: {
      company,
      carType,
      dealer,
    },
    images: uploadedImageUrls,
    owner,
  });

  res.status(200).json({
    success: true,
    message: "Car Posted Successfully!",
    car,
  });
});


export const getAllCars = catchAsyncErrors(async (req, res, next) => {
  // const user = req.user;
  const myCars = await Car.find({ owner: req.user._id });
  res.status(200).json({
    success: true,
    // user,
    myCars,
  });
});


export const deleteCar = catchAsyncErrors(async (req, res, next) => {

  const { id } = req.params;
  const car = await Car.findById(id);
  if (!car) {
    return next(new ErrorHandler("OOPS! Car not found.", 404));
  }

  const currUser = req.user._id.toString(); // Convert to string for safe comparison
  const updateUser = car.owner.toString(); // Convert to string for safe comparison

  // Check if the logged-in user is the car owner
  if (currUser !== updateUser) {
    return next(new ErrorHandler("OOPS! You are not authorized to view this car.", 404));
  }
  await car.deleteOne();
  res.status(200).json({
    success: true,
    message: "Car Deleted!",
  });
});

export const getSingleCar = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  console.log("id : ",id);

  try {
    const car = await Car.findById(id);
    if (!car) {
      return next(new ErrorHandler("Car not found.", 404));
    }
    const currUser = req.user._id.toString(); // Convert to string for safe comparison
    const updateUser = car.owner.toString(); // Convert to string for safe comparison

    // Check if the logged-in user is the car owner
    if (currUser !== updateUser) {
      return next(new ErrorHandler("OOPS! You are not authorized to view this car.", 404));
    }

    res.status(200).json({
      success: true,
      car,
    });
  } catch (error) {
    return next(new ErrorHandler(`Invalid ID / CastError`, 404));
  }
});
// Search for cars based on tags (company, carType, dealer)
export const searchCars = catchAsyncErrors(async (req, res, next) => {
  const { query } = req.params; // Use req.query instead of req.params
  console.log(query)
  console.log("Query is coming")

  if (!query || typeof query !== "string") {
    return next(new ErrorHandler("Please provide a valid search query.", 400));
  }

  const currUser = req.user._id;

  try {
    // Use regex for case-insensitive partial matching in `tags` fields
    const matchedCars = await Car.find({
      $and: [
        {
          $or: [
            { "tags.company": { $regex: query, $options: "i" } },
            { "tags.carType": { $regex: query, $options: "i" } },
            { "tags.dealer" : { $regex: query, $options: "i" } },
            { "title"       : { $regex: query, $options: "i" } },
            { "description" : { $regex: query, $options: "i" } },
          ],
        },
        { owner: currUser },
      ],
    });

    res.status(200).json({
      success: true,
      message: `Found ${matchedCars.length} cars matching your search query.`,
      cars: matchedCars,
    });
  } catch (error) {
    return next(new ErrorHandler("Failed to search cars.", 500));
  }
});
