import { Navigate } from "react-router-dom";

//Home
import Home from "pages/Home/Index";

//Inventory

import ViewInventory from "pages/Inventory/ViewInventory";
import ProductDetails from "pages/Inventory/InventoryDetails";
import Suppliers from "pages/Suppliers/Suppliers";
import ViewIncome from "pages/Incomes/ViewIncomes"
import ViewProducts from "pages/Products/ViewProducts";

//Subwarehouse
import ViewSubwarehouse from "pages/Subwarehouse/ViewSubwarehouse";


import Basic404 from '../pages/AuthenticationInner/Errors/Basic404';
import Cover404 from '../pages/AuthenticationInner/Errors/Cover404';
import Alt404 from '../pages/AuthenticationInner/Errors/Alt404';
import Error500 from '../pages/AuthenticationInner/Errors/Error500';
import Offlinepage from "../pages/AuthenticationInner/Errors/Offlinepage";

// //login
import Login from "../pages/Authentication/Login";
import ForgetPasswordPage from "../pages/Authentication/ForgetPassword";
import Register from "../pages/Authentication/Register";


// // User Profile
import UserProfile from "../pages/Authentication/user-profile";
import SupplierDetails from "pages/Suppliers/SupplierDetails";
import IncomeDetails from "pages/Incomes/IncomeDetails";
import SubwarehouseDetails from "pages/Subwarehouse/SubwarehouseDetails";
import ViewOutcomes from "pages/Outcomes/ViewOutcomes";
import OutcomeDetails from "pages/Outcomes/OutcomeDetails";

import ViewUsers from "pages/Users/ViewUsers";
import SendOrders from "pages/Orders/SendOrders";
import OrderDetails from "pages/Orders/OrderDetails";
import CompleteOrder from "pages/Orders/CompleteOrder";
import CompletedOrders from "pages/Orders/CompletedOrders";
import SubwarehouseInventory from "pages/Subwarehouse/SubwarehouseInventory";
import SubwarehouseIncomes from "pages/Subwarehouse/SubwarehouseIncomes";
import SubwarehouseOutcomes from "pages/Subwarehouse/SubwarehouseOutcomes";
import WarehouseConfiguration from "pages/Configuration/WarehouseConfiguration";
import ViewPurchaseOrders from "pages/PurchaseOrders/ViewPurchaseOrders";
import PurchaseOrderDetails from "pages/PurchaseOrders/PurchasOrderDetails";
import ViewPigs from "pages/Pigs/ViewPigs";
import ViewFarms from "pages/Farms/ViewFarms";
import PigDetails from "pages/Pigs/PigDetails";
import FarmDetails from "pages/Farms/FarmDetails";
import ViewGroups from "pages/Groups/ViewGroups";
import ViewExtractions from "pages/Laboratory/ViewExtractions";
import ViewSamples from "pages/Laboratory/ViewSamples";
import ViewGestations from "pages/Gestation/ViewInseminations";
import ViewPregnancies from "pages/Gestation/ViewPregnancies";
import ViewInseminations from "pages/Gestation/ViewInseminations";
import SampleDetails from "pages/Laboratory/SampleDetails";
import InseminationDetails from "pages/Gestation/InseminationDetails";
import ViewBirths from "pages/Births/ViewBirths";
import ViewUpcomingBirths from "pages/Births/ViewUpcomingBirths";
import GroupDetails from "pages/Groups/GroupDetails";
import Logout from "Components/Common/Velzon/Logout";
import DiscardedPigs from "pages/Pigs/DiscardedPigs";
import ViewMedicationPackages from "pages/Medication/ViewMedicationPackages";
import ViewVaccinationPlans from "pages/Medication/ViewVaccinePlans";



