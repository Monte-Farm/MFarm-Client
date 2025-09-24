import { Navigate } from "react-router-dom";

//Home
import Home from "pages/Home/Index";

//Inventory

import ViewInventory from "pages/Inventory/ViewInventory";
import ProductDetails from "pages/Inventory/InventoryDetails";
import Suppliers from "pages/Suppliers/Suppliers";
import CreateSupplier from "pages/Suppliers/CreateSupplier";
import ViewIncome from "pages/Incomes/ViewIncomes"
import CreateIncome from "pages/Incomes/CreateIncome";
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
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register";


// // User Profile
import UserProfile from "../pages/Authentication/user-profile";
import SupplierDetails from "pages/Suppliers/SupplierDetails";
import IncomeDetails from "pages/Incomes/IncomeDetails";
import CreateProduct from "pages/Inventory/CreateProduct";
import SubwarehouseDetails from "pages/Subwarehouse/SubwarehouseDetails";
import ViewOutcomes from "pages/Outcomes/ViewOutcomes";
import CreateOutcome from "pages/Outcomes/CreateOutcome";
import OutcomeDetails from "pages/Outcomes/OutcomeDetails";

//Configuration
import ConfigurationPage from "pages/Configuration/ConfigurationPage";

//
import CreateOrder from "pages/Orders/CreateOrder";
import ViewUsers from "pages/Users/ViewUsers";
import SendOrders from "pages/Orders/SendOrders";
import OrderDetails from "pages/Orders/OrderDetails";
import CompleteOrder from "pages/Orders/CompleteOrder";
import CompletedOrders from "pages/Orders/CompletedOrders";
import SubwarehouseInventory from "pages/Subwarehouse/SubwarehouseInventory";
import SubwarehouseIncomes from "pages/Subwarehouse/SubwarehouseIncomes";
import SubwarehouseOutcomes from "pages/Subwarehouse/SubwarehouseOutcomes";
import CreateSubwarehouseOutcome from "pages/Subwarehouse/CreateSubwarehouseOutcome";
import WarehouseConfiguration from "pages/Configuration/WarehouseConfiguration";
import IncomesConfiguration from "pages/Incomes/IncomesConfiguration";
import OutcomesConfiguration from "pages/Outcomes/OutcomesConfiguration";
import SupplierConfiguration from "pages/Suppliers/SupplierConfiguration";
import ProductConfiguration from "pages/Products/ProductsConfiguration";
import UserConfiguration from "pages/Users/UserConfiguration";
import ViewPurchaseOrders from "pages/PurchaseOrders/ViewPurchaseOrders";
import CreatePurchaseOrder from "pages/PurchaseOrders/CreatePurchaseOrder";
import PurchaseOrderDetails from "pages/PurchaseOrders/PurchasOrderDetails";
import ViewPigs from "pages/Pigs/ViewPigs";
import ViewFarms from "pages/Farms/ViewFarms";
import PigDetails from "pages/Pigs/PigDetails";
import RegisterPig from "pages/Pigs/RegisterPig";
import UserDetails from "pages/Users/UserDetails";
import FarmDetails from "pages/Farms/FarmDetails";
import ViewGroups from "pages/Groups/ViewGroups";
import CreateGroup from "pages/Groups/CreateGroup";
import ViewExtractions from "pages/Laboratory/ViewExtractions";
import ViewSamples from "pages/Laboratory/ViewSamples";
import ViewGestations from "pages/Gestation/ViewInseminations";
import ViewPregnancies from "pages/Gestation/ViewPregnancies";
import ViewInseminations from "pages/Gestation/ViewInseminations";
import SampleDetails from "pages/Laboratory/SampleDetails";
import InseminationDetails from "pages/Gestation/InseminationDetails";



const authProtectedRoutes = [

  // home
  { path: "/home", component: <Home /> },

  //Farms
  { path: '/farms/view_farms', component: <ViewFarms /> },
  { path: '/farms/farm_details/:farm_id', component: <FarmDetails /> },

  //Warehouse
  { path: '/warehouse/configuration', component: <WarehouseConfiguration /> },


  //Warehouse - Inventory
  { path: '/warehouse/inventory/create_product', component: <CreateProduct /> },
  { path: '/warehouse/inventory/view_inventory', component: <ViewInventory /> },
  { path: '/warehouse/inventory/product_details', component: <ProductDetails /> },

  //Warehouse - Suppliers
  { path: '/warehouse/suppliers/view_suppliers', component: <Suppliers /> },
  { path: '/warehouse/suppliers/create_supplier', component: <CreateSupplier /> },
  { path: '/warehouse/suppliers/supplier_details/:id_supplier', component: <SupplierDetails /> },
  { path: '/warehouse/suppliers/configuration', component: <SupplierConfiguration /> },

  //Warehouse - Incomes
  { path: '/warehouse/incomes/create_income', component: <CreateIncome /> },
  { path: '/warehouse/incomes/view_incomes', component: <ViewIncome /> },
  { path: '/warehouse/incomes/income_details/:id_income', component: <IncomeDetails /> },
  { path: '/warehouse/incomes/configuration', component: <IncomesConfiguration /> },

  //Warehouse - Outcomes
  { path: '/warehouse/outcomes/create_outcome', component: <CreateOutcome /> },
  { path: '/warehouse/outcomes/view_outcomes', component: <ViewOutcomes /> },
  { path: '/warehouse/outcomes/outcome_details/:id_outcome', component: <OutcomeDetails /> },
  { path: '/warehouse/outcomes/configuration', component: <OutcomesConfiguration /> },

  //Warehouse - Product Catalog
  { path: '/warehouse/products/product_catalog', component: <ViewProducts /> },
  { path: '/warehouse/products/configuration', component: <ProductConfiguration /> },

  //Subwarehouse
  { path: '/subwarehouse/view_subwarehouse', component: <ViewSubwarehouse /> },
  { path: '/subwarehouse/subwarehouse_details/:id_subwarehouse', component: <SubwarehouseDetails /> },
  { path: '/subwarehouse/subwarehouse_inventory', component: <SubwarehouseInventory /> },
  { path: '/subwarehouse/subwarehouse_incomes', component: <SubwarehouseIncomes /> },
  { path: '/subwarehouse/subwarehouse_outcomes', component: <SubwarehouseOutcomes /> },
  { path: '/subwarehouse/create_subwarehouse_outcome', component: <CreateSubwarehouseOutcome /> },

  //Orders
  { path: '/orders/create_order', component: <CreateOrder /> },
  { path: '/orders/send_orders', component: <SendOrders /> },
  { path: '/orders/order_details/:id_order', component: <OrderDetails /> },
  { path: '/orders/complete_order/:id_order', component: <CompleteOrder /> },
  { path: '/orders/completed_orders', component: <CompletedOrders /> },

  //Purchase orders
  { path: '/purchase_orders/view_purchase_orders', component: <ViewPurchaseOrders /> },
  { path: '/purchase_orders/create_purchase_order', component: <CreatePurchaseOrder /> },
  { path: '/purchase_orders/purchase_order_details/:id_order', component: <PurchaseOrderDetails /> },

  //Pigs
  { path: '/pigs/view_pigs', component: <ViewPigs /> },
  { path: '/pigs/pig_details/:pig_id', component: <PigDetails /> },
  { path: '/pigs/register_pig/', component: <RegisterPig /> },

  //Users
  { path: 'users/view_users', component: <ViewUsers /> },
  { path: 'users/configuration', component: <UserConfiguration /> },
  { path: 'users/user_details/:id_user', component: <UserDetails /> },

  //User Profile
  { path: "/profile", component: <UserProfile /> },

  //Groups
  { path: "/groups/view_groups", component: <ViewGroups /> },
  { path: "/groups/create_group", component: <CreateGroup /> },

  //Laboratory
  { path: "/laboratory/extractions/view_extractions", component: <ViewExtractions /> },
  { path: "/laboratory/samples/view_samples", component: <ViewSamples /> },
  { path: "/laboratory/samples/sample_details/:sample_id", component: <SampleDetails /> },

  //Gestation
  { path: "/gestation/view_inseminations", component: <ViewInseminations /> },
  { path: "/gestation/insemination_details/:insemination_id", component: <InseminationDetails /> },
  { path: "/gestation/view_pregnancies", component: <ViewPregnancies /> },


  //Configuration
  { path: '/configuration', component: <ConfigurationPage /> },

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