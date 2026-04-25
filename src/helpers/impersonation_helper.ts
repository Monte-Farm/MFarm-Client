import { getLoggedinUser } from './api_helper';

export interface ImpersonationData {
    farm_id: string;
    farm_name: string;
    effective_role: 'farm_manager';
}

const IMPERSONATION_KEY = 'impersonation';
const SUPERADMIN_FARM_KEY = 'superadmin_farm_id';

export const getImpersonation = (): ImpersonationData | null => {
    const raw = sessionStorage.getItem(IMPERSONATION_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

export const startImpersonation = (data: ImpersonationData): void => {
    sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('impersonation-change'));
};

export const stopImpersonation = (): void => {
    sessionStorage.removeItem(IMPERSONATION_KEY);
    window.dispatchEvent(new Event('impersonation-change'));
};

export const isImpersonating = (): boolean => {
    return getImpersonation() !== null;
};

export const getSuperadminFarmId = (): string => {
    return sessionStorage.getItem(SUPERADMIN_FARM_KEY) ?? '';
};

export const setSuperadminFarmIdStorage = (id: string): void => {
    if (id) {
        sessionStorage.setItem(SUPERADMIN_FARM_KEY, id);
    } else {
        sessionStorage.removeItem(SUPERADMIN_FARM_KEY);
    }
    window.dispatchEvent(new Event('impersonation-change'));
};

export const getEffectiveUser = (): any => {
    const user = getLoggedinUser();
    if (!user) return null;
    const imp = getImpersonation();
    if (imp) {
        return {
            ...user,
            farm_assigned: imp.farm_id,
            farm_name: imp.farm_name,
            role: [imp.effective_role],
        };
    }
    const superadminFarmId = getSuperadminFarmId();
    if (superadminFarmId) {
        return {
            ...user,
            farm_assigned: superadminFarmId,
        };
    }
    return user;
};
