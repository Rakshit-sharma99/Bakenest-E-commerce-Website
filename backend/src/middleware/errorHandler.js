// ═══════════════════════════════════════════════════════════════════════════
// Standardised Error Handler — machine-readable codes, consistent shape
// ═══════════════════════════════════════════════════════════════════════════

export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_SERVER_ERROR';

  // ── Mongoose CastError (invalid ObjectId) ───────────────────────────────
  if (err.name === 'CastError' || err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found (invalid ID format)';
    code = 'INVALID_ID';
  }

  // ── Mongoose ValidationError ─────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
    code = 'VALIDATION_ERROR';
  }

  // ── MongoDB Duplicate Key ────────────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `Duplicate value for "${field}". Please use a different value.`;
    code = 'DUPLICATE_KEY';
  }

  // ── JWT errors ───────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
    code = 'INVALID_TOKEN';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired. Please log in again.';
    code = 'TOKEN_EXPIRED';
  }

  // ── Payload too large ───────────────────────────────────────────────────
  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request payload too large. Maximum size is 2MB.';
    code = 'PAYLOAD_TOO_LARGE';
  }

  // ── Log in development, suppress stack in production ────────────────────
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${new Date().toISOString()}] ${code}: ${message}`);
    if (err.stack) console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      statusCode,
    },
    timestamp: new Date().toISOString(),
    // Only expose stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
