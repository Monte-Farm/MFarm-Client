import React, { useState } from "react";
import { Container } from "reactstrap";
import { getLoggedinUser } from "helpers/api_helper";
import { roleLabels } from "common/role_labels";
import { userRoles } from "common/user_roles";
import DashboardHeader from "./DashboardHeader";
import ExecutiveDashboard from "./Dashboards/ExecutiveDashboard";
import WarehouseDashboard from "./Dashboards/WarehouseDashboard";
import SubwarehouseDashboard from "./Dashboards/SubwarehouseDashboard";
import ReproductionDashboard from "./Dashboards/ReproductionDashboard";
import VeterinaryDashboard from "./Dashboards/VeterinaryDashboard";
import WorkerDashboard from "./Dashboards/WorkerDashboard";
import { getDefaultDateRange, resolveDashboardRole } from "./dashboardHelpers";

const getRoleLabel = (role: string): string => {
    if (roleLabels[role]) return roleLabels[role];
    const found = userRoles.find(r => r.value === role);
    return found?.label || role;
};

const Home = () => {
    document.title = "Inicio | Pig System";

    const userLogged = getLoggedinUser();
    const defaults = getDefaultDateRange();
    const [startDate, setStartDate] = useState(defaults.startDate);
    const [endDate, setEndDate] = useState(defaults.endDate);

    const activeRole = resolveDashboardRole(userLogged?.role);
    const userName = userLogged?.name || userLogged?.username || "Usuario";

    const renderDashboard = () => {
        switch (activeRole) {
            case "Superadmin":
            case "farm_manager":
                return <ExecutiveDashboard startDate={startDate} endDate={endDate} />;
            case "warehouse_manager":
                return <WarehouseDashboard startDate={startDate} endDate={endDate} />;
            case "subwarehouse_manager":
                return <SubwarehouseDashboard startDate={startDate} endDate={endDate} />;
            case "reproduction_technician":
                return <ReproductionDashboard startDate={startDate} endDate={endDate} />;
            case "veterinarian":
                return <VeterinaryDashboard startDate={startDate} endDate={endDate} />;
            case "general_worker":
            default:
                return <WorkerDashboard startDate={startDate} endDate={endDate} />;
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <DashboardHeader
                        userName={userName}
                        roleLabel={getRoleLabel(activeRole)}
                        startDate={startDate}
                        endDate={endDate}
                        onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
                    />
                    {renderDashboard()}
                </Container>
            </div>
        </React.Fragment>
    );
};

export default Home;
