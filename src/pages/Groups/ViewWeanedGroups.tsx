import { Column } from "common/data/data_types";
import GroupsView from "Components/Common/Views/GroupsView";
import { getBaseColumns, getCountColumns, getWeanedStatusColumn } from "config/groupColumnsConfig";

const ViewWeanedGroups = () => {
    const columns: Column<any>[] = [
        ...getBaseColumns(),
        { header: 'Fecha de creación', accessor: 'creationDate', type: 'date', isFilterable: true },
        ...getCountColumns(),
        getWeanedStatusColumn(),
    ];

    return (
        <GroupsView
            stage="weaning"
            title="Ver grupos destetados"
            pageTitle="Pre-iniciacion"
            columns={columns}
            statsEndpoint="group_alive_stats"
            transferStage="weaning"
        />
    );
};

export default ViewWeanedGroups;