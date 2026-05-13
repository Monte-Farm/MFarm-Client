import { TFunction } from "i18next";

export interface IncomeApprovalErrorResult {
    message: string;
    missing?: Array<{ id: string; required: number; available: number }>;
}

export const getApprovalErrorMessage = (
    error: any,
    action: 'approve' | 'release',
    t: TFunction
): string => {
    const status = error?.response?.status;
    const fallbackKey = action === 'approve' ? 'finance.income.error.approve' : 'finance.income.error.release';

    if (status === 403) return t('finance.income.error.forbidden');
    if (status === 404) return t('finance.income.error.notFound');
    if (status === 400) {
        return action === 'approve'
            ? t('finance.income.error.alreadyApproved')
            : t('finance.income.error.notApproved');
    }
    return t(fallbackKey);
};

export const getUpdateErrorResult = (
    error: any,
    t: TFunction
): IncomeApprovalErrorResult => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 403) return { message: t('finance.income.error.forbidden') };
    if (status === 404) return { message: t('finance.income.error.notFound') };
    if (status === 400) {
        if (Array.isArray(data?.missing) && data.missing.length > 0) {
            return {
                message: t('finance.income.error.insufficientStock'),
                missing: data.missing,
            };
        }
        return { message: data?.message || t('finance.income.error.update') };
    }
    return { message: t('finance.income.error.update') };
};
