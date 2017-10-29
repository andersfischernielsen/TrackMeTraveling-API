import * as Sequelize from "sequelize";
import { config } from "./databaseConfig";

var instance : Sequelize.Sequelize;

function initSequelize() : Sequelize.Sequelize {
    return new Sequelize(config.database, config.username, config.password, {
        host: 'localhost', dialect: 'postgres', pool: { max: 5, min: 0, idle: 10000 },
    });
}

async function verifySequelize(sequelize: Sequelize.Sequelize) {
    try { await sequelize.authenticate(); return true; } 
    catch (e) { console.error('[Sequelize] Unable to connect to the database: ', e); return false; }
}

async function saveCoordinates(username: string, latitude: number, longitude: number) {
    let coordinates = instance.define('coordinate', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        username: { type: Sequelize.STRING, allowNull: false },
        latitude: Sequelize.DOUBLE,
        longitude: Sequelize.DOUBLE
    });
    await coordinates.sync();
    var created = await coordinates.create({username: username, latitude: latitude, longitude: longitude});
    return true;
}

async function initialise() {
    instance = initSequelize();
    return await verifySequelize(instance);
}

export { initialise, saveCoordinates }