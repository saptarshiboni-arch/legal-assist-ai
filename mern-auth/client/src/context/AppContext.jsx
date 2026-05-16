import { createContext, useEffect, useState, useCallback } from "react"
import axios from "../api/axios"
import { toast } from "react-toastify"

// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext()
  
export const AppContextProvider = (props) => {

    const [isLoggedin, setIsLoggedin] = useState(false)
    const [userData, setUserData] = useState(false)
    const getUserData = useCallback(async () => {
        try {
            const {data} = await axios.get(`/api/users/getuser`)
            if(data.success){
                setUserData(data.userData)
            }else{
                toast.error(data.message)
            }
        } catch {
            toast.error("Error fetching user data")
        }
    }, [])

    const getAuthStatus = useCallback(async () => {
        try {
            const {data} = await axios.get(`/api/auth/is-authenticated`)
            if(data.success){
                setIsLoggedin(true)
                getUserData()
            }
        } catch {
            // toast.error("Error fetching auth status")
        }
    }, [getUserData])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        getAuthStatus();
    }, [getAuthStatus])


    const value = {
        isLoggedin,
        setIsLoggedin,
        userData,
        setUserData,
        getUserData
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}
