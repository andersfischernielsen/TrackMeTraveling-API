'use strict';
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as Sequelize from "sequelize";
import * as database from "./database";
import * as passport from "./passport";

//Setup
const app = express();
if (app === undefined || !database.initialise()) process.exit();
const port = Number(process.env.PORT) || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(cors());

//Helper functions
let saveRefreshTokenForUser = async (req:any, res:any, next:any) => {
    await database.saveRefreshTokenForUser(req.body.username, req.refresh_token);
    next();
}

let refreshTokenIsValid = async (req:any, res:any, next:any) => {
    let found = await database.refreshTokenIsValid(req.body.username, req.body.refresh_token);
    if (!found) return res.send(401);
    req.user = { id: found.username };
    next();
}

//Routes
app.post("/coordinates", passport.authenticateJWT(), async (req, res) => {
    let result = await database.saveCoordinates(req.body.username, req.body.latitude, req.body.longitude);
    return res.send(result === true ? 200 : 500);
}); 

app.post('/user', async (req, res) => {
    let created = await database.saveUser(req.body.username, req.body.email, req.body.password);
    return res.send(created ? 200 : 409);
});

app.post('/auth', 
    passport.authenticate(),
    passport.serialize,
    passport.generateToken,
    saveRefreshTokenForUser,
    passport.respond
);

app.post('/refreshtoken',
    refreshTokenIsValid,
    passport.generateToken,
    saveRefreshTokenForUser,
    passport.respond
);

app.get('/user/:username', async (req, res) => {
    let username = req.params && req.params.username;
    if (username === undefined) return res.send(400);
    let coordinates = await database.getCoordinatesForUser(username);
    if (coordinates === undefined) return res.send(404);
    let response = {
        username: coordinates.username,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
    }
    return res.json(response).send(200);
});

app.listen(port, 'localhost', () => console.info(`API running on port ${port}`));