import { useContext, useEffect } from "react"
import { AuthContext } from "./AuthProvider"


export function Logout() {


    const { makeLogoutUrl } = useContext(AuthContext);

    useEffect(() => {
        const logoutUrl = makeLogoutUrl();
        if (logoutUrl) {
            window.location.href = logoutUrl as string;
        }
    }, [makeLogoutUrl]);



    return <div>Loading...</div>
}