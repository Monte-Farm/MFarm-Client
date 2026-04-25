import { useContext } from 'react';
import { ConfigContext } from 'App';
import { getEffectiveUser } from 'helpers/impersonation_helper';

export interface ReportScope {
    isGlobal: boolean;
    farmId: string;
    scopeKey: string;
}

export const useReportScope = (): ReportScope => {
    const configContext = useContext(ConfigContext);
    const user = getEffectiveUser();

    const roles: string[] = Array.isArray(user?.role) ? user.role : user?.role ? [user.role] : [];
    const isSuperadmin = roles.includes('Superadmin');
    const impersonating = !!configContext?.impersonation;
    const superadminFarmId = configContext?.superadminFarmId ?? '';

    const isGlobal = isSuperadmin && !impersonating && superadminFarmId === '';
    const farmId = isSuperadmin && !impersonating
        ? superadminFarmId || user?.farm_assigned || ''
        : user?.farm_assigned || '';

    const scopeKey = isGlobal ? 'global' : farmId;

    return { isGlobal, farmId, scopeKey };
};
