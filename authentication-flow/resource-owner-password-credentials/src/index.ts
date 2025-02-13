import express from 'express';
import axios from 'axios';
import session, { MemoryStore } from 'express-session';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const app = express();
app.use(express.urlencoded({ extended: true }));
const memoryStore = new session.MemoryStore();

app.use(
    session({
        secret: "fullcycle",
        resave: false,
        saveUninitialized: false,
        store: memoryStore
    })
)

const middlewareIsAuth = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    // @ts-expect-error - type mismatch
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

app.get('/login', (req, res) => {
    // @ts-expect-error - type mismatch
    if (req.session.user) {
        return res.redirect('/admin');
    };
    res.sendFile(__dirname + '/login.html');
});

app.post("/login", async (req, res) => {

    const { username, password } = req.body;

    const response = await fetch('http://keycloak:8080/realms/fullcycle-realm/protocol/openid-connect/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: 'fullcycle-client',
            grant_type: 'password',
            username,
            password,
            scope: 'openid'
        }).toString()
    })

    const result = await response.json();
    console.log(result);
    // @ts-expect-error - type mismatch
    req.session.user = result;
    req.session.save();
    res.redirect('/admin');
});



app.get("/logout", async (req, res) => {
    // const logoutParams = new URLSearchParams({
    //     //client_id: "fullcycle-client",
    //     //@ts-expect-error - type mismatch
    //     id_token_hint: req.session.user.id_token,
    //     post_logout_redirect_uri: "http://localhost:3000/login",
    // });

    // req.session.destroy((err) => {
    //     console.error(err);
    // });

    // const url = `http://localhost:8080/realms/fullcycle-realm/protocol/openid-connect/logout?${logoutParams.toString()}`;
    const response = await fetch(
        'http://keycloak:8080/realms/fullcycle-realm/protocol/openid-connect/revoke',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: 'fullcycle-client',
                // @ts-expect-error - type mismatch
                token: req.session.user.refresh_token
            }).toString()
        }
    );
    //response.ok - Verificar se a resposta esta ok
    req.session.destroy((err) => {
        console.error(err);
    });
    res.redirect('/login');
});
// /

// @ts-expect-error - type mismatch
app.get('/callback', async (req, res) => {
    const { code } = req.query;

    // @ts-expect-error - type mismatch
    if (req.session.user) {
        return res.redirect('/admin');
    }

    console.log(req.query);
    // @ts-expect-error - type mismatch
    console.log(req.session.state);

    // @ts-expect-error - type mismatch
    if (req.query.state !== req.session.state) {
        //Poderia redirecionar para o login
        return res.redirect('/logout');
    }

    const bodyParams = new URLSearchParams({
        client_id: "fullcycle-client",
        grant_type: "authorization_code",
        code: req.query.code as string,
        redirect_uri: "http://localhost:3000/callback",
    });

    const url = `http://keycloak:8080/realms/fullcycle-realm/protocol/openid-connect/token`;
    try {

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: bodyParams.toString(),
        });

        const result = await response.json();

        console.log(result);

        const payloadAccessToken = jwt.decode(result.access_token) as any;
        const payloadRefreshToken = jwt.decode(result.refresh_token) as any;
        const payloadIdToken = jwt.decode(result.id_token) as any;


        if (
            // @ts-expect-error - type mismatch
            payloadIdToken!.nonce !== req.session.nonce ||
            // @ts-expect-error - type mismatch
            payloadRefreshToken!.nonce !== req.session.nonce ||
            // @ts-expect-error - type mismatch 
            payloadAccessToken!.nonce !== req.session.nonce
        ) {
            return res.status(403).json({ message: 'Unauthorized' });
        }



        res.json({ result });
    } catch (error) {
        console.log(error)
        res.send(error);
    }
});

app.get('/admin', middlewareIsAuth, (req, res) => {
    // @ts-expect-error - type mismatch
    res.json(req.session.user);
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});