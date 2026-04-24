import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { setAuthorization } from "../helpers/api_helper";
import { useDispatch, useSelector } from "react-redux";

import { useProfile } from "../Components/Hooks/UserHooks";

import { logoutUser } from "../slices/auth/login/thunk";
import { connectNotificationSocket } from "../helpers/socketService";
import { fetchGlobalConfig } from "../slices/configurations/thunk";

const AuthProtected = (props : any) =>{
  const dispatch : any = useDispatch();
  const { userProfile, loading, token } = useProfile();
  const globalConfig = useSelector((s: any) => s.Configurations.globalConfig);

  useEffect(() => {
    if (userProfile && !loading && token) {
      setAuthorization(token);
      connectNotificationSocket(token, dispatch);
      if (!globalConfig) {
        dispatch(fetchGlobalConfig());
      }
    } else if (!userProfile && loading && !token) {
      dispatch(logoutUser());
    }
  }, [token, userProfile, loading, dispatch, globalConfig]);

  /*
    Navigate is un-auth access protected routes via url
    */

  if (!userProfile && loading && !token) {
    return (
      <Navigate to={{ pathname: "/login"}} />
    );
  }

  return <>{props.children}</>;
};


export default AuthProtected;