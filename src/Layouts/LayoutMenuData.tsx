import { getLoggedinUser } from "helpers/api_helper";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Navdata = () => {
    const history = useNavigate();
    const userLogged = getLoggedinUser()

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
            label: "Inicio",
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
            label: "Administración",
            isHeader: true,
            roles: ["Superadmin", 'farm_manager', 'warehouse_manager', 'subwarehouse_manager', 'general_worker'],
        },
        {
            id: "farms",
            label: "Granjas",
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
            label: "Almacén",
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
                    label: "Inventario",
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
                    label: 'Ordenes de Compra',
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
                    label: "Entradas",
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
                    label: "Salidas",
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
                    label: 'Proveedores',
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
                    label: "Catálogo de Productos",
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
            label: 'Subalmacenes',
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
            label: "Inventario",
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
            label: 'Entradas',
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
            label: 'Salidas',
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
            label: 'Pedidos',
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
                    label: userLogged.role.includes('warehouse_manager') ? "Pedidos Recibidos" : "Pedidos Enviados",
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
            label: 'Venta',
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
                    label: "Ventas registradas",
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
            label: 'Gastos',
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

        // ===================== OPERACIÓN =====================
        {
            id: "header-operation",
            label: "Operación",
            isHeader: true,
            roles: ['farm_manager', 'general_worker', 'reproduction_technician', 'veterinarian'],
        },
        {
            id: 'pigs',
            label: 'Cerdos',
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
                    label: "Inventario",
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
                    label: "Descartados",
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
        {
            id: 'replacement',
            label: 'Reemplazo',
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
                    label: "Cerdas",
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
                    label: "Berracos",
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
            label: 'Reproducción',
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
                    label: "Laboratorio",
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
                            label: "Extracciones",
                            link: "/laboratory/extractions/view_extractions",
                            roles: ['farm_manager', 'reproduction_technician'],
                            parentId: "laboratory"
                        },
                        {
                            id: 2,
                            label: "Genética líquida",
                            link: "/laboratory/samples/view_samples",
                            roles: ['farm_manager', 'reproduction_technician'],
                            parentId: "laboratory"
                        },
                    ]
                },
                {
                    id: "gestation",
                    label: "Gestación",
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
                            label: "Inseminaciones",
                            link: "/gestation/view_inseminations",
                            roles: ['farm_manager', 'reproduction_technician'],
                            parentId: "laboratory"
                        },
                        {
                            id: 2,
                            label: "Embarazos",
                            link: "/gestation/view_pregnancies",
                            roles: ['farm_manager', 'reproduction_technician'],
                            parentId: "laboratory"
                        },
                    ]
                },
                {
                    id: 'births',
                    label: 'Partos',
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
                            label: "Proximos partos",
                            link: "/births/view_upcoming_births",
                            roles: ['farm_manager', 'reproduction_technician'],
                            parentId: "births"
                        },
                        {
                            id: 2,
                            label: "Partos registrados",
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
            label: 'Lactancia',
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
                    label: "Camadas",
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
            label: 'Destete',
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
                    label: "Grupos destetados",
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
            label: 'Crecimiento y ceba',
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
                    label: "Grupos en crecimiento",
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
            label: "Salud y Nutrición",
            isHeader: true,
            roles: ['farm_manager', 'veterinarian'],
        },
        {
            id: 'medication',
            label: 'Medicación',
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
                    label: "Paquetes de medicación",
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
            label: 'Alimentación',
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
                    label: "Recetas de alimentación",
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
                    label: "Preparaciones de alimento",
                    link: "/feeding/view_feed_preparations",
                    roles: ['farm_manager', 'veterinarian',],
                    parentId: "feeding",
                },
            ]
        },

        // ===================== REPORTES =====================
        {
            id: "header-reports",
            label: "Reportes",
            isHeader: true,
            roles: ["Superadmin", 'farm_manager'],
        },
        {
            id: 'reports',
            label: 'Reportes',
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
                    label: "Produccion",
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
                            label: "Inseminaciones y Partos",
                            link: "/reports/production/inseminations-births",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "productionReports"
                        },
                        {
                            id: 3,
                            label: "Grupos",
                            link: "/reports/production/groups",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "productionReports"
                        },
                        {
                            id: 4,
                            label: "Mortalidad",
                            link: "/reports/production/mortality",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "productionReports"
                        },
                        {
                            id: 5,
                            label: "Conversion y Peso",
                            link: "/reports/production/feed-weight",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "productionReports"
                        },
                        {
                            id: 6,
                            label: "Rendimiento Reproductivo",
                            link: "/reports/production/reproductive",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "productionReports"
                        },
                    ]
                },
                {
                    id: "inventoryReports",
                    label: "Inventario",
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
                            label: "Movimientos e Inventario",
                            link: "/reports/inventory/movements",
                            roles: ['Superadmin', 'farm_manager', 'warehouse_manager'],
                            parentId: "inventoryReports"
                        },
                        {
                            id: 2,
                            label: "Consumo de Alimento",
                            link: "/reports/inventory/feed-consumption",
                            roles: ['Superadmin', 'farm_manager', 'warehouse_manager'],
                            parentId: "inventoryReports"
                        },
                        {
                            id: 3,
                            label: "Analisis de Inventario",
                            link: "/reports/inventory/alerts",
                            roles: ['Superadmin', 'farm_manager', 'warehouse_manager'],
                            parentId: "inventoryReports"
                        },
                        {
                            id: 4,
                            label: "Valoracion de Inventario",
                            link: "/reports/inventory/valuation",
                            roles: ['Superadmin', 'farm_manager', 'warehouse_manager'],
                            parentId: "inventoryReports"
                        },
                    ]
                },
                {
                    id: "financeReports",
                    label: "Finanzas",
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
                            label: "Compras y Precios",
                            link: "/reports/finance/purchases",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "financeReports"
                        },
                        {
                            id: 2,
                            label: "Analisis de Costos",
                            link: "/reports/finance/costs",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "financeReports"
                        },
                        {
                            id: 3,
                            label: "Rentabilidad",
                            link: "/reports/finance/profitability",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "financeReports"
                        },
                        {
                            id: 4,
                            label: "Cierre de Operacion",
                            link: "/reports/finance/operations-closing",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "financeReports"
                        },
                        {
                            id: 5,
                            label: "Flujo de Caja",
                            link: "/reports/finance/cash-flow",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "financeReports"
                        },
                        {
                            id: 6,
                            label: "Estado de Cuenta Proveedor",
                            link: "/reports/finance/supplier-statement",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "financeReports"
                        },
                        {
                            id: 7,
                            label: "Gastos Operativos",
                            link: "/reports/finance/expenses",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "financeReports"
                        },
                    ]
                },
                {
                    id: "salesReports",
                    label: "Ventas",
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
                            label: "Reporte de Ventas",
                            link: "/reports/sales/overview",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "salesReports"
                        },
                        {
                            id: 2,
                            label: "Analisis de Clientes",
                            link: "/reports/sales/clients",
                            roles: ['Superadmin', 'farm_manager'],
                            parentId: "salesReports"
                        },
                    ]
                },
                {
                    id: "catalogsReport",
                    label: "Catalogos",
                    link: "/reports/catalogs",
                    roles: ['Superadmin', 'farm_manager'],
                    parentId: "reports",
                },
                {
                    id: "traceabilityReport",
                    label: "Trazabilidad",
                    link: "/reports/traceability",
                    roles: ['Superadmin', 'farm_manager'],
                    parentId: "reports",
                },
                {
                    id: "auditReport",
                    label: "Auditoria",
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
