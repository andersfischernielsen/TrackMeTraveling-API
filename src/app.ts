import * as express from "express";
import * as bodyParser from "body-parser";
import * as Sequelize from "sequelize";

const app = express();
const sequelize = initSequelize();

//App setup
app.set("port", process.env.PORT || 3000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
verifySequelize(sequelize);

//Routes
app.get("/api", (req, res) => res.send("API running."));
app.post("/api/coordinates", (req, res) => res.send(saveCoordinates(req.body.latitude, req.body.longitude)));

//Functions
function initSequelize() : Sequelize.Sequelize{
    return new Sequelize('postgres', 'postgres', 'postgres', {
        host: 'localhost',
        dialect: 'postgres',
        pool: { max: 5, min: 0, idle: 10000 },
    });
}

async function verifySequelize(sequelize: Sequelize.Sequelize) {
    try {
        await sequelize.authenticate();
    } catch (e) {
        console.error('[Sequelize] Unable to connect to the database:', e);
    }
}

async function saveCoordinates(latitude: number, longitude: number): Promise<any> {
    try {
        let Coordinates = sequelize.define('coordinate', {
            id: { type: Sequelize.UUIDV4, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
            username: Sequelize.STRING,
            latitude: Sequelize.DOUBLE,
            longitude: Sequelize.DOUBLE
        });
        await Coordinates.sync();
        var created = await Coordinates.create({latitude: latitude, longitude: longitude});
        return created;
    } 
    catch(e) {
        console.log(e);
    }
}

//Init
app.listen(5000, 'localhost', () => console.info("API running."));