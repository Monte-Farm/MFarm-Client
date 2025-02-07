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
import path from "path";
import CreateOrder from "pages/Orders/CreateOrder";
import ViewUsers from "pages/Users/ViewUsers";
import SendOrders from "pages/Orders/SendOrders";
import OrderDetails from "pages/Orders/OrderDetails";
import CompleteOrder from "pages/Orders/CompleteOrder";
import CompletedOrders from "pages/Orders/CompletedOrders";



const authProtectedRoutes = [

  // home
  { path: "/home", component: <Home /> },

  //Warehouse

  //Warehouse - Inventory
  { path: '/warehouse/inventory/create_product', component: <CreateProduct /> },
  { path: '/warehouse/inventory/view_inventory', component: <ViewInventory /> },
  { path: '/warehouse/inventory/product_details', component: <ProductDetails /> },

  //Warehouse - Suppliers
  { path: '/warehouse/suppliers/view_suppliers', component: <Suppliers /> },
  { path: '/warehouse/suppliers/create_supplier', component: <CreateSupplier /> },
  { path: '/warehouse/suppliers/supplier_details/:id_supplier', component: <SupplierDetails /> },

  //Warehouse - Incomes
  { path: '/warehouse/incomes/create_income', component: <CreateIncome /> },
  { path: '/warehouse/incomes/view_incomes', component: <ViewIncome /> },
  { path: '/warehouse/incomes/income_details/:id_income', component: <IncomeDetails /> },

  //Warehouse - Outcomes
  { path: '/warehouse/outcomes/create_outcome', component: <CreateOutcome /> },
  { path: '/warehouse/outcomes/view_outcomes', component: <ViewOutcomes /> },
  { path: '/warehouse/outcomes/outcome_details/:id_outcome', component: <OutcomeDetails /> },

  //Warehouse - Product Catalog
  { path: '/warehouse/products/product_catalog', component: <ViewProducts /> },

  //Subwarehouse
  { path: '/subwarehouse/view_subwarehouse', component: <ViewSubwarehouse /> },
  { path: '/subwarehouse/subwarehouse_details/:id_subwarehouse', component: <SubwarehouseDetails /> },

  //Orders
  { path: '/orders/create_order', component: <CreateOrder /> },
  { path: '/orders/send_orders', component: <SendOrders /> },
  { path: '/orders/order_details/:id_order', component: <OrderDetails /> },
  { path: '/orders/complete_order/:id_order', component: <CompleteOrder /> },
  { path: '/orders/completed_orders', component: <CompletedOrders /> },


  //Users
  { path: 'users/view_users', component: <ViewUsers /> },

  //User Profile
  { path: "/profile", component: <UserProfile /> },

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