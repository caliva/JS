
/**
 * Bloombox: Shop Info
 *
 * @fileoverview Provides the ability to shop status, info and hours.
 */

/*global goog */

goog.provide('bloombox.shop.ShopInfoException');
goog.provide('bloombox.shop.ShopStatus');
goog.provide('bloombox.shop.info');

goog.require('bloombox.config');

goog.require('bloombox.logging.error');
goog.require('bloombox.logging.info');
goog.require('bloombox.logging.log');
goog.require('bloombox.logging.warn');

goog.require('bloombox.shop.Routine');
goog.require('bloombox.shop.rpc.ShopRPC');

goog.require('proto.services.shop.v1.ShopStatus');


// -- Structures -- //

/**
 * Callback function type declaration for shop info retrieval.
 *
 * @typedef {function(?boolean, ?boolean, ?number)}
 */
bloombox.shop.ShopInfoCallback;


/**
 * Specifies shop statuses.
 *
 * @enum {string}
 */
bloombox.shop.ShopStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  PICKUP_ONLY: 'PICKUP_ONLY',
  DELIVERY_ONLY: 'DELIVERY_ONLY'
};


/**
 * Represents an exception that occurred while retrieving information or
 * status about the online shop.
 *
 * @param {string} message Exception error message.
 * @constructor
 * @export
 */
bloombox.shop.ShopInfoException = function ShopInfoException(message) {
  this.message = message;
};


/**
 * Retrieve info for the current shop.
 *
 * @param {bloombox.shop.ShopInfoCallback} callback Callback to pass back info.
 * @throws {bloombox.shop.ShopInfoException} If partner/location isn't set.
 * @export
 */
bloombox.shop.info = function(callback) {
  // load partner and location codes
  let partnerCode = bloombox.config.partner;
  let locationCode = bloombox.config.location;

  if (!partnerCode ||
      !(typeof partnerCode === 'string' && partnerCode.length > 1) ||
      !(typeof locationCode === 'string' && locationCode.length > 1))
    throw new bloombox.shop.ShopInfoException(
      'Partner and location must be set via `bloombox.shop.setup` before' +
        ' retrieving shop info.');

  bloombox.logging.info('Retrieving shop info for \'' +
      partnerCode + ':' + locationCode + '\'...');

  // stand up an RPC object
  const rpc = new bloombox.shop.rpc.ShopRPC(
    /** @type {bloombox.shop.Routine} */ (bloombox.shop.Routine.SHOP_INFO),
    'GET', [
      'partners', partnerCode,
      'locations', locationCode,
      'shop', 'info'].join('/'));

  let done = false;
  rpc.send(function(response) {
    if (done) return;
    if (response != null) {
      done = true;

      bloombox.logging.log('Received response for shop info RPC.', response);
      if (typeof response === 'object') {
        let pickup;
        let delivery;

        switch ((/** @type {bloombox.shop.ShopStatus} */ (
            response['shopStatus'])) || bloombox.shop.ShopStatus.OPEN) {
          case bloombox.shop.ShopStatus.CLOSED:
            // entirely closed
            pickup = false;
            delivery = false;
            break;

          case bloombox.shop.ShopStatus.DELIVERY_ONLY:
            // delivery only
            pickup = false;
            delivery = true;
            break;

          case bloombox.shop.ShopStatus.PICKUP_ONLY:
            // pickup only
            pickup = true;
            delivery = false;
            break;

          default:
            // the shop is entirely open
            pickup = true;
            delivery = true;
        }

        // dispatch the callback
        callback(pickup, delivery, null);
      } else {
        bloombox.logging.error(
          'Received unrecognized response payload for shop info.', response);
        callback(null, null, null);
      }
    }
  }, function(status) {
    bloombox.logging.error(
      'An error occurred while querying shop info. Status code: \'' +
        status + '\'.');

    // pass null to indicate an error
    callback(null, null, status || null);
  });
};