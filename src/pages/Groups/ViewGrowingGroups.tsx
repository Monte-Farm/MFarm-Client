import { Column } from "common/data/data_types";
import GroupsView from "Components/Common/Views/GroupsView";
import { getAreaColumn, getBaseColumns, getCountColumns, getGeneralStatusColumn } from "config/groupColumnsConfig";

const ViewGrowingGroups = () => {
    const columns: Column<any>[] = [
        ...getBaseColumns(),
        { header: 'Nombre', accessor: 'name', type: 'text', isFilterable: true },
        getAreaColumn(),
        { header: 'Fecha de creación', accessor: 'creationDate', type: 'date', isFilterable: true },
        ...getCountColumns(),
        getGeneralStatusColumn(),
    ];

    return (
        <GroupsView
            stage="fattening"
            title="Ver grupos en crecimiento"
            pageTitle="Crecimiento"
            columns={columns}
            statsEndpoint="group_alive_stats"
            transferStage="weaning"
        />
    );
};

export default ViewGrowingGroups;