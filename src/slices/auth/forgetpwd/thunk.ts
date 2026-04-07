import { userForgetPasswordSuccess, userForgetPasswordError } from "./reducer";

export const userForgetPassword = (user: any, history: any) => async (dispatch: any) => {
  try {
    // TODO: Implement password reset via api_helper
  } catch (forgetError) {
    dispatch(userForgetPasswordError(forgetError));
  }
};
