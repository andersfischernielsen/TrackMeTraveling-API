import * as passport from "passport";
import * as local from "passport-local";

passport.use(new local.Strategy(  
    function(username, password, done) {
        // database dummy - find user and verify password
        if(username === 'devils name' && password === '666'){
            done(null, {
            id: 666,
            firstname: 'devils',
            lastname: 'name',
            email: 'devil@he.ll',
            verified: true
            });
        }
        else {
            done(null, false);
        }
    }
));