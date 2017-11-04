import * as Sequelize from "sequelize";
import { databaseConfig as config, saltRounds, defaultUser } from "./configuration";
import * as bcrypt from "bcrypt";

var instance : Sequelize.Sequelize;
var coordinates : Sequelize.Model<any, any>;
var users : Sequelize.Model<any, any>;
var userTokens : Sequelize.Model<any, any>;

function initSequelize() : Sequelize.Sequelize {
    return new Sequelize(config.database, config.username, config.password, {
        host: 'localhost', dialect: 'postgres', pool: { max: 5, min: 0, idle: 10000 },
    });
}

async function setUp(sequelize: Sequelize.Sequelize) {
    try { 
        await sequelize.authenticate(); 
        let models = await defineModels();
        coordinates = models.coordinates; users = models.users;
        await createDefaultUser();
        return true; 
    } 
    catch (e) { 
        console.error('[Sequelize] Unable to set up database: ', e); 
        return false; 
    }
}

async function defineModels() {
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
            hooks: {
                beforeCreate: async (user, options) => {
                    let salt = await bcrypt.genSalt(saltRounds);
                    let hash = await bcrypt.hash(user.password, salt)
                    user.password = hash;
                }
            }
        }
    );

    userTokens = instance.define('user_refresh_tokens', {
        username: { type: Sequelize.STRING, unique: 'compositeIndex' },
        token: { type: Sequelize.STRING, unique: 'compositeIndex' }
    });

    await coordinates.sync();
    await users.sync();
    await userTokens.sync();
    return { coordinates, users, userTokens };
}

async function saveCoordinates(username: string, latitude: number, longitude: number) {
    if (!instance || !coordinates) return false;
    await coordinates.create({username: username, latitude: latitude, longitude: longitude});
    return true;
}

async function initialise() {
    instance = initSequelize();
    if (!instance) return false;
    return await setUp(instance);
}

let passwordsMatch = async (password:string, hashed: string) => 
    await bcrypt.compare(password, hashed)

let createDefaultUser = async () => 
    users.findCreateFind({ where: { username: defaultUser.username, email: defaultUser.email, password: defaultUser.password }});

async function authenticateUser(username:string, password:string) {
    //TODO: Implement union type for error types.
    if (!instance || !users) return { userExists: false, user: undefined };
    let found = await users.findOne({where: { username: username }});
    if (!found) return { userExists: false, user: undefined };
    try {
        if (await passwordsMatch(password, found.password)) 
            return { userExists: true, user: found };
        return { userExists: true, user: undefined }
    } catch (e) {
        return { userExists: true, user: undefined };
    }
}

async function saveUser(username:string, email: string, password:string) {
    if (!instance || !users) return undefined;
    let found = await users.findOne({ where: {
        [Sequelize.Op.or]: {
            username: { [Sequelize.Op.eq]: username },
            email: { [Sequelize.Op.eq]: email },
        }}
    });
    if (found) return undefined;
    let user = await users.create({ username: username, email: email, password: password });
    return user;
}

async function refreshTokenIsValid(username:string, refreshToken: string) {
    let found = await userTokens.findOne({ where: {
            username: username,
            token: refreshToken,
        }});
    return found;
}

async function saveRefreshTokenForUser(username:string, refreshToken: string) {
    let created = await userTokens.create({ username: username, token: refreshToken });    
    return created !== undefined;
}

export { initialise, saveCoordinates, authenticateUser, saveUser, refreshTokenIsValid, saveRefreshTokenForUser }