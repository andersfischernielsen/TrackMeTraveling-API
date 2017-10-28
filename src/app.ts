import * as express from "express";
import * as bodyParser from "body-parser";
import * as Sequelize from "sequelize";
import { config } from "./database";

const app = express();
const sequelize = initSequelize();

//App setup
app.set("port", process.env.PORT || 3000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
verifySequelize(sequelize);

//Routes
app.get("/", (req, res) => res.send("API running."));
app.post("/coordinates", async (req, res) => {
    let result = await saveCoordinates(req.body.username, req.body.latitude, req.body.longitude);
    res.send(result === true ? 200 : 500);
}); 

//Functions
function initSequelize() : Sequelize.Sequelize {
    return new Sequelize(config.database, config.username, config.password, {
        host: 'localhost', dialect: 'postgres', pool: { max: 5, min: 0, idle: 10000 },
    });
}

async function verifySequelize(sequelize: Sequelize.Sequelize) {
    try { await sequelize.authenticate(); } 
    catch (e) { console.error('[Sequelize] Unable to connect to the database: ', e); }
}

async function saveCoordinates(username: string, latitude: number, longitude: number): Promise<boolean> {
    try {
        let coordinates = sequelize.define('coordinate', {
            id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
            username: { type: Sequelize.STRING, allowNull: false },
            latitude: Sequelize.DOUBLE,
            longitude: Sequelize.DOUBLE
        });
        await coordinates.sync();
        var created = await coordinates.create({username: username, latitude: latitude, longitude: longitude});
        return true;
    } 
    catch(e) {
        console.error("[Sequelize] Could not save coordinates: ", e);
        return false;
    }
}

//Init
app.listen(5000, 'localhost', () => console.info("API running."));