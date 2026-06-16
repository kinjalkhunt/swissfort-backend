/**
 * asyncHandler
 * Wraps async route handlers — removes need for try/catch in every controller.
 * Usage: router.get('/', asyncHandler(myController))
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;