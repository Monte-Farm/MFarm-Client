import { getEffectiveUser } from "helpers/impersonation_helper";
import { useEffect, useState } from "react";

const useProfile = () => {
  const userProfileSession = getEffectiveUser();
  var token =
  userProfileSession &&
  userProfileSession["token"];
  const [loading, setLoading] = useState(userProfileSession ? false : true);
  const [userProfile, setUserProfile] = useState(
    userProfileSession ? userProfileSession : null
  );

  useEffect(() => {
    const userProfileSession = getEffectiveUser();
    var token =
      userProfileSession &&
      userProfileSession["token"];
    setUserProfile(userProfileSession ? userProfileSession : null);
    setLoading(token ? false : true);
  }, []);


  return { userProfile, loading,token };
};

export { useProfile };