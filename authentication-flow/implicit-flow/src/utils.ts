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
        response_type: "token id_token",
        scope: "openid",
        nonce: nonce,
        state: state
    });

    return `http://localhost:8080/realms/fullcycle-realm/protocol/openid-connect/auth?${loginParams.toString()}`;

}

export function login(accessToken: string, idToken: string, state: string) {
    const stateCokiee = Cookies.get('state');

    if (stateCokiee !== state) {
        throw new Error('Invalid state');
    }

    let decodeAccessToken = null;
    let decodeIdToken = null;
    try {
        decodeAccessToken = decodeJwt(accessToken);
        decodeIdToken = decodeJwt(idToken);
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

    Cookies.set('access_token', accessToken);
    Cookies.set('id_token', idToken);

    return decodeAccessToken;

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
    Cookies.remove('nonce');
    Cookies.remove('state');

    return `http://localhost:8080/realms/fullcycle-realm/protocol/openid-connect/logout?${logoutParams.toString()}`;

}