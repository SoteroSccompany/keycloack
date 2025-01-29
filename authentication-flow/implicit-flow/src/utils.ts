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