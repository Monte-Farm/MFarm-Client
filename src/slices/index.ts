import { combineReducers } from "redux";

// Front
import LayoutReducer from "./layouts/reducer";

// Authentication
import LoginReducer from "./auth/login/reducer";
import AccountReducer from "./auth/register/reducer";
import ForgetPasswordReducer from "./auth/forgetpwd/reducer";
import ProfileReducer from "./auth/profile/reducer";

// Notifications
import NotificationsReducer from "./notifications/reducer";

// AI Chat
import AiReducer from "./ai/reducer";

// Configurations
import ConfigurationsReducer from "./configurations/reducer";

// Period Closing
import PeriodClosingReducer from "./periodClosing/reducer";

// Subscription
import SubscriptionReducer from "./subscription/reducer";

// Capital Assets
import CapitalAssetsReducer from "./capitalAssets/reducer";

// Inventory Adjustments
import InventoryAdjustmentsReducer from "./inventoryAdjustments/reducer";

const rootReducer = combineReducers({
    Layout: LayoutReducer,
    Login: LoginReducer,
    Account: AccountReducer,
    ForgetPassword: ForgetPasswordReducer,
    Profile: ProfileReducer,
    Notifications: NotificationsReducer,
    Ai: AiReducer,
    Configurations: ConfigurationsReducer,
    PeriodClosing: PeriodClosingReducer,
    Subscription: SubscriptionReducer,
    CapitalAssets: CapitalAssetsReducer,
    InventoryAdjustments: InventoryAdjustmentsReducer,
});

export default rootReducer;
