export const CONFIGURATION_URLS = {
    getGlobal: 'configurations/global',
    updateGlobal: 'configurations/global',
    getFarm: (farmId: string) => `configurations/farm/${farmId}`,
    updateFarm: (farmId: string) => `configurations/farm/${farmId}`,
};
