import carRouter from "./routes/carRoutes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fileUpload from "express-fileupload";
import path from "path";
import swaggerUi from "swagger-ui-express";
import userRouter from "./routes/userRoutes.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { cloudinaryConnect } from "./clodinary/cloudinaryConnect.js";
import { dbConnection } from "./database/dbConnection.js";
import { errorMiddleware } from "./middlewares/error.js";

const swaggerDocument = JSON.parse(
  readFileSync(new URL("./swagger-output.json", import.meta.url))
);

// import swaggerDocument from "./swagger-output.json" assert  {type: "json"};

// import swaggerDocument from "./swagger-output.json";

// import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
dotenv.config();
app.use(express.json());
app.use(cookieParser());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.urlencoded({extended: true}));
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

const corsOptions = {
  origin: [process.env.FRONTEND_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests


dbConnection();
cloudinaryConnect();
app.use(errorMiddleware);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/car", carRouter);

app.use(express.static(path.join(__dirname, "./client/dist")));

// Fallback for Single Page Applications (React, Vue, etc.)
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./client/dist", "index.html"));
});


app.get("/hello",(req,res) => {
    res.send("Hello world! ");
})



export default app;