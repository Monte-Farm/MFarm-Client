export const getDefaultDateRange = () => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
        startDate: monthStart.toISOString().split("T")[0],
        endDate: monthEnd.toISOString().split("T")[0],
    };
};

export const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos dias";
    if (hour < 19) return "Buenas tardes";
    return "Buenas noches";
};

export const resolveDashboardRole = (roles: string[] | undefined): string => {
    if (!roles || roles.length === 0) return "general_worker";
    const priority = [
        "Superadmin",
        "farm_manager",
        "warehouse_manager",
        "subwarehouse_manager",
        "veterinarian",
        "reproduction_technician",
        "general_worker",
    ];
    for (const r of priority) {
        if (roles.includes(r)) return r;
    }
    return roles[0];
};

export const stageLabelsEs: Record<string, string> = {
    lactation: "Lactancia",
    weaning: "Destete",
    growing: "Crecimiento",
    finishing: "Engorda",
    gestation: "Gestacion",
    replacement: "Reemplazo",
    sold: "Vendido",
};

export const movementTypeLabels: Record<string, { label: string; color: string }> = {
    income: { label: "Entrada", color: "success" },
    outcome: { label: "Salida", color: "danger" },
    transfer: { label: "Transferencia", color: "info" },
    adjustment: { label: "Ajuste", color: "warning" },
    entry: { label: "Entrada", color: "success" },
    exit: { label: "Salida", color: "danger" },
    death: { label: "Muerte", color: "dark" },
    sale: { label: "Venta", color: "primary" },
};
