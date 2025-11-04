import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Products Flash Deal API",
            version: "1.0.0",
            description: "Open API for Products Flash Deal",
        },
        servers: [
            {
                url: "http://localhost:3000/api",
            },
        ],
    },
    apis: ["./src/index.ts"], // Path to route files for annotations
};

export const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
