import swaggerAutogen from "swagger-autogen";

// const swaggerJsdoc = require('swagger-jsdoc');
const swaggerAutogenInstance = swaggerAutogen(); 

const doc = {
    info: {
        title: 'Car Management System API',
        description: 'Car Management Application for efficient car inventory management with user authentication, car details management, and secure access via JWT authentication.'
    },
    host: process.env.PORT || 3000
}

const outputFile = './swagger-output.json'
const routes = ['./routes/*.js'];

// const swaggerSpec = swaggerJsdoc(options);
swaggerAutogenInstance(outputFile, routes, doc).then(() => {
    console.log("Swagger documentation generated successfully!");
  });