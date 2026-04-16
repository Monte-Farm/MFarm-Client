/**
 * Endpoints del módulo de Alimentación (post rework feeding-packages).
 *
 * Concatenar con `configContext.apiUrl` (sin slash inicial).
 */

// ───────── Recetas (ex Feeding Packages) ─────────
export const FEEDING_PACKAGE_URLS = {
    findAll: 'feeding_package/find_all',
    findByFarm: (farmId: string) => `feeding_package/find_by_farm/${farmId}`,
    findById: (id: string) => `feeding_package/find_by_id/${id}`,
    findByStage: (farmId: string, stage: string) => `feeding_package/find_by_stage/${farmId}/${stage}`,
    create: 'feeding_package/create',
    update: (id: string) => `feeding_package/update/${id}`,
    nextCode: 'feeding_package/next_feeding_code',
    checkCodeExists: (code: string) => `feeding_package/check_code_exists/${code}`,
    deactivate: (id: string) => `feeding_package/deactivate/${id}`,
    activate: (id: string) => `feeding_package/activate/${id}`,
};

// ───────── Preparaciones de alimento ─────────
export const FEED_PREPARATION_URLS = {
    nextCode: 'feed_preparation/next_code',
    findByFarm: (farmId: string) => `feed_preparation/find_by_farm/${farmId}`,
    findById: (id: string) => `feed_preparation/find_by_id/${id}`,
    findByRecipe: (recipeId: string) => `feed_preparation/find_by_recipe/${recipeId}`,
    create: 'feed_preparation/create',
};

// ───────── Productos preparados (warehouse) ─────────
export const PREPARED_FEED_URLS = {
    byStage: (farmId: string, stage: string) => `warehouse/prepared_feeds_by_stage/${farmId}/${stage}`,
};

// ───────── Administraciones de alimento ─────────
export const FEED_ADMINISTRATION_URLS = {
    nextCode: 'feed_administration/next_code',
    findByFarm: (farmId: string) => `feed_administration/find_by_farm/${farmId}`,
    findById: (id: string) => `feed_administration/find_by_id/${id}`,
    createForGroup: (groupId: string) => `feed_administration/group/${groupId}`,
    createForLitter: (litterId: string) => `feed_administration/litter/${litterId}`,
    createForPig: (pigId: string) => `feed_administration/pig/${pigId}`,
    bulkGroups: 'feed_administration/bulk/groups',
    bulkLitters: 'feed_administration/bulk/litters',
};

// ───────── Lecturas de feeding en pig/group/litter ─────────
export const FEEDING_INFO_URLS = {
    pigFeedingInfo: (pigId: string) => `pig/get_feeding_info/${pigId}`,
    pigFeedingStats: (pigId: string) => `pig/feeding_stats/${pigId}`,
    groupFeedingInfo: (groupId: string) => `group/get_feeding_info/${groupId}`,
    groupFeedingStats: (groupId: string) => `group/feeding_stats/${groupId}`,
    litterFeedingInfo: (litterId: string) => `litter/get_feeding_info/${litterId}`,
    litterFeedingStats: (litterId: string) => `litter/feeding_stats/${litterId}`,
};
