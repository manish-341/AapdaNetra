const errorMiddleware = (err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);

    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || "Server Error";

    // Mongoose validation error
    if (err.name === "ValidationError") {
        statusCode = 400;
        const fields = Object.values(err.errors).map(e => e.message);
        message = `Validation failed: ${fields.join(", ")}`;
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `Duplicate value for: ${field}`;
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token";
    }

    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token expired. Please login again.";
    }

    // Don't expose stack traces in production
    const response = {
        success: false,
        message
    };

    if (process.env.NODE_ENV === "development") {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

module.exports = errorMiddleware;