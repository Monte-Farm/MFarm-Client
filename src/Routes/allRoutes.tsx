import { Navigate } from "react-router-dom";

//Home
import Home from "pages/Home/Index";

//Inventory
import ViewInventory from "pages/Warehouse/Inventory";
import ProductDetails from "pages/Warehouse/ProductDetails";
import Suppliers from "pages/Suppliers/Suppliers";
import CreateSupplier from "pages/Suppliers/CreateSupplier";
import ViewIncome from "pages/Incomes/ViewIncomes"
import CreateIncome from "pages/Incomes/CreateIncome";

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



const authProtectedRoutes = [

  // home
  { path: "/home", component: <Home /> },

  //Inventory
  { path: '/warehouse/inventory/view_inventory', component: <ViewInventory /> },
  { path: '/warehouse/inventory/product_details/:id_product', component: <ProductDetails /> },
  { path: '/warehouse/suppliers/view_suppliers', component: <Suppliers /> },
  { path: '/warehouse/suppliers/create_supplier', component: <CreateSupplier /> },
  { path: '/warehouse/suppliers/supplier_details/:id_supplier', component: <SupplierDetails /> },
  { path: '/warehouse/incomes/create_income', component: <CreateIncome /> },
  { path: '/warehouse/incomes/view_incomes', component: <ViewIncome /> },
  { path: '/warehouse/incomes/income_details/:id_income', component: <IncomeDetails /> },

  //User Profile
  { path: "/profile", component: <UserProfile /> },

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