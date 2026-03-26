import { Column } from "common/data/data_types";
import GroupsView from "Components/Common/Views/GroupsView";
import { getAreaColumn, getBaseColumns, getCountColumns, getGeneralStatusColumn, getStageColumn } from "config/groupColumnsConfig";

const ViewFinishingGroups = () => {
    const columns: Column<any>[] = [
        ...getBaseColumns(),
        { header: 'Nombre', accessor: 'name', type: 'text', isFilterable: true },
        getAreaColumn(),
        getStageColumn(),
        { header: 'Fecha de creación', accessor: 'creationDate', type: 'date', isFilterable: true },
        { 
            header: 'No. de hembras', 
            accessor: 'femaleCount', 
            type: 'text', 
            isFilterable: true,
            bgColor: "#fce4ec"
        },
        { 
            header: 'No. de machos', 
            accessor: 'maleCount', 
            type: 'text', 
            isFilterable: true,
            bgColor: "#e3f2fd"
        },
        {
            header: 'Total',
            accessor: 'pigCount',
            type: 'text',
            isFilterable: true,
            bgColor: "#e8f5e8"
        },
        getGeneralStatusColumn(),
    ];

    return (
        <GroupsView
            stage="fattening"
            title="Ver grupos en crecimiento"
            pageTitle="Crecimiento"
            columns={columns}
            statsEndpoint="weaning_stats"
            transferStage="weaning"
        />
    );
}

export default ViewFinishingGroups;