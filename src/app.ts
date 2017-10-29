'use strict';
import * as express from "express";
import * as bodyParser from "body-parser";
import * as Sequelize from "sequelize";
import * as database from "./database";
import * as passport from "./passport";

const app = express();
var initialised = database.initialise();
if (app !== undefined && initialised) {
    let port = Number(process.env.PORT) || 5000;
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    //Routes
    app.get("/", (req, res) => res.send("API running."));
    app.post("/coordinates", async (req, res) => {
        let result = await database.saveCoordinates(req.body.username, req.body.latitude, req.body.longitude);
        res.send(result === true ? 200 : 500);
    }); 
    app.use(passport.initialize());  
    app.post('/auth', passport.authenticate(), passport.serialize, passport.generateToken, passport.respond);

    app.listen(port, 'localhost', () => console.info(`API running on port ${port}`));
}