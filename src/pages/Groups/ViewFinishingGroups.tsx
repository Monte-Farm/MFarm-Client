import { Column } from "common/data/data_types";
import GroupsView from "Components/Common/Views/GroupsView";
import { getAreaColumn, getBaseColumns, getCountColumns, getGeneralStatusColumn, getStageColumn } from "config/groupColumnsConfig";
import { useTranslation } from "react-i18next";

const ViewFinishingGroups = () => {
    const { t } = useTranslation();

    const columns: Column<any>[] = [
        ...getBaseColumns(t),
        { header: t('groups.column.name'), accessor: 'name', type: 'text', isFilterable: true },
        getAreaColumn(t),
        getStageColumn(t),
        { header: t('groups.column.creationDate'), accessor: 'creationDate', type: 'date', isFilterable: true },
        {
            header: t('groups.column.femaleCount'),
            accessor: 'femaleCount',
            type: 'text',
            isFilterable: true,
            bgColor: "#fce4ec"
        },
        {
            header: t('groups.column.maleCount'),
            accessor: 'maleCount',
            type: 'text',
            isFilterable: true,
            bgColor: "#e3f2fd"
        },
        {
            header: t('groups.column.total'),
            accessor: 'pigCount',
            type: 'text',
            isFilterable: true,
            bgColor: "#e8f5e8"
        },
        getGeneralStatusColumn(t),
    ];

    return (
        <GroupsView
            stage="fattening"
            title={t('groups.view.titleGrowing')}
            pageTitle={t('groups.pageTitle.growing')}
            columns={columns}
            statsEndpoint="weaning_stats"
            transferStage="weaning"
        />
    );
}

export default ViewFinishingGroups;
