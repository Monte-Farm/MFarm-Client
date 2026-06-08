import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { setAuthorization } from "../helpers/api_helper";
import { useDispatch, useSelector } from "react-redux";
import { useProfile } from "../Components/Hooks/UserHooks";
import { logoutUser } from "../slices/auth/login/thunk";
import { connectNotificationSocket } from "../helpers/socketService";
import { fetchGlobalConfig } from "../slices/configurations/thunk";
import { fetchSubscriptionDetails } from "../slices/subscription/thunk";
import SubscriptionSuspendedScreen from "../Components/Common/Shared/SubscriptionSuspendedScreen";

const AuthProtected = (props: any) => {
  const dispatch: any = useDispatch();
  const { userProfile, loading, token } = useProfile();
  const location = useLocation();
  const globalConfig = useSelector((s: any) => s.Configurations.globalConfig);
  const subscriptionDetails = useSelector((s: any) => s.Subscription.details);
  const subscriptionLoading = useSelector((s: any) => s.Subscription.loading);

  useEffect(() => {
    if (userProfile && !loading && token) {
      setAuthorization(token);
      connectNotificationSocket(token, dispatch);
      if (!globalConfig) {
        dispatch(fetchGlobalConfig());
      }
      if (!subscriptionDetails && !subscriptionLoading) {
        dispatch(fetchSubscriptionDetails());
      }
    } else if (!userProfile && loading && !token) {
      dispatch(logoutUser());
    }
  }, [token, userProfile, loading, dispatch, globalConfig, subscriptionDetails, subscriptionLoading]);

  if (!userProfile && loading && !token) {
    return <Navigate to={{ pathname: "/login" }} />;
  }

  // Suscripción suspendida: bloqueo total excepto en la página de suscripción
  if (subscriptionDetails?.status === "suspended" && location.pathname !== "/subscription") {
    return <SubscriptionSuspendedScreen />;
  }

  return <>{props.children}</>;
};

export default AuthProtected;
