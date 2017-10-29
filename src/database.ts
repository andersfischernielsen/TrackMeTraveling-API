import * as Sequelize from "sequelize";
import { databaseConfig as config } from "./configuration";
import * as bcrypt from "bcrypt";

var instance : Sequelize.Sequelize;
var coordinates : Sequelize.Model<any, any>;
var users : Sequelize.Model<any, any>;

function initSequelize() : Sequelize.Sequelize {
    return new Sequelize(config.database, config.username, config.password, {
        host: 'localhost', dialect: 'postgres', pool: { max: 5, min: 0, idle: 10000 },
    });
}

async function setUp(sequelize: Sequelize.Sequelize) {
    try { 
        await sequelize.authenticate(); 
        let models =  defineModels();
        coordinates = models.coordinates;
        users = models.users;
        await coordinates.sync();
        await users.sync();
        await users.findOrCreate({ where: {username: "fischer", email: "f@f.com", password: "bla bla" }});
        return true; 
    } 
    catch (e) { 
        console.error('[Sequelize] Unable to set up database: ', e); 
        return false; 
    }
}

function defineModels() {
    coordinates = instance.define('coordinate', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        username: { type: Sequelize.STRING, allowNull: false },
        latitude: Sequelize.DOUBLE,
        longitude: Sequelize.DOUBLE
    });
    users = instance.define('user', {
            username: { type: Sequelize.STRING, primaryKey: true },
            email: { type: Sequelize.STRING, allowNull: false },
            password: { type: Sequelize.STRING, allowNull: false }
        }, 
        {   
            instanceMethods: {
                generateHash: async (password:string) => await bcrypt.hash(password, await bcrypt.genSalt(8), null),
                validPassword: async (password:string) => await bcrypt.compare(password, this.password)
            },
            hooks: {
                beforeCreate: async (user, options) => await user.generateHash(user.password)
            }
        }
    );

    return { coordinates, users };
}

async function saveCoordinates(username: string, latitude: number, longitude: number) {
    if (!instance || !coordinates) return false;
    await coordinates.sync();
    var created = await coordinates.create({username: username, latitude: latitude, longitude: longitude});
    return true;
}

async function initialise() {
    instance = initSequelize();
    if (!instance) return false;
    return await setUp(instance);
}

async function authenticateUser(username:string, password:string) {
    if (!instance || !users) return { userExists: false, user: undefined };
    let found = await users.findOne({where: { username: username }});
    if (!found.validPassword(password)) return { userExists: false, user: undefined }
    return { userExists: found === undefined, user: found };
}

export { initialise, saveCoordinates, authenticateUser }