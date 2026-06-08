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

import Alt404 from '../pages/AuthenticationInner/Errors/Alt404';
import Offlinepage from "../pages/AuthenticationInner/Errors/Offlinepage";

// //login
import Login from "../pages/Authentication/Login";


// // User Profile
import SubwarehouseDetails from "pages/Subwarehouse/SubwarehouseDetails";
import ViewOutcomes from "pages/Outcomes/ViewOutcomes";

import ViewUsers from "pages/Users/ViewUsers";
import SendOrders from "pages/Orders/SendOrders";
import OrderDetails from "pages/Orders/OrderDetails";
import CompleteOrder from "pages/Orders/CompleteOrder";
import SubwarehouseInventory from "pages/Subwarehouse/SubwarehouseInventory";
import SubwarehouseIncomes from "pages/Subwarehouse/SubwarehouseIncomes";
import SubwarehouseOutcomes from "pages/Subwarehouse/SubwarehouseOutcomes";
import ViewPurchaseOrders from "pages/PurchaseOrders/ViewPurchaseOrders";
import ViewPigs from "pages/Pigs/ViewPigs";
import ViewFarms from "pages/Farms/ViewFarms";
import PigDetails from "pages/Pigs/PigDetails";
import FarmDetails from "pages/Farms/FarmDetails";
import ViewGroups from "pages/Groups/ViewGroups";
import ViewExtractions from "pages/Laboratory/ViewExtractions";
import ViewSamples from "pages/Laboratory/ViewSamples";
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
import ViewFeedingPackages from "pages/Feeding/ViewFeedingPackages";
import ViewFeedPreparations from "pages/Feeding/ViewFeedPreparations";
import ViewLitters from "pages/Lactation/ViewLitters";
import LitterDetails from "pages/Lactation/LitterDetails";
import InventoryPigs from "pages/Pigs/InventoryPigs";
import ViewWeanedGroups from "pages/Groups/ViewWeanedGroups";
import ViewGrowingGroups from "pages/Groups/ViewGrowingGroups";
import ViewFinishingGroups from "pages/Groups/ViewFinishingGroups";
import ViewBoars from "pages/Replacement/ViewBoars";
import ViewExitGroups from "pages/Groups/ViewExitGroups";
import ViewSowsGroups from "pages/Groups/ViewSowsGroups";
import ViewSows from "pages/Replacement/ViewSows";
import ViewSaleGroups from "pages/Groups/ViewSaleGroups";
import ViewSoldGroups from "pages/Groups/ViewSoldGroups";
import ViewPigSales from "pages/Sales/ViewPigSales";
import ViewFeedingConsumption from "pages/Feeding/ViewFeedingConsumption";
import NotFound from "pages/NotFound/NotFound";

//Reports - Production
import InseminationsBirthsReport from "pages/Reports/Production/InseminationsBirthsReport";
import GroupsReport from "pages/Reports/Production/GroupsReport";
import MortalityReport from "pages/Reports/Production/MortalityReport";
import FeedWeightReport from "pages/Reports/Production/FeedWeightReport";
import ReproductiveReport from "pages/Reports/Production/ReproductiveReport";

//Reports - Inventory
import InventoryMovementsReport from "pages/Reports/Inventory/InventoryMovementsReport";
import FeedConsumptionReport from "pages/Reports/Inventory/FeedConsumptionReport";
import InventoryAlertsReport from "pages/Reports/Inventory/InventoryAlertsReport";
import InventoryValuationReport from "pages/Reports/Inventory/InventoryValuationReport";

//Reports - Finance
import PurchasesReport from "pages/Reports/Finance/PurchasesReport";
import CostAnalysisReport from "pages/Reports/Finance/CostAnalysisReport";
import ProfitabilityReport from "pages/Reports/Finance/ProfitabilityReport";
import OperationsClosingReport from "pages/Reports/Finance/OperationsClosingReport";
import CashFlowReport from "pages/Reports/Finance/CashFlowReport";
import SupplierStatementReport from "pages/Reports/Finance/SupplierStatementReport";
import ExpensesReport from "pages/Reports/Finance/ExpensesReport";

//Expenses
import ViewExpenses from "pages/Expenses/ViewExpenses";

//Finance - Period Closing
import PeriodClosingList from "pages/Finance/PeriodClosing/PeriodClosingList";
import PeriodClosingDetail from "pages/Finance/PeriodClosing/PeriodClosingDetail";

//Reports - Sales
import SalesReport from "pages/Reports/Sales/SalesReport";
import ClientsReport from "pages/Reports/Sales/ClientsReport";

//Reports - Catalogs, Traceability, Audit
import CatalogsReport from "pages/Reports/Catalogs/CatalogsReport";
import GroupTraceabilityReport from "pages/Reports/Traceability/GroupTraceabilityReport";
import AuditReport from "pages/Reports/Audit/AuditReport";

//Configurations
import GlobalConfiguration from "pages/Configurations/GlobalConfiguration";
import FarmConfiguration from "pages/Configurations/FarmConfiguration";
import RoleProtected from "./RoleProtected";
import ReadOnlyBoundary from "./ReadOnlyBoundary";

//User Manual
import UserManual from "pages/UserManual/UserManual";

//Subscription
import SubscriptionDetails from "pages/Subscription/SubscriptionDetails";


const authProtectedRoutes = [

  // home
  { path: "/home", component: <Home /> },

  //Farms
  { path: '/farms/view_farms', component: <ViewFarms /> },
  { path: '/farms/farm_details/:farm_id', component: <FarmDetails /> },

  //Warehouse - Inventory
  { path: '/warehouse/inventory/view_inventory', component: <ViewInventory /> },
  { path: '/warehouse/inventory/product_details', component: <ProductDetails /> },

  //Warehouse - Suppliers
  { path: '/warehouse/suppliers/view_suppliers', component: <Suppliers /> },

  //Warehouse - Incomes
  { path: '/warehouse/incomes/view_incomes', component: <ViewIncome /> },

  //Warehouse - Outcomes
  { path: '/warehouse/outcomes/view_outcomes', component: <ViewOutcomes /> },

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

  //Purchase orders
  { path: '/purchase_orders/view_purchase_orders', component: <ViewPurchaseOrders /> },

  //Expenses
  { path: '/expenses/view_expenses', component: <ViewExpenses /> },

  //Finance - Period Closing
  { path: '/finance/period-closing', component: <PeriodClosingList /> },
  { path: '/finance/period-closing/:closingId', component: <PeriodClosingDetail /> },

  //Pigs
  { path: '/pigs/view_pigs', component: <ViewPigs /> },
  { path: '/pigs/pig_details/:pig_id', component: <PigDetails /> },
  { path: '/pigs/discarded_pigs', component: <DiscardedPigs /> },
  { path: '/pigs/inventory_pigs', component: <InventoryPigs /> },

  //Users
  { path: 'users/view_users', component: <ViewUsers /> },

  //Groups
  { path: "/groups/view_groups", component: <ViewGroups /> },
  { path: "/groups/group_details/:group_id", component: <GroupDetails /> },
  { path: '/groups/view_weaned_groups', component: <ViewWeanedGroups /> },
  { path: '/groups/view_growing_groups', component: <ViewGrowingGroups /> },
  { path: '/groups/view_finishing_groups', component: <ViewFinishingGroups /> },
  { path: '/groups/view_exit_groups', component: <ViewExitGroups /> },


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

  //Feeding
  { path: "/feeding/view_feeding_packages", component: <ViewFeedingPackages /> },
  { path: "/feeding/view_feed_preparations", component: <ViewFeedPreparations /> },
  { path: "/feeding/view_feeding_consumption", component: <ViewFeedingConsumption /> },

  //Lactation
  { path: '/lactation/view_litters', component: <ViewLitters /> },
  { path: '/lactation/litter_details/:litter_id', component: <LitterDetails /> },

  //Replacement
  { path: '/replacement/view_sows', component: <ViewSows /> },
  { path: '/replacement/view_boars', component: <ViewBoars /> },

  //Sale
  { path: '/sale/view_sale_groups', component: <ViewSaleGroups /> },
  { path: '/sale/view_sold_groups', component: <ViewSoldGroups /> },
  { path: '/sale/view_pig_sales', component: <ViewPigSales /> },

  //Reports - Production
  { path: '/reports/production/inseminations-births', component: <ReadOnlyBoundary><InseminationsBirthsReport /></ReadOnlyBoundary> },
  { path: '/reports/production/groups', component: <ReadOnlyBoundary><GroupsReport /></ReadOnlyBoundary> },
  { path: '/reports/production/mortality', component: <ReadOnlyBoundary><MortalityReport /></ReadOnlyBoundary> },
  { path: '/reports/production/feed-weight', component: <ReadOnlyBoundary><FeedWeightReport /></ReadOnlyBoundary> },
  { path: '/reports/production/reproductive', component: <ReadOnlyBoundary><ReproductiveReport /></ReadOnlyBoundary> },

  //Reports - Inventory
  { path: '/reports/inventory/movements', component: <ReadOnlyBoundary><InventoryMovementsReport /></ReadOnlyBoundary> },
  { path: '/reports/inventory/feed-consumption', component: <ReadOnlyBoundary><FeedConsumptionReport /></ReadOnlyBoundary> },
  { path: '/reports/inventory/alerts', component: <ReadOnlyBoundary><InventoryAlertsReport /></ReadOnlyBoundary> },
  { path: '/reports/inventory/valuation', component: <ReadOnlyBoundary><InventoryValuationReport /></ReadOnlyBoundary> },

  //Reports - Finance
  { path: '/reports/finance/purchases', component: <ReadOnlyBoundary><PurchasesReport /></ReadOnlyBoundary> },
  { path: '/reports/finance/costs', component: <ReadOnlyBoundary><CostAnalysisReport /></ReadOnlyBoundary> },
  { path: '/reports/finance/profitability', component: <ReadOnlyBoundary><ProfitabilityReport /></ReadOnlyBoundary> },
  { path: '/reports/finance/operations-closing', component: <ReadOnlyBoundary><OperationsClosingReport /></ReadOnlyBoundary> },
  { path: '/reports/finance/cash-flow', component: <ReadOnlyBoundary><CashFlowReport /></ReadOnlyBoundary> },
  { path: '/reports/finance/supplier-statement', component: <ReadOnlyBoundary><SupplierStatementReport /></ReadOnlyBoundary> },
  { path: '/reports/finance/expenses', component: <ReadOnlyBoundary><ExpensesReport /></ReadOnlyBoundary> },

  //Reports - Sales
  { path: '/reports/sales/overview', component: <ReadOnlyBoundary><SalesReport /></ReadOnlyBoundary> },
  { path: '/reports/sales/clients', component: <ReadOnlyBoundary><ClientsReport /></ReadOnlyBoundary> },

  //Reports - Catalogs, Traceability, Audit
  { path: '/reports/catalogs', component: <ReadOnlyBoundary><CatalogsReport /></ReadOnlyBoundary> },
  { path: '/reports/traceability', component: <ReadOnlyBoundary><GroupTraceabilityReport /></ReadOnlyBoundary> },
  { path: '/reports/audit', component: <ReadOnlyBoundary><AuditReport /></ReadOnlyBoundary> },

  //Configurations
  {
    path: '/configurations/global',
    component: (
      <RoleProtected allowedRoles={['Superadmin']}>
        <GlobalConfiguration />
      </RoleProtected>
    ),
  },
  {
    path: '/configurations/farm',
    component: (
      <RoleProtected allowedRoles={['farm_manager']}>
        <FarmConfiguration />
      </RoleProtected>
    ),
  },


  // User Manual
  { path: "/user-manual", component: <UserManual /> },

  // Subscription
  {
    path: "/subscription",
    component: (
      <RoleProtected allowedRoles={["Superadmin", "farm_manager"]}>
        <SubscriptionDetails />
      </RoleProtected>
    ),
  },

  // this route should be at the end of all other routes
  // eslint-disable-next-line react/display-name
  {
    path: "/",
    exact: true,
    component: <Navigate to="/home" />,
  },
];

const publicRoutes = [
  // Authentication Page
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },

  { path: "/auth-404-alt", component: <Alt404 /> },
  { path: "/auth-offline", component: <Offlinepage /> },

  { path: "*", component: <NotFound /> },
];

export { authProtectedRoutes, publicRoutes };