import { getEffectiveUser } from "helpers/impersonation_helper";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Navdata = () => {
    const history = useNavigate();
    const { t } = useTranslation();
    const userLogged = getEffectiveUser()

    //state data
    const [isHome, setIsHome] = useState<boolean>(false);
    const [isWarehouse, setIsWarehouse] = useState<boolean>(false);
    const [isSubwarehouse, setIsSubwarehouse] = useState<boolean>(false);
    const [isOrders, setIsOrders] = useState<boolean>(false)
    const [isSubwarehouseInventory, setIsSubwarehouseInventory] = useState<boolean>(false)
    const [isSubwarehouseIncomes, setIsSubwarehouseIncomes] = useState<boolean>(false);
    const [isSubwarehouseOutcomes, setIsSubwarehouseOutcomes] = useState<boolean>(false);

    //Farm
    const [isFarms, setIsFarms] = useState<boolean>(false);

    //Warehouse
    const [isIncomes, setIsIncomes] = useState<boolean>(false)
    const [isOutcomes, setIsOutcomes] = useState<boolean>(false)
    const [isInventory, setIsInventory] = useState<boolean>(false)
    const [isProducts, setIsProducts] = useState<boolean>(false)
    const [isPurchaseOrders, setIsPurchaseOrders] = useState<boolean>(false)

    //Suppliers
    const [isSuppliers, setIsSuppliers] = useState<boolean>(false)

    //Orders
    const [isPendingOrders, setIsPendingOrders] = useState<boolean>(false)

    //Pigs
    const [isPigs, setIsPigs] = useState<boolean>(false)
    const [isViewPigs, setIsViewPigs] = useState<boolean>(false)
    const [isDiscardedPigs, setIsDiscardedPigs] = useState<boolean>(false)
    const [isInventoryPigs, setIsInventoryPigs] = useState<boolean>(false)

    //Reproduction
    const [isReproduction, setIsReproduction] = useState<boolean>(false)
    const [isLaboratory, setIsLaboratory] = useState<boolean>(false)
    const [isGestation, setIsGestation] = useState<boolean>(false)
    const [isBirths, setIsBirths] = useState<boolean>(false)

    //Medication
    const [isMedication, setIsMedication] = useState<boolean>(false)
    const [isMedicationPackage, setIsMedicationPackage] = useState<boolean>(false)

    //Feeding
    const [isFeeding, setIsFeeding] = useState<boolean>(false)
    const [isFeedingPackage, setIsFeedingPackage] = useState<boolean>(false)
    const [isFeedingConsumption, setIsFeedingConsumption] = useState<boolean>(false)

    //Lactation
    const [isLactation, setIsLactation] = useState<boolean>(false)
    const [isLitters, setIsLitters] = useState<boolean>(false)

    //Pre-iniation
    const [isPreinitiation, setIsPreinitiation] = useState<boolean>(false)
    const [isViewWeanedGroups, setIsViewWeanedGroups] = useState<boolean>(false)

    //Growing
    const [isGrowing, setIsGrowing] = useState<boolean>(false)
    const [isViewGrowingGroups, setIsViewGrowingGroups] = useState<boolean>(false)

    //Replacement
    const [isReplacement, setIsReplacement] = useState<boolean>(false);
    const [isSows, setIsSows] = useState<boolean>(false);
    const [isBoars, setIsBoars] = useState<boolean>(false);

    //Expenses
    const [isExpenses, setIsExpenses] = useState<boolean>(false);

    //Period Closing
    const [isPeriodClosing, setIsPeriodClosing] = useState<boolean>(false);

    //Sale
    const [isSale, setIsSale] = useState<boolean>(false);
    const [isPigSales, setIsPigSales] = useState<boolean>(false);

    //Reports
    const [isReports, setIsReports] = useState<boolean>(false);
    const [isProductionReports, setIsProductionReports] = useState<boolean>(false);
    const [isInventoryReports, setIsInventoryReports] = useState<boolean>(false);
    const [isFinanceReports, setIsFinanceReports] = useState<boolean>(false);
    const [isSalesReports, setIsSalesReports] = useState<boolean>(false);

    const [iscurrentState, setIscurrentState] = useState('Home');

    function updateIconSidebar(e: any) {
        if (e && e.target && e.target.getAttribute("sub-items")) {
            const ul: any = document.getElementById("two-column-menu");
            const iconItems: any = ul.querySelectorAll(".nav-icon.active");
            let activeIconItems = [...iconItems];
            activeIconItems.forEach((item) => {
                item.classList.remove("active");
                var id = item.getAttribute("sub-items");
                const getID = document.getElementById(id) as HTMLElement;
                if (getID)
                    getID.classList.remove("show");
            });
        }
    }

    useEffect(() => {
        document.body.classList.remove('twocolumn-panel');
        if (iscurrentState !== 'Home') {
            setIsHome(false);
        }
        if (iscurrentState !== 'Farms') {
            setIsFarms(false);
        }
        if (iscurrentState !== 'Warehouse') {
            setIsWarehouse(false)
        }
        if (iscurrentState !== 'Subwarehouse') {
            setIsSubwarehouse(false)
        }
        if (iscurrentState !== 'Orders') {
            setIsOrders(false)
        }
        if (iscurrentState !== 'SubwarehouseInventory') {
            setIsSubwarehouseInventory(false)
        }
        if (iscurrentState !== 'SubwarehouseIncomes') {
            setIsSubwarehouseIncomes(false)
        }
        if (iscurrentState !== 'SubwarehouseOutcomes') {
            setIsSubwarehouseOutcomes(false)
        }
        if (iscurrentState !== 'PurchaseOrders') {
            setIsPurchaseOrders(false)
        }
        if (iscurrentState !== 'Pigs') {
            setIsPigs(false)
        }
        if (iscurrentState !== 'Reproduction') {
            setIsReproduction(false)
        }
        if (iscurrentState !== 'Medication') {
            setIsMedication(false)
        }
        if (iscurrentState !== 'Feeding') {
            setIsFeeding(false)
        }
        if (iscurrentState !== 'Lactation') {
            setIsLactation(false)
        }
        if (iscurrentState !== 'Pre-initiation') {
            setIsPreinitiation(false)
        }
        if (iscurrentState !== 'Growing') {
            setIsGrowing(false)
        }
        if (iscurrentState !== 'Replacement') {
            setIsReplacement(false)
        }
        if (iscurrentState !== 'Sale') {
            setIsSale(false)
        }
        if (iscurrentState !== 'Reports') {
            setIsReports(false)
        }
    }, [
        history,
        iscurrentState,
        isFarms,
        isHome,
        isWarehouse,
        isOrders,
        isSubwarehouseInventory,
        isSubwarehouseIncomes,
        isSubwarehouseOutcomes,
        isPigs,
        isReproduction,
        isMedication,
        isFeeding,
        isLactation,
        isPreinitiation,
        isGrowing,
        isReplacement,
        isSale,
        isReports,
    ]);

    const menuItems: any = [

        // ===================== INICIO =====================
        {
            id: "home",
            label: t('menu.home'),
            icon: "ri-home-2-line",
            link: "/home",
            roles: ["Superadmin", 'farm_manager', 'warehouse_manager', 'subwarehouse_manager', 'general_worker', 'reproduction_technician', 'veterinarian'],
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState('Home');
            }
        },

        // ===================== ADMINISTRACIÓN =====================
        {
            id: "header-admin",
            label: t('menu.admin'),
            isHeader: true,
            roles: ["Superadmin", 'farm_manager', 'warehouse_manager', 'subwarehouse_manager', 'general_worker'],
        },
        {
            id: "farms",
            label: t('menu.farms'),
            icon: "las la-warehouse",
            link: "/farms/view_farms",
            roles: ["Superadmin"],
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState('Farms');
            }
        },
        {
            id: "warehouse",
            label: t('menu.warehouse'),
            icon: "ri-community-line",
            link: "/#",
            roles: ['farm_manager', 'warehouse_manager'],
            click: function (e: any) {
                e.preventDefault();
                setIsWarehouse(!isWarehouse);
                setIscurrentState('Warehouse');
                updateIconSidebar(e);
            },
            stateVariables: isWarehouse,
            subItems: [
                {
                    id: "inventory",
                    label: t('menu.warehouseInventory'),
                    link: "/warehouse/inventory/view_inventory",
                    roles: ['farm_manager', 'warehouse_manager'],
                    parentId: "warehouse",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsInventory(!isInventory)
                    },
                    stateVariables: isInventory,
                },
                {
                    id: 'purchaseOrders',
                    label: t('menu.purchaseOrders'),
                    icon: 'ri-currency-line',
                    link: '/purchase_orders/view_purchase_orders',
                    roles: ['farm_manager', 'warehouse_manager'],
                    click: function (e: any) {
                        e.preventDefault();
                        setIsPurchaseOrders(!isPurchaseOrders);
                    },
                    stateVariables: isPurchaseOrders,
                },
                {
                    id: "incomes",
                    label: t('menu.incomes'),
                    link: "/warehouse/incomes/view_incomes",
                    roles: ['farm_manager', 'warehouse_manager'],
                    parentId: "warehouse",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsIncomes(!isIncomes);
                    },
                    stateVariables: isIncomes,
                },
                {
                    id: "outcomes",
                    label: t('menu.outcomes'),
                    link: "/warehouse/outcomes/view_outcomes",
                    roles: ['farm_manager', 'warehouse_manager'],
                    parentId: "warehouse",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsOutcomes(!isOutcomes);
                    },
                    stateVariables: isOutcomes,
                },
                {
                    id: 'suppliers',
                    label: t('menu.suppliers'),
                    link: '/warehouse/suppliers/view_suppliers',
                    roles: ['farm_manager', 'warehouse_manager'],
                    parentId: "warehouse",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsSuppliers(!isSuppliers);
                    },
                    stateVariables: isSuppliers,
                },
                {
                    id: "products",
                    label: t('menu.productCatalog'),
                    link: '/warehouse/products/product_catalog',
                    roles: ['farm_manager'],
                    parentId: "warehouse",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsProducts(!isProducts);
                    },
                    stateVariables: isProducts,
                },
            ],
        },
        {
            id: 'subwarehouse',
            label: t('menu.subwarehouses'),
            icon: 'ri-building-3-line',
            link: '/subwarehouse/view_subwarehouse',
            roles: ['farm_manager', 'warehouse_manager'],
            stateVariables: isSubwarehouse,
            click: function (e: any) {
                e.preventDefault();
                setIsSubwarehouse(!isSubwarehouse);
                setIscurrentState('Subwarehouse');
                updateIconSidebar(e);
            },
        },

        // Opciones de almacén para subwarehouse_manager
        {
            id: "subwarehouseInventory",
            label: t('menu.subwarehouseInventory'),
            icon: "ri-community-line",
            link: "/subwarehouse/subwarehouse_inventory",
            roles: ['subwarehouse_manager'],
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState('SubwarehouseInventory');
            }
        },
        {
            id: 'subwarehouseIncomes',
            icon: "ri-inbox-archive-line",
            label: t('menu.subwarehouseIncomes'),
            link: '/subwarehouse/subwarehouse_incomes',
            roles: ['subwarehouse_manager'],
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState('SubwarehouseIncomes')
            },
        },
        {
            id: 'subwarehouseOutcomes',
            icon: "ri-inbox-unarchive-line",
            label: t('menu.subwarehouseOutcomes'),
            link: "/subwarehouse/subwarehouse_outcomes",
            roles: ['subwarehouse_manager'],
            click: function (e: any) {
                e.preventDefault();
                setIsSubwarehouseOutcomes(!isSubwarehouseOutcomes)
                setIscurrentState('SubwarehouseOutcomes')
                updateIconSidebar(e);
            },
        },
        {
            id: 'orders',
            label: t('menu.orders'),
            icon: 'ri-shopping-bag-line',
            link: '/#',
            roles: ['warehouse_manager', 'subwarehouse_manager'],
            click: function (e: any) {
                e.preventDefault();
                setIsOrders(!isOrders)
                setIscurrentState('Orders');
                updateIconSidebar(e);
            },
            stateVariables: isOrders,
            subItems: [
                {
                    id: "pendingOrders",
                    label: userLogged.role.includes('warehouse_manager') ? t('menu.ordersReceived') : t('menu.ordersSent'),
                    link: "/orders/send_orders",
                    roles: ['warehouse_manager', 'subwarehouse_manager'],
                    parentId: "orders",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsPendingOrders(!isPendingOrders)
                    },
                    stateVariables: isPendingOrders,
                },
            ]
        },
        {
            id: 'sale',
            label: t('menu.sales'),
            icon: 'ri-money-dollar-circle-line',
            link: '/#',
            roles: ['farm_manager', 'general_worker',],
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState('Sale')
                setIsSale(!isSale)
                updateIconSidebar(e);
            },
            stateVariables: isSale,
            subItems: [
                {
                    id: "pigSales",
                    label: t('menu.salesRegistered'),
                    link: "/sale/view_pig_sales",
                    roles: ['farm_manager', 'general_worker'],
                    parentId: "sale",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsPigSales(!isPigSales)
                    },
                    stateVariables: isPigSales,
                },
            ]
        },
        {
            id: 'expenses',
            label: t('menu.expenses'),
            icon: 'ri-wallet-3-line',
            link: '/expenses/view_expenses',
            roles: ['farm_manager'],
            stateVariables: isExpenses,
            click: function (e: any) {
                e.preventDefault();
                setIsExpenses(!isExpenses);
                setIscurrentState('Expenses');
                updateIconSidebar(e);
            },
        },
        {
            id: 'periodClosing',
            label: t('menu.periodClosure'),
            icon: 'ri-lock-2-line',
            link: '/finance/period-closing',
            roles: ['Superadmin', 'farm_manager'],
            stateVariables: isPeriodClosing,
            click: function (e: any) {
                e.preventDefault();
                setIsPeriodClosing(!isPeriodClosing);
                setIscurrentState('PeriodClosing');
                updateIconSidebar(e);
            },
        },
        {
            id: 'pigs',
            label: t('menu.pigs'),
            icon: 'bx bxs-dog',
            link: '/#',
            roles: ['farm_manager', 'general_worker', 'reproduction_technician', 'veterinarian'],
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState('Pigs')
                setIsPigs(!isPigs)
                updateIconSidebar(e);
            },
            stateVariables: isPigs,
            subItems: [
                {
                    id: "pigsInventory",
                    label: t('menu.pigsInventory'),
                    link: "/pigs/inventory_pigs",
                    roles: ['farm_manager', 'general_worker', 'reproduction_technician', 'veterinarian'],
                    parentId: "pigs",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsInventoryPigs(!isInventoryPigs)
                    },
                    stateVariables: isInventoryPigs,
                },
                {
                    id: "discardedPigs",
                    label: t('menu.pigsDiscarded'),
                    link: "/pigs/discarded_pigs",
                    roles: ['farm_manager', 'general_worker', 'reproduction_technician', 'veterinarian'],
                    parentId: "pigs",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsDiscardedPigs(!isDiscardedPigs)
                    },
                    stateVariables: isViewPigs,
                },
            ]
        },

        // ===================== OPERACIÓN =====================
        {
            id: "header-operation",
            label: t('menu.operation'),
            isHeader: true,
            roles: ['farm_manager', 'general_worker', 'reproduction_technician', 'veterinarian'],
        },
        {
            id: 'replacement',
            label: t('menu.replacement'),
            icon: 'mdi mdi-cat',
            link: '/#',
            roles: ['farm_manager', 'reproduction_technician', 'general_worker', 'veterinarian',],
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState('Replacement')
                setIsReplacement(!isReplacement)
                updateIconSidebar(e);
            },
            stateVariables: isReplacement,
            subItems: [
                {
                    id: "sows",
                    label: t('menu.replacementSows'),
                    link: "/replacement/view_sows",
                    roles: ['farm_manager', 'reproduction_technician', 'general_worker', 'veterinarian',],
                    parentId: "replacement",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsSows(!isSows)
                    },
                    stateVariables: isSows,
                },
                {
                    id: "boars",
                    label: t('menu.replacementBoars'),
                    link: "/replacement/view_boars",
                    roles: ['farm_manager', 'reproduction_technician', 'general_worker', 'veterinarian',],
                    parentId: "replacement",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsBoars(!isBoars)
                    },
                    stateVariables: isBoars,
                },
            ]
        },
        {
            id: 'reproduction',
            label: t('menu.reproduction'),
            icon: 'bx bx-heart',
            link: '/#',
            roles: ['farm_manager', 'reproduction_technician',],
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState('Reproduction')
                setIsReproduction(!isReproduction)
                updateIconSidebar(e);
            },
            stateVariables: isReproduction,
            subItems: [
                {
                    id: "laboratory",
                    label: t('menu.laboratory'),
                    link: "/#",
                    roles: ['farm_manager', 'reproduction_technician',],
                    parentId: "reproduction",
                    isChildItem: true,
                    click: function (e: any) {
                        e.preventDefault();
                        setIsLaboratory(!isLaboratory)
                    },
                    stateVariables: isLaboratory,
                    childItems: [
                        {
                            id: 1,
                            label: t('menu.labExtractions'),
                            link: "/laboratory/extractions/view_extractions",
                            roles: ['farm_manager', 'reproduction_technician'],
                            parentId: "laboratory"
                        },
                        {
                            id: 2,
                            label: t('menu.labSamples'),
                            link: "/laboratory/samples/view_samples",
                            roles: ['farm_manager', 'reproduction_technician'],
                            parentId: "laboratory"
                        },
                    ]
                },
                {
                    id: "gestation",
                    label: t('menu.gestation'),
                    link: "/#",
                    roles: ['farm_manager', 'reproduction_technician'],
                    parentId: "reproduction",
                    isChildItem: true,
                    click: function (e: any) {
                        e.preventDefault();
                        setIsGestation(!isGestation)
                    },
                    stateVariables: isGestation,
                    childItems: [
                        {
                            id: 1,
                            label: t('menu.gestationInseminations'),
                            link: "/gestation/view_inseminations",
                            roles: ['farm_manager', 'reproduction_technician'],
                            parentId: "laboratory"
                        },
                        {
                            id: 2,
                            label: t('menu.gestationPregnancies'),
                            link: "/gestation/view_pregnancies",
                            roles: ['farm_manager', 'reproduction_technician'],
                            parentId: "laboratory"
                        },
                    ]
                },
                {
                    id: 'births',
                    label: t('menu.births'),
                    link: '/#',
                    roles: ['farm_manager', 'reproduction_technician'],
                    parentId: 'reproduction',
                    isChildItem: true,
                    click: function (e: any) {
                        e.preventDefault();
                        setIsBirths(!isBirths)
                    },
                    stateVariables: isBirths,
                    childItems: [
                        {
                            id: 1,
                            label: t('menu.birthsUpcoming'),
                            link: "/births/view_upcoming_births",
                            roles: ['farm_manager', 'reproduction_technician'],
                            parentId: "births"
                        },
                        {
                            id: 2,
                            label: t('menu.birthsRegistered'),
                            link: "/births/view_births",
                            roles: ['farm_manager', 'reproduction_technician'],
                            parentId: "births"
                        },
                    ]
                }
            ]
        },
        {
            id: 'lactation',
            label: t('menu.lactation'),
            icon: 'mdi mdi-baby-bottle-outline',
            link: '/#',
            roles: ['farm_manager', 'veterinarian', 'general_worker',],
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState('Lactation')
                setIsLactation(!isLactation)
                updateIconSidebar(e);
            },
            stateVariables: isLactation,
            subItems: [
                {
                    id: "litters",
                    label: t('menu.litters'),
                    link: "/lactation/view_litters",
                    roles: ['farm_manager', 'veterinarian', 'general_worker'],
                    parentId: "lactation",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsLitters(!isLitters)
                    },
                    stateVariables: isLitters,
                },
            ]
        },
        {
            id: 'pre-initiation',
            label: t('menu.weaning'),
            icon: 'mdi mdi-baby-carriage',
            link: '/#',
            roles: ['farm_manager', 'veterinarian', 'general_worker',],
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState('Pre-initiation')
                setIsPreinitiation(!isPreinitiation)
                updateIconSidebar(e);
            },
            stateVariables: isPreinitiation,
            subItems: [
                {
                    id: "weanedGroups",
                    label: t('menu.weanedGroups'),
                    link: "/groups/view_weaned_groups",
                    roles: ['farm_manager', 'veterinarian', 'general_worker'],
                    parentId: "initiation",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsViewWeanedGroups(!isViewWeanedGroups)
                    },
                    stateVariables: isViewWeanedGroups,
                },
            ]
        },
        {
            id: 'growing',
            label: t('menu.growthFattening'),
            icon: 'mdi mdi-chart-line-variant',
            link: '/#',
            roles: ['farm_manager', 'general_worker',],
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState('Growing')
                setIsGrowing(!isGrowing)
                updateIconSidebar(e);
            },
            stateVariables: isGrowing,
            subItems: [
                {
                    id: "growingGroups",
                    label: t('menu.growingGroups'),
                    link: "/groups/view_growing_groups",
                    roles: ['farm_manager', 'general_worker'],
                    parentId: "growing",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsViewGrowingGroups(!isViewGrowingGroups)
                    },
                    stateVariables: isViewGrowingGroups,
                },
            ]
        },

        // ===================== SALUD Y NUTRICIÓN =====================
        {
            id: "header-health",
            label: t('menu.healthNutrition'),
            isHeader: true,
            roles: ['farm_manager', 'veterinarian'],
        },
        {
            id: 'medication',
            label: t('menu.medication'),
            icon: 'mdi mdi-heart-pulse',
            link: '/#',
            roles: ['farm_manager', 'veterinarian',],
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState('Medication')
                setIsMedication(!isMedication)
                updateIconSidebar(e);
            },
            stateVariables: isMedication,
            subItems: [
                {
                    id: "medicationPackages",
                    label: t('menu.medicationPackages'),
                    link: "/medication/view_medication_package",
                    roles: ['farm_manager', 'veterinarian',],
                    parentId: "medication",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsMedicationPackage(!isMedicationPackage)
                    },
                    stateVariables: isMedicationPackage,
                },
            ]
        },
        {
            id: 'feeding',
            label: t('menu.feeding'),
            icon: 'ri-plant-line',
            link: '/#',
            roles: ['farm_manager', 'veterinarian',],
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState('Feeding')
                setIsFeeding(!isFeeding)
                updateIconSidebar(e);
            },
            stateVariables: isFeeding,
            subItems: [
                {
                    id: "feedingPackages",
                    label: t('menu.feedingPackages'),
                    link: "/feeding/view_feeding_packages",
                    roles: ['farm_manager', 'veterinarian',],
                    parentId: "feeding",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsFeedingPackage(!isFeedingPackage)
                    },
                    stateVariables: isFeedingPackage,
                },
                {
                    id: "feedPreparations",
                    label: t('menu.feedPreparations'),
                    link: "/feeding/view_feed_preparations",
                    roles: ['farm_manager', 'veterinarian',],
                    parentId: "feeding",
                },
            ]
        },

        // ===================== REPORTES =====================
        {
            id: "header-reports",
            label: t('menu.reports'),
            isHeader: true,
            roles: ["Superadmin", 'farm_manager'],
        },
        {
            id: 'reports',
            label: t('menu.reports'),
            icon: 'ri-bar-chart-box-line',
            link: '/#',
            roles: ['Superadmin', 'farm_manager'],
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState('Reports')
                setIsReports(!isReports)
                updateIconSidebar(e);
            },
            stateVariables: isReports,
            subItems: [
                {
                    id: "productionReports",
                    label: t('menu.productionReports'),
                    link: "/#",
                    roles: ['Superadmin', 'farm_manager'],
                    parentId: "reports",
                    isChildItem: true,
                    click: function (e: any) {
                        e.preventDefault();
                        setIsProductionReports(!isProductionReports)
                    },
                    stateVariables: isProductionReports,
                    childItems: [
                        {
                            id: 1,
                            label: t('menu.inseminationsBirths'),
                            link: "/reports/production/inseminations-births",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "productionReports"
                        },
                        {
                            id: 3,
                            label: t('menu.groups'),
                            link: "/reports/production/groups",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "productionReports"
                        },
                        {
                            id: 4,
                            label: t('menu.mortality'),
                            link: "/reports/production/mortality",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "productionReports"
                        },
                        {
                            id: 5,
                            label: t('menu.feedWeight'),
                            link: "/reports/production/feed-weight",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "productionReports"
                        },
                        {
                            id: 6,
                            label: t('menu.reproductivePerformance'),
                            link: "/reports/production/reproductive",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "productionReports"
                        },
                    ]
                },
                {
                    id: "inventoryReports",
                    label: t('menu.inventoryReports'),
                    link: "/#",
                    roles: ['Superadmin', 'farm_manager', 'warehouse_manager'],
                    parentId: "reports",
                    isChildItem: true,
                    click: function (e: any) {
                        e.preventDefault();
                        setIsInventoryReports(!isInventoryReports)
                    },
                    stateVariables: isInventoryReports,
                    childItems: [
                        {
                            id: 1,
                            label: t('menu.inventoryMovements'),
                            link: "/reports/inventory/movements",
                            roles: ['Superadmin', 'farm_manager', 'warehouse_manager'],
                            parentId: "inventoryReports"
                        },
                        {
                            id: 2,
                            label: t('menu.feedConsumption'),
                            link: "/reports/inventory/feed-consumption",
                            roles: ['Superadmin', 'farm_manager', 'warehouse_manager'],
                            parentId: "inventoryReports"
                        },
                        {
                            id: 3,
                            label: t('menu.inventoryAnalysis'),
                            link: "/reports/inventory/alerts",
                            roles: ['Superadmin', 'farm_manager', 'warehouse_manager'],
                            parentId: "inventoryReports"
                        },
                        {
                            id: 4,
                            label: t('menu.inventoryValuation'),
                            link: "/reports/inventory/valuation",
                            roles: ['Superadmin', 'farm_manager', 'warehouse_manager'],
                            parentId: "inventoryReports"
                        },
                    ]
                },
                {
                    id: "financeReports",
                    label: t('menu.financeReports'),
                    link: "/#",
                    roles: ['Superadmin', 'farm_manager'],
                    parentId: "reports",
                    isChildItem: true,
                    click: function (e: any) {
                        e.preventDefault();
                        setIsFinanceReports(!isFinanceReports)
                    },
                    stateVariables: isFinanceReports,
                    childItems: [
                        {
                            id: 1,
                            label: t('menu.purchasesAndPrices'),
                            link: "/reports/finance/purchases",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "financeReports"
                        },
                        {
                            id: 2,
                            label: t('menu.costAnalysis'),
                            link: "/reports/finance/costs",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "financeReports"
                        },
                        {
                            id: 3,
                            label: t('menu.profitability'),
                            link: "/reports/finance/profitability",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "financeReports"
                        },
                        {
                            id: 4,
                            label: t('menu.incomeStatement'),
                            link: "/reports/finance/operations-closing",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "financeReports"
                        },
                        {
                            id: 5,
                            label: t('menu.cashFlow'),
                            link: "/reports/finance/cash-flow",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "financeReports"
                        },
                        {
                            id: 6,
                            label: t('menu.supplierStatement'),
                            link: "/reports/finance/supplier-statement",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "financeReports"
                        },
                        {
                            id: 7,
                            label: t('menu.operativeExpenses'),
                            link: "/reports/finance/expenses",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "financeReports"
                        },
                    ]
                },
                {
                    id: "salesReports",
                    label: t('menu.salesReports'),
                    link: "/#",
                    roles: ['Superadmin', 'farm_manager'],
                    parentId: "reports",
                    isChildItem: true,
                    click: function (e: any) {
                        e.preventDefault();
                        setIsSalesReports(!isSalesReports)
                    },
                    stateVariables: isSalesReports,
                    childItems: [
                        {
                            id: 1,
                            label: t('menu.salesReport'),
                            link: "/reports/sales/overview",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "salesReports"
                        },
                        {
                            id: 2,
                            label: t('menu.clientAnalysis'),
                            link: "/reports/sales/clients",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "salesReports"
                        },
                    ]
                },
                {
                    id: "catalogsReport",
                    label: t('menu.catalogs'),
                    link: "/reports/catalogs",
                    roles: ['Superadmin', 'farm_manager'],
                    parentId: "reports",
                },
                {
                    id: "traceabilityReport",
                    label: t('menu.traceability'),
                    link: "/reports/traceability",
                    roles: ['Superadmin', 'farm_manager'],
                    parentId: "reports",
                },
                {
                    id: "auditReport",
                    label: t('menu.audit'),
                    link: "/reports/audit",
                    roles: ['Superadmin', 'farm_manager'],
                    parentId: "reports",
                },
            ]
        },

    ];
    return <React.Fragment>{menuItems}</React.Fragment>;
};
export default Navdata;
