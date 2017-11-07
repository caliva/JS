
/**
 * Bloombox: Zipcode Check
 *
 * @fileoverview Provides the ability to verify zipcodes for delivery
 * eligibility.
 */

/*global goog */

goog.provide('bloombox.shop.ZipcheckException');
goog.provide('bloombox.shop.zipcheck');

goog.require('bloombox.config');

goog.require('bloombox.logging.error');
goog.require('bloombox.logging.info');
goog.require('bloombox.logging.log');

goog.require('bloombox.shop.Routine');
goog.require('bloombox.shop.rpc.ShopRPC');


// -- Structures -- //

/**
 * Callback function type declaration for zipcode checking.
 *
 * @typedef {function(?boolean)}
 */
bloombox.shop.ZipCheckCallback;


/**
 * Represents an exception that occurred while validating a zipcode for delivery
 * eligibility.
 *
 * @param {string} message Exception error message.
 * @constructor
 * @export
 */
bloombox.shop.ZipcheckException = function ZipcheckException(message) {
  this.message = message;
};


/**
 * Verify a zipcode for delivery eligibility.
 *
 * @param {string} zipcode Zipcode to verify. Do not include anything more than
 *        the first 5 digits.
 * @param {bloombox.shop.ZipCheckCallback} callback Callback to indicate
 *        zip eligibility.
 * @throws {bloombox.shop.ZipcheckException} If the provided zipcode is invalid.
 * @export
 */
bloombox.shop.zipcheck = function(zipcode, callback) {
  // basic type checking
  if (!zipcode || !(typeof zipcode === 'string') ||
      !(zipcode.length === 5) || isNaN(parseInt(zipcode, 10)))
    // invalid zipcode
    throw new bloombox.shop.ZipcheckException(
      'Zipcode was found to be invalid: ' + zipcode);

  bloombox.logging.info('Verifying zipcode \'' + zipcode +
      '\' for delivery eligibility...');

  // load partner and location codes
  let partnerCode = bloombox.config.partner;
  let locationCode = bloombox.config.location;

  if (!partnerCode ||
      !(typeof partnerCode === 'string' && partnerCode.length > 1) ||
      !(typeof locationCode === 'string' && locationCode.length > 1))
    throw new bloombox.shop.ZipcheckException(
      'Partner and location must be set via `bloombox.shop.setup` before' +
      ' conducting a zipcode eligibility check.');

  // it's a seemingly-valid zipcode, verify it with the server
  const rpc = new bloombox.shop.rpc.ShopRPC(
    /** @type {bloombox.shop.Routine} */ (bloombox.shop.Routine.CHECK_ZIP),
    'GET', [
      'partners', partnerCode,
      'locations', locationCode,
      'zipcheck', zipcode].join('/'));

  let done = false;
  rpc.send(function(response) {
    if (done) return;

    if (response != null) {
      done = true;

      bloombox.logging.log('Received response for zipcheck RPC.', response);
      if ((typeof response === 'object')) {
        // interrogate response for zipcode support status
        let supported = response['supported'] === true;
        callback(supported);
      } else {
        bloombox.logging.error(
          'Received unrecognized response payload for zipcheck.', response);
        callback(null);
      }
    }
  }, function(status) {
    bloombox.logging.error(
      'An error occurred while verifying a zipcode. Status code: \'' +
        status + '\'.');

    // pass null to indicate an error
    callback(null);
  });
};