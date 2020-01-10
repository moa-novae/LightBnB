const properties = require('./json/properties.json');
const users = require('./json/users.json');

const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  user: 'vagrant',
  password: '123',
  database: 'lightbnb',
});
/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const input = email.toLowerCase();
  const inputArr = [input];
  return pool.query(`
    SELECT id, password
    FROM users 
    where email = $1
  `, inputArr)
    .then(res => res.rows[0]);
};

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const value = [id];
  return pool.query(`
  SELECT id, name, email
  FROM users
  where id = $1
  `, value)
    .then(res => res.rows[0])
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  const value = [user.name, user.email, user.password];
  return pool.query(`
  INSERT INTO users (name, email, password)
  VALUES ($1, $2, $3)
  RETURNING *
  `, value);





  // const userId = Object.keys(users).length + 1;
  // user.id = userId;
  // users[userId] = user;
  // return Promise.resolve(user);
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const value = [guest_id, limit];
  return pool.query(`
  SELECT * 
  FROM reservations 
  JOIN properties ON property_id = properties.id
  WHERE guest_id = $1
  LIMIT $2
  `, value)
    .then(res => res.rows);
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  const queryParams = [];
  let condition = ' WHERE ';
  let connect = '';
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id`;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    condition += ` LOWER(city) LIKE LOWER ($${queryParams.length}) `;
    connect = ' AND ';
  }

  if (options.owner_id) {
    queryParams.push(`%${options.owner_id}%`);
    condition += connect;
    condition += `owner_id = $${queryParams.length} `
    connect = ' AND ';
  }
  if (options.minimum_price_per_night) {
    queryParams.push(`${100 * options.minimum_price_per_night}`);
    condition += connect;
    condition += `cost_per_night > $${queryParams.length} `
    connect = ' AND ';
  }
  if (options.maximum_price_per_night) {
    queryParams.push(`${100 * options.maximum_price_per_night}`);
    condition += connect;
    condition += `cost_per_night < $${queryParams.length} `
    connect = ' AND ';
  }







  if (queryParams.length === 0) {
    condition = '';
  }
  queryString += condition;
  queryString += `
  GROUP BY properties.id `
    ;
  if (options.minimum_rating) {
    queryParams.push(Number(options.minimum_rating));
    condition += ` HAVING avg(property_reviews.rating) > $${queryParams.length} `
    queryString += condition;
  }
  queryParams.push(limit);
  queryString += ` ORDER BY cost_per_night
  Limit $${queryParams.length}`;

  console.log(queryString, queryParams);

  return pool.query(queryString, queryParams)
    .then(res => res.rows);
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  let queryParams = [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.street, property.city, property.province, property.post_code, property.country, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms];

  return pool.query(`
  INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `, queryParams);
}
exports.addProperty = addProperty;