const authProtectedRoutes = [

  // home
  { path: "/home", component: <Home /> },

  //Farms
  { path: '/farms/view_farms', component: <ViewFarms /> },
  { path: '/farms/farm_details/:farm_id', component: <FarmDetails /> },

  //Warehouse
  { path: '/warehouse/configuration', component: <WarehouseConfiguration /> },


  //Warehouse - Inventory
  { path: '/warehouse/inventory/view_inventory', component: <ViewInventory /> },
  { path: '/warehouse/inventory/product_details', component: <ProductDetails /> },

  //Warehouse - Suppliers
  { path: '/warehouse/suppliers/view_suppliers', component: <Suppliers /> },
  { path: '/warehouse/suppliers/supplier_details/:id_supplier', component: <SupplierDetails /> },

  //Warehouse - Incomes
  { path: '/warehouse/incomes/view_incomes', component: <ViewIncome /> },
  { path: '/warehouse/incomes/income_details/:id_income', component: <IncomeDetails /> },

  //Warehouse - Outcomes
  { path: '/warehouse/outcomes/view_outcomes', component: <ViewOutcomes /> },
  { path: '/warehouse/outcomes/outcome_details/:id_outcome', component: <OutcomeDetails /> },

  //Warehouse - Product Catalog
  { path: '/warehouse/products/product_catalog', component: <ViewProducts /> },

  //Subwarehouse
  { path: '/subwarehouse/view_subwarehouse', component: <ViewSubwarehouse /> },
  { path: '/subwarehouse/subwarehouse_details/:id_subwarehouse', component: <SubwarehouseDetails /> },
  { path: '/subwarehouse/subwarehouse_inventory', component: <SubwarehouseInventory /> },
  { path: '/subwarehouse/subwarehouse_incomes', component: <SubwarehouseIncomes /> },
  { path: '/subwarehouse/subwarehouse_outcomes', component: <SubwarehouseOutcomes /> },

  //Orders
  { path: '/orders/send_orders', component: <SendOrders /> },
  { path: '/orders/order_details/:id_order', component: <OrderDetails /> },
  { path: '/orders/complete_order/:id_order', component: <CompleteOrder /> },
  { path: '/orders/completed_orders', component: <CompletedOrders /> },

  //Purchase orders
  { path: '/purchase_orders/view_purchase_orders', component: <ViewPurchaseOrders /> },
  { path: '/purchase_orders/purchase_order_details/:id_order', component: <PurchaseOrderDetails /> },

  //Pigs
  { path: '/pigs/view_pigs', component: <ViewPigs /> },
  { path: '/pigs/pig_details/:pig_id', component: <PigDetails /> },
  { path: '/pigs/discarded_pigs', component: <DiscardedPigs /> },

  //Users
  { path: 'users/view_users', component: <ViewUsers /> },

  //User Profile
  { path: "/profile", component: <UserProfile /> },

  //Groups
  { path: "/groups/view_groups", component: <ViewGroups /> },
  { path: "/groups/group_details/:group_id", component: <GroupDetails /> },

  //Laboratory
  { path: "/laboratory/extractions/view_extractions", component: <ViewExtractions /> },
  { path: "/laboratory/samples/view_samples", component: <ViewSamples /> },
  { path: "/laboratory/samples/sample_details/:sample_id", component: <SampleDetails /> },

  //Gestation
  { path: "/gestation/view_inseminations", component: <ViewInseminations /> },
  { path: "/gestation/insemination_details/:insemination_id", component: <InseminationDetails /> },
  { path: "/gestation/view_pregnancies", component: <ViewPregnancies /> },

  //Births
  { path: "/births/view_births", component: <ViewBirths /> },
  { path: "/births/view_upcoming_births", component: <ViewUpcomingBirths /> },
  { path: "/births/view_births", component: <ViewBirths /> },

  //Medication
  { path: "/medication/view_medication_package", component: <ViewMedicationPackages /> },
  { path: "/medication/view_vaccination_plans", component: <ViewVaccinationPlans /> },



  // this route should be at the end of all other routes
  // eslint-disable-next-line react/display-name
  {
    path: "/",
    exact: true,
    component: <Navigate to="/dashboard" />,
  },
  { path: "*", component: <Navigate to="/dashboard" /> },
];

const publicRoutes = [
  // Authentication Page
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forgot-password", component: <ForgetPasswordPage /> },
  { path: "/register", component: <Register /> },


  { path: "/auth-404-basic", component: <Basic404 /> },
  { path: "/auth-404-cover", component: <Cover404 /> },
  { path: "/auth-404-alt", component: <Alt404 /> },
  { path: "/auth-500", component: <Error500 /> },
  { path: "/auth-offline", component: <Offlinepage /> },

];

export { authProtectedRoutes, publicRoutes };