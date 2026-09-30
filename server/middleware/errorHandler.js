import config from '../config/config.js';

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function validateObjectId(req, res, next) {
  if (!/^[a-fA-F0-9]{24}$/.test(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID.' });
  }
  next();
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return res.status(400).json({ message: errors[0]?.message || 'Validation failed.', errors });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body.' });

  const status = err.status || 500;
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({
    message: status >= 500 && config.isProduction ? 'Internal server error.' : err.message || 'Internal server error.',
    errors: err.errors || [],
  });
}
