let validator;

/**
 * Returns an object containing all inputs merged and
 * also handles validation
 *
 * @param req
 * @param actionInput
 */

exports.handle = async (req, actionInput) => {
     let errors = false;

     /**
      * Merge all given input
      */

     const input = {
          ...req.body,
          ...req.query,
          ...req.params
     };

     /**
      * Remove unspecified input properties
      * and handle validation
      */

     let returned = false;

     for (const key in actionInput) {
          if (!actionInput.hasOwnProperty(key)) {
               continue;
          }

          let messages = await validator.validate(input[key], key, actionInput[key], input);

          if (!messages.length) {
               if (!returned) {
                    returned = {};
               }

               returned[key] = input[key];
               continue;
          }

          if (!errors) {
               errors = {};
          }

          errors[key] = messages;
     }

     /**
      * Return the output
      */

     return {
          errors,
          input: returned || input
     };
};

/**
 * Make validator accessible by handle function
 * @param context
 */

exports.init = context => {
     const {validator: validatorPlugin = false} = context.plugins;
     validator = validatorPlugin;
};