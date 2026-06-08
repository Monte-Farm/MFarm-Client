import { SubscriptionStatus } from "common/data_interfaces";

let currentStatus: SubscriptionStatus | null = null;

export const setSubscriptionStatus = (status: SubscriptionStatus | null) => {
    currentStatus = status;
};

export const getSubscriptionStatus = (): SubscriptionStatus | null => currentStatus;

export const isSubscriptionReadOnly = (): boolean => currentStatus === "expired";

export const isSubscriptionSuspended = (): boolean => currentStatus === "suspended";
