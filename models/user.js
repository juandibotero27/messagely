/** User class for message.ly */
const db = require("../db")
const bcrypt = require("bcrypt")
const ExpressError = require("../expressError")
const {BCRYPT_WORK_FACTOR} = require("../config")

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    const hashed = await bcrypt.hash(password, BCRYPT_WORK_FACTOR) 
    const results = await db.query(`INSERT INTO users
     (username, password, first_name, last_name, phone, join_at, last_login_at)
      VALUES($1,$2,$3,$4,$5, current_timestamp, current_timestamp) RETURNING username, password,first_name,last_name,phone`, [username, hashed, first_name, last_name, phone])

    return results.rows[0]
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    let results = await db.query(`SELECT password FROM users WHERE username=$1`, [username] )
    let user = results.rows[0]
    return await bcrypt.compare(password, user.password)

   }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const results = await db.query(`UPDATE users SET last_login_at=current_timestamp WHERE username=$1 RETURNING username`, [username])
    if(!results.rows[0]){
      throw new ExpressError("user does not exist", 404)
    }
    

   }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username, first_name, last_name, phone 
      FROM users`
    )
    return results.rows
   }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const results = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users WHERE username=$1`, [username]
    )
    if(!results.rows[0]){
      throw new ExpressError(`The user: ${username} does not exist`, 404)
    }
    return results.rows[0]
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 
    const results = await db.query(
      `SELECT
      m.id,
      m.to_username,
      u.first_name,
      u.last_name,
      u.phone,
      m.body,
      m.sent_at,
      m.read_at
      FROM messages AS m
      JOIN users AS u ON m.to_username = u.username
      WHERE from_username = $1`, [username]
    )
    let messages = results.rows[0]

    if(!messages){
      throw new ExpressError(`no messages from ${username}`, 404)
    }
    return [{
      id: messages.id,
      to_user: {
      username: messages.to_username,
      first_name: messages.first_name,
      last_name: messages.last_name,
      phone: messages.phone
      },
      body: messages.body,
      sent_at: messages.sent_at,
      read_at: messages.read_at
    }]

    
  }
 

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const results = await db.query(
      `SELECT
      m.id,
      m.from_username,
      u.first_name,
      u.last_name,
      u.phone,
      m.body,
      m.sent_at,
      m.read_at
      FROM messages AS m
      join users AS u ON m.from_username = u.username
      WHERE m.to_username = $1`, [username]
    )
    let m = results.rows[0]
    if(!m){
      throw new ExpressError(`No messages to user: ${username}`, 404)
    }
    return [{
      id: m.id,
      from_user: {
        username: m.from_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
      
    }]
   }
}


module.exports = User;