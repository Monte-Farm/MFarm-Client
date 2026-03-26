import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";

interface UseGroupsByStageOptions {
    stage: string;
    statsEndpoint?: 'group_alive_stats' | 'weaning_stats';
}

export const useGroupsByStage = ({ stage, statsEndpoint = 'group_alive_stats' }: UseGroupsByStageOptions) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, move: false, asign: false, withdraw: false });
    const [groups, setGroups] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [selectedGroup, setSelectedGroup] = useState<any>({});

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);
            const [groupResponse, statsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_stage/${userLogged.farm_assigned}/${stage}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/${statsEndpoint}/${userLogged.farm_assigned}/${stage}`),
            ]);

            const groupsWithId = groupResponse.data.data.map((g: any) => ({ ...g, id: g._id }));
            setGroups(groupsWithId);
            setStats(statsResponse.data.data);
        } catch (error) {
            console.error('Error fetching data:', { error });
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intenelo mas tarde' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [stage]);

    return {
        loading,
        alertConfig,
        setAlertConfig,
        modals,
        toggleModal,
        groups,
        stats,
        selectedGroup,
        setSelectedGroup,
        fetchData
    };
};
