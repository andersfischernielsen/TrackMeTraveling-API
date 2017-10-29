import * as passport from "passport";
import * as local from "passport-local";
import * as jwt from "jsonwebtoken";
import * as config from "./configuration";
import { authenticateUser } from "./database";
import { Request, Response } from "express";

passport.use(new local.Strategy(  
    async function(username, password, done) {
        let found = await authenticateUser(username, password);
        if (!found || found.userExists === false) done(null, false);
        done(null, found.user);
    }
));

function serialize(req:Request<any, any, any, any>, res:Response, next:any) {  
    req.user = { id: req.user.id };
    next();
}

function generateToken(req:any, res:Response, next:any) {  
    req.token = jwt.sign(
        { id: req.user.id }, 
        config.secret, 
        { expiresIn: "24h" }
    );
    next();
}

let respond = (req:any, res:Response) =>
    res.status(200).json({
        user: req.user,
        token: req.token
    });

let initialize = () => passport.initialize();
let authenticate = () => passport.authenticate('local', {session: false});

export { initialize, authenticate, serialize, generateToken, respond }