import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";

import {
  deleteCar,
  getAllCars,
  getSingleCar,
  addCar,
  updateCar,
  searchCars,
  uploadImages,
  deleteImage,
} from "../controllers/carController.js";

const router = express.Router();

router.post("/add", isAuthenticated, addCar);
router.get("/getAll", isAuthenticated, getAllCars);
router.put("/update/:id", isAuthenticated, updateCar);
router.delete("/delete/:id", isAuthenticated, deleteCar);
router.delete("/delete-image", isAuthenticated,deleteImage);
router.post("/upload-images", isAuthenticated,uploadImages);
router.get("/search/:query", isAuthenticated, searchCars);
router.get("/:id", isAuthenticated, getSingleCar);

export default router;
