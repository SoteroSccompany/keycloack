import { decodeJwt } from 'jose';
import Cookies from 'js-cookie';



export function makeLoginUrl() {
    const nonce = Math.random().toString(36);
    const state = Math.random().toString(36);

    Cookies.set('nonce', nonce);
    Cookies.set('state', state);

    const loginParams = new URLSearchParams({
        client_id: "fullcycle-client",
        redirect_uri: "http://localhost:3000/callback",
        response_type: "token id_token code",
        scope: "openid",
        nonce: nonce,
        state: state
    });

    return `http://localhost:8080/realms/fullcycle-realm/protocol/openid-connect/auth?${loginParams.toString()}`;

}

export function login(accessToken: string, idToken: string | null, refreshToken?: string, state?: string) {


    const stateCokiee = Cookies.get('state');
    if (state && stateCokiee !== state) {
        throw new Error('Invalid state');
    }

    let decodeAccessToken = null;
    let decodeIdToken = null;
    let decodedRefreshToken = null;
    try {
        decodeAccessToken = decodeJwt(accessToken);
        if (idToken) {
            decodeIdToken = decodeJwt(idToken);
        }
        if (refreshToken) {
            decodedRefreshToken = decodeJwt(refreshToken);
        }
    } catch (error) {
        console.log(error);
        throw new Error('Invalid token');
    }

    if (decodeAccessToken.nonce !== Cookies.get('nonce')) {
        throw new Error('Invalid nonce');
    }

    if (decodeIdToken.nonce !== Cookies.get('nonce')) {
        throw new Error('Invalid nonce');
    }

    if (decodedRefreshToken && decodedRefreshToken.nonce !== Cookies.get('nonce')) {
        throw new Error('Invalid nonce');
    }

    Cookies.set('access_token', accessToken);
    if (idToken) {
        Cookies.set('id_token', idToken);
    }
    if (decodedRefreshToken) {
        Cookies.set('refresh_token', refreshToken as string);
    }

    return decodeAccessToken;

}

export function exchangeCodeForToken(code: string) {
    const tokenUrlParams = new URLSearchParams({
        client_id: "fullcycle-client",
        grant_type: "authorization_code",
        code: code,
        redirect_uri: "http://localhost:3000/callback",
        nonce: Cookies.get("nonce") as string,
    });

    return fetch(
        "http://localhost:8080/realms/fullcycle-realm/protocol/openid-connect/token",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: tokenUrlParams.toString(),
        }
    )
        .then((res) => res.json())
        .then((res) => {
            return login(res.access_token, res.id_token, res.refresh_token);
        });
}

export function getAuth() {
    const accessToken = Cookies.get('access_token');

    if (!accessToken) {
        return null;
    }
    try {
        return decodeJwt(accessToken);
    } catch (error) {
        console.log(error);
        return null;
    }
}

export function makeLogoutUrl() {
    if (!Cookies.get('id_token')) {
        return false
    }
    const logoutParams = new URLSearchParams({
        //client_id: "fullcycle-client",
        id_token_hint: Cookies.get('id_token') as string,
        post_logout_redirect_uri: "http://localhost:3000/login",
    });

    Cookies.remove('access_token');
    Cookies.remove('id_token');
    Cookies.remove('refresh_token');
    Cookies.remove('nonce');
    Cookies.remove('state');

    return `http://localhost:8080/realms/fullcycle-realm/protocol/openid-connect/logout?${logoutParams.toString()}`;

}