import { logoutUserSuccess, apiError, reset_login_flag } from './reducer';
import { stopImpersonation } from 'helpers/impersonation_helper';

export const logoutUser = () => async (dispatch: any) => {
  try {
    stopImpersonation();
    sessionStorage.removeItem("authUser");
    dispatch(logoutUserSuccess(true));
  } catch (error) {
    dispatch(apiError(error));
  }
};

export const resetLoginFlag = () => async (dispatch: any) => {
  try {
    const response = dispatch(reset_login_flag());
    return response;
  } catch (error) {
    dispatch(apiError(error));
  }
};
