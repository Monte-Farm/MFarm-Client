import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GlobalConfiguration } from 'common/data_interfaces';
import { fetchGlobalConfig } from 'slices/configurations/thunk';

interface UseGlobalConfigResult {
    globalConfig: GlobalConfiguration | null;
    loading: boolean;
}

export const useGlobalConfig = (): UseGlobalConfigResult => {
    const dispatch: any = useDispatch();
    const globalConfig: GlobalConfiguration | null = useSelector((s: any) => s.Configurations.globalConfig);
    const loading: boolean = useSelector((s: any) => s.Configurations.loadingGlobal);

    useEffect(() => {
        if (!globalConfig && !loading) {
            dispatch(fetchGlobalConfig());
        }
    }, [dispatch, globalConfig, loading]);

    return { globalConfig, loading };
};
