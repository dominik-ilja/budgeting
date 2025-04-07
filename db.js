const sqlite = require("sqlite3").verbose();

const database = new sqlite.Database("./database.db", (err) => {
  if (err) console.log(err);
});

async function createUsersTable() {
  return new Promise((resolve, reject) => {
    database.run(
      `CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL CHECK(username != ''),
        password TEXT NOT NULL CHECK(password != '')
      );`,
      (err) => (err ? reject(err) : resolve())
    );
  });
}
async function dropUsersTable() {
  return new Promise((resolve, reject) => {
    database.run("DROP TABLE users;", (result, err) => {
      (err) => (err ? reject(err) : resolve());
    });
  });
}
async function insertUser(username = "", password = "") {
  return new Promise((resolve, reject) => {
    database.run(
      `INSERT INTO users (username, password)
      VALUES (?, ?);`,
      [username, password],
      (err) => (err ? reject(err) : resolve())
    );
  });
}
async function getUser() {
  return new Promise((resolve, reject) => {
    database.get(`SELECT * FROM users;`, (err, row) =>
      err ? reject(err) : resolve(row)
    );
  });
}
async function getUserById(id) {
  return new Promise((resolve, reject) => {
    database.get(`SELECT * FROM users WHERE id = ?;`, [id], (err, row) =>
      err ? reject(err) : resolve(row)
    );
  });
}

// async function run() {
//   let result = await dropUsersTable();
//   console.log(result);
//   result = await createUsersTable();
//   console.log(result);
//   result = await insertUser();
//   console.log(result);
//   result = await insertUser("username1", "password");
//   console.log(result);
//   result = await insertUser("username2", "password");
//   console.log(result);
//   result = await insertUser("username3", "password");
//   console.log(result);
//   result = await getUser();
//   console.log(result);
//   result = await getUserById(3);
//   console.log(result);
// }
// run();
