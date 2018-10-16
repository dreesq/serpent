/**
 * Returns an object containing all inputs merged
 * @param req
 */

exports.handle = req => {
     return {
          ...req.body,
          ...req.query,
          ...req.params
     }
};