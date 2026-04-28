import React, { useState } from "react";
import { Container } from "reactstrap";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useTranslation } from "react-i18next";
import DashboardHeader from "./DashboardHeader";
import ExecutiveDashboard from "./Dashboards/ExecutiveDashboard";
import WarehouseDashboard from "./Dashboards/WarehouseDashboard";
import SubwarehouseDashboard from "./Dashboards/SubwarehouseDashboard";
import ReproductionDashboard from "./Dashboards/ReproductionDashboard";
import VeterinaryDashboard from "./Dashboards/VeterinaryDashboard";
import WorkerDashboard from "./Dashboards/WorkerDashboard";
import { getDefaultDateRange, resolveDashboardRole } from "./dashboardHelpers";
import SuperadminDashboard from "./Dashboards/SuperadminDashboard";

const Home = () => {
    document.title = "Inicio | Pig System";

    const userLogged = getEffectiveUser();
    const { t } = useTranslation();

    const getRoleLabel = (role: string): string => t(`roles.${role}`, { defaultValue: role });
    const defaults = getDefaultDateRange();
    const [startDate, setStartDate] = useState(defaults.startDate);
    const [endDate, setEndDate] = useState(defaults.endDate);

    const activeRole = resolveDashboardRole(userLogged?.role);
    const userName = userLogged?.name || userLogged?.username || "Usuario";

    const renderDashboard = () => {
        switch (activeRole) {
            case "Superadmin":
                return <SuperadminDashboard startDate={startDate} endDate={endDate} />;
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
