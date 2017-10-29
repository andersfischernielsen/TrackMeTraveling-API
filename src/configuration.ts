let databaseConfig = {
    database: "postgres",
    username: "postgres",
    password: "postgres",
}

let secret = "very secret secret";
let saltRounds = 10;
let defaultUser = { username: "fischer", email: "test@test.com", password: "dummy"}

export { databaseConfig, secret, saltRounds, defaultUser }