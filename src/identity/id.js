
/**
 * Bloombox: Government ID
 *
 * @fileoverview Provides an object specification for a user's
 * government-issued ID.
 */

/*global goog */

goog.provide('bloombox.identity.ID');
goog.provide('bloombox.identity.IDException');
goog.provide('bloombox.identity.IDType');

goog.require('proto.identity.IDType');
goog.require('proto.temporal.Date');


/**
 * Represents an exception that occurred while creating or validating a user's
 * government ID.
 *
 * @param {string} message Exception error message.
 * @constructor
 */
bloombox.identity.IDException = function IDException(message) {
  this.message = message;
};


/**
 * Specifies supported types of government ID.
 *
 * @enum {number}
 * @export
 */
bloombox.identity.IDType = {
  'USDL': proto.identity.IDType.USDL,
  'PASSPORT': proto.identity.IDType.PASSPORT
};


// -- License -- //
/**
 * Specifies an object structure for expressing a user's government ID.
 *
 * @param {bloombox.identity.IDType} type Type for the ID.
 * @param {string} id ID number for the identifying document.
 * @param {string} expirationDate Expiration date, in YYYY-MM-DD format.
 * @param {string} birthDate Birth date, in YYYY-MM-DD format.
 * @param {string} jurisdiction State jurisdiction that issued the license,
 *        for instance, "CA".
 * @param {?string=} country Country of issuance, defaults to "USA".
 * @throws {bloombox.identity.IDException} If the provided data is invalid.
 * @constructor
 * @export
 */
bloombox.identity.ID = function ID(type,
                                   id,
                                   expirationDate,
                                   birthDate,
                                   jurisdiction,
                                   country) {
  if (!id || !(typeof id === 'string'))
    throw new bloombox.identity.IDException(
      'Invalid driver\'s license ID: \'' + id + '\'.');
  if (!expirationDate || !(typeof expirationDate === 'string'))
    throw new bloombox.identity.IDException(
      'Invalid driver\'s license expiry date: \'' + expirationDate + '\'.');
  if (!birthDate || !(typeof birthDate === 'string'))
    throw new bloombox.identity.IDException(
      'Invalid driver\'s license birth date: \'' + birthDate + '\'.');
  if (!jurisdiction || !(typeof jurisdiction === 'string'))
    throw new bloombox.identity.IDException(
      'Invalid driver\'s license issuance jurisdiction: \'' +
      jurisdiction + '\'.');

  // setup an instant object
  let expirationObj = new proto.temporal.Date();
  expirationObj.setIso8601(expirationDate);

  let birthObj = new proto.temporal.Date();
  birthObj.setIso8601(birthDate);

  /**
   * Type of the ID we're storing.
   * @type {bloombox.identity.IDType}
   * @public
   */
  this.type = type;

  /**
   * ID number or string for this document.
   * @type {string}
   * @public
   */
  this.id = id;

  /**
   * Document expiration date.
   * @type {proto.temporal.Date}
   * @public
   */
  this.expirationDate = expirationObj;

  /**
   * Document birth date.
   * @type {proto.temporal.Date}
   * @public
   */
  this.birthDate = birthObj;

  /**
   * Document's issuance jurisdiction.
   * @type {string}
   * @public
   */
  this.jurisdiction = jurisdiction.toUpperCase();

  /**
   * Country of origin. Defaults to "USA".
   * @type {string}
   * @public
   */
  this.country = country || 'USA';
};
