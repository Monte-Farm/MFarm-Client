export const CONFIGURATION_URLS = {
    getGlobal: 'configurations/global',
    updateGlobal: 'configurations/global',
    uploadGlobalLogo: 'configurations/global/logo',
    deleteGlobalLogo: 'configurations/global/logo',
    getFarm: (farmId: string) => `configurations/farm/${farmId}`,
    updateFarm: (farmId: string) => `configurations/farm/${farmId}`,
};
