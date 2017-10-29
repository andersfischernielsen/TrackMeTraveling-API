'use strict';
import * as express from "express";
import * as bodyParser from "body-parser";
import * as Sequelize from "sequelize";
import * as database from "./database";
import { initialise } from "./database";

const app = express();
var initialised = database.initialise();

if (app !== undefined && initialised) {
    app.set("port", process.env.PORT || 3000);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    //Routes
    app.get("/", (req, res) => res.send("API running."));
    app.post("/coordinates", async (req, res) => {
        let result = await database.saveCoordinates(req.body.username, req.body.latitude, req.body.longitude);
        res.send(result === true ? 200 : 500);
    }); 

    app.listen(5000, 'localhost', () => console.info("API running."));
}