import * as passport from "passport";
import * as local from "passport-local";
import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import { ExtractJwt, Strategy as JWTStrategy } from "passport-jwt";
import { Request, Response } from "express";

import * as config from "./configuration";
import { authenticateUser } from "./database";

var jwtOptions = { 
    jwtFromRequest: ExtractJwt.fromBodyField("access_token"),
    secretOrKey: config.secret
}
let jwtStrategy = new JWTStrategy(jwtOptions, function(jwtPayload, next) { next(null, true) });

passport.use(jwtStrategy);
passport.use(new local.Strategy(  
    async function(username, password, done) {
        let found = await authenticateUser(username, password);
        if (!found || found.userExists === false) done(null, false);
        done(null, found.user);
    }
));

function serialize(req:Request<any>, res:Response, next:any) {  
    req.user = { id: req.user.id };
    next();
}

function generateToken(req:any, res:Response, next:any) {  
    req.access_token = jwt.sign(
        { id: req.user.id }, 
        config.secret, 
        { expiresIn: "5m" }
    );
    req.refresh_token = jwt.sign(
        crypto.randomBytes(256).toString('hex'), 
        config.secret
    );
    //TODO: Save refresh_token in DB for user.
    next();
}

let respond = (req:any, res:Response) =>
    res.status(200).json({
        access_token: req.access_token,
        refresh_token: req.refresh_token
    });

let initialize = () => passport.initialize();
let authenticate = () => passport.authenticate('local', {session: false});
let authenticateJWT = () => passport.authenticate('jwt', {session: false});

export { initialize, authenticate, authenticateJWT, serialize, generateToken, respond }