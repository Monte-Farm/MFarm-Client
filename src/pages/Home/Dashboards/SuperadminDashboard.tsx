import React, { useContext } from "react";
import { ConfigContext } from "App";
import ExecutiveDashboard from "./ExecutiveDashboard";
import GlobalExecutiveDashboard from "./GlobalExecutiveDashboard";

interface Props {
    startDate: string;
    endDate: string;
}

const SuperadminDashboard: React.FC<Props> = ({ startDate, endDate }) => {
    const configContext = useContext(ConfigContext);
    const selectedFarmId = configContext?.superadminFarmId ?? '';

    if (!selectedFarmId) {
        return <GlobalExecutiveDashboard startDate={startDate} endDate={endDate} />;
    }

    return (
        <ExecutiveDashboard
            startDate={startDate}
            endDate={endDate}
            overrideFarmId={selectedFarmId}
        />
    );
};

export default SuperadminDashboard;
