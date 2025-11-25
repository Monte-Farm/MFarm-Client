import { getLoggedinUser } from "helpers/api_helper";
import ViewGroups from "pages/Groups/ViewGroups";
import DiscardedPigs from "pages/Pigs/DiscardedPigs";
import ViewPigs from "pages/Pigs/ViewPigs";
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
    const [isUsers, setIsUsers] = useState<boolean>(false);
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
    const [isWarehouseConfiguration, setIsWarehouseConfiguration] = useState<boolean>(false)

    // Subwarehouese
    const [isViewSubwarehouses, setIsViewSubwarehouses] = useState<boolean>(false)
    const [isCreateSubwarehouseOutcome, setIsCreateSubwarehouseOutcome] = useState<boolean>(false)
    const [isViewSubwarehouseOutcomes, setIsViewSubwarehouseOutcomes] = useState<boolean>(false)

    //Suppliers
    const [isSuppliers, setIsSuppliers] = useState<boolean>(false)
    const [isViewSuppliers, setIsViewSuppliers] = useState<boolean>(false)
    const [isSuppliersConfiguration, setIsSuppliersConfiguration] = useState<boolean>(false)

    //Purchase Orders
    const [isPurchaseOrders, setIsPurchaseOrders] = useState<boolean>(false)
    const [isViewPurchaseOrders, setIsViewPurchaseOrders] = useState<boolean>(false)
    const [isCreatePurchaseOrders, setIsCreatePurchaseOrders] = useState<boolean>(false)

    //Orders
    const [isCreateOrder, setIsCreateOrder] = useState<boolean>(false)
    const [isPendingOrders, setIsPendingOrders] = useState<boolean>(false)
    const [isCompletedOrders, setIsCompletedOrders] = useState<boolean>(false)

    //Users
    const [isViewUsers, setIsViewUsers] = useState<boolean>(false)
    const [isUserConfiguration, setIsUserConfiguration] = useState<boolean>(false)

    //Pigs
    const [isPigs, setIsPigs] = useState<boolean>(false)
    const [isViewPigs, setIsViewPigs] = useState<boolean>(false)
    const [isDiscardedPigs, setIsDiscardedPigs] = useState<boolean>(false)

    //Groups
    const [isViewGroups, setIsViewGroups] = useState<boolean>(false)

    //Reproduction
    const [isReproduction, setIsReproduction] = useState<boolean>(false)
    const [isLaboratory, setIsLaboratory] = useState<boolean>(false)
    const [isExtraction, setIsExtraction] = useState<boolean>(false)
    const [isGestation, setIsGestation] = useState<boolean>(false)
    const [isBirths, setIsBirths] = useState<boolean>(false)

    //Medication
    const [isMedication, setIsMedication] = useState<boolean>(false)
    const [isMedicationPackage, setIsMedicationPackage] = useState<boolean>(false)
    const [isVaccinationPlans, setIsVaccinationPlans] = useState<boolean>(false)

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
        if (iscurrentState !== 'Users') {
            setIsUsers(false);
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
    }, [
        history,
        iscurrentState,
        isFarms,
        isHome,
        isWarehouse,
        isOrders,
        isUsers,
        isSubwarehouseInventory,
        isSubwarehouseIncomes,
        isSubwarehouseOutcomes,
        isPigs,
        isReproduction,
        isMedication
    ]);

    const menuItems: any = [

        {
            id: "home",
            label: "Inicio",
            icon: "ri-home-2-line",
            link: "/home",
            roles: ["Superadmin", 'farm_manager', 'warehouse_manager', 'warehouse_manager'],
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState('Home');
            }
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
                    link: '/#',
                    roles: ['farm_manager', 'warehouse_manager'],
                    isChildItem: true,
                    click: function (e: any) {
                        e.preventDefault();
                        setIsPurchaseOrders(!isPurchaseOrders);
                    },
                    stateVariables: isPurchaseOrders,
                    childItems: [
                        {
                            id: 1,
                            label: 'Crear Orden de Compra',
                            link: '/purchase_orders/create_purchase_order',
                            roles: ['warehouse_manager'],
                            parentId: 'purchaseOrders',
                        },
                        {
                            id: 2,
                            label: 'Ver Ordenes de Compra',
                            link: '/purchase_orders/view_purchase_orders',
                            roles: ['farm_manager', 'warehouse_manager'],
                            parentId: 'purchaseOrders',
                        },
                    ]
                },
                {
                    id: "incomes",
                    label: "Entradas",
                    link: "/#",
                    roles: ['farm_manager', 'warehouse_manager'],
                    parentId: "warehouse",
                    isChildItem: true,
                    click: function (e: any) {
                        e.preventDefault();
                        setIsIncomes(!isIncomes);
                    },
                    stateVariables: isIncomes,
                    childItems: [
                        {
                            id: 1,
                            label: "Nueva Entrada",
                            link: "/warehouse/incomes/create_income",
                            roles: ['warehouse_manager'],
                            parentId: "incomes"
                        },
                        {
                            id: 2,
                            label: "Ver Entradas",
                            link: "/warehouse/incomes/view_incomes",
                            roles: ['farm_manager', 'warehouse_manager'],
                            parentId: "incomes"
                        },
                    ]
                },
                {
                    id: "outcomes",
                    label: "Salidas",
                    link: "/#",
                    roles: ['farm_manager', 'warehouse_manager'],
                    parentId: "warehouse",
                    isChildItem: true,
                    click: function (e: any) {
                        e.preventDefault();
                        setIsOutcomes(!isOutcomes);
                    },
                    stateVariables: isOutcomes,
                    childItems: [
                        {
                            id: 1,
                            label: "Ver Salidas",
                            link: "/warehouse/outcomes/view_outcomes",
                            roles: ['farm_manager', 'warehouse_manager'],
                            parentId: "outcomes"
                        },
                    ]
                },
                {
                    id: 'suppliers',
                    label: 'Proveedores',
                    link: '/#',
                    roles: ['farm_manager', 'warehouse_manager'],
                    parentId: "warehouse",
                    isChildItem: true,
                    click: function (e: any) {
                        e.preventDefault();
                        setIsSuppliers(!isSuppliers);
                    },
                    stateVariables: isSuppliers,
                    childItems: [
                        {
                            id: 1,
                            label: 'Ver Proveedores',
                            link: '/warehouse/suppliers/view_suppliers',
                            roles: ['farm_manager', 'warehouse_manager'],
                            parentId: 'suppliers',
                        },
                    ]
                },
                {
                    id: "products",
                    label: "Catálogo de Productos",
                    link: "#",
                    roles: ['farm_manager'],
                    parentId: "warehouse",
                    isChildItem: true,
                    click: function (e: any) {
                        e.preventDefault();
                        setIsProducts(!isProducts);
                    },
                    stateVariables: isProducts,
                    childItems: [
                        {
                            id: 1,
                            label: 'Ver Productos',
                            link: '/warehouse/products/product_catalog',
                            roles: ['farm_manager', 'warehouse_manager'],
                            parentId: 'products'
                        },
                    ]
                },
            ],
        },
        {
            id: 'subwarehouse',
            label: 'Subalmacén',
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
            subItems: [
                {
                    id: 'viewSubwarehouses',
                    label: 'Ver Subalmacenes',
                    link: '/subwarehouse/view_subwarehouse',
                    roles: ['farm_manager', 'warehouse_manager'],
                    parentId: 'subwarehouse',
                    click: function (e: any) {
                        e.preventDefault();
                        setIsViewSubwarehouses(!isViewSubwarehouses)
                    },
                    stateVariables: isViewSubwarehouses
                },
            ]
        },
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
            link: '#',
            roles: ['subwarehouse_manager'],
            click: function (e: any) {
                e.preventDefault();
                setIsSubwarehouseOutcomes(!isSubwarehouseOutcomes)
                setIscurrentState('SubwarehouseOutcomes')
                updateIconSidebar(e);
            },
            subItems: [
                {
                    id: 'viewSubwarehouseOutcomes',
                    label: "Ver Salidas",
                    link: "/subwarehouse/subwarehouse_outcomes",
                    roles: ['subwarehouse_manager'],
                    parentId: "subwarehouseOutcomes",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsViewSubwarehouseOutcomes(!isViewSubwarehouseOutcomes)
                    },
                    stateVariables: isViewSubwarehouseOutcomes
                },
            ]
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
            subItems: [
                {
                    id: "createOrder",
                    label: "Crear Pedido",
                    link: "/orders/create_order",
                    roles: ['subwarehouse_manager'],
                    parentId: "orders",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsCreateOrder(!isCreateOrder)
                    },
                    stateVariables: isCreateOrder,
                },
                {
                    id: "pendingOrders",
                    label: userLogged.role === 'Encargado de almacen' ? "Pedidos Recibidos" : "Pedidos Enviados",
                    link: "/orders/send_orders",
                    roles: ['warehouse_manager', 'subwarehouse_manager'],
                    parentId: "orders",

                    click: function (e: any) {
                        e.preventDefault();
                        setIsPendingOrders(!isPendingOrders)
                    },
                    stateVariables: isPendingOrders,
                },
                {
                    id: "completedOrders",
                    label: 'Pedidos Completados',
                    link: "/orders/completed_orders",
                    roles: ['warehouse_manager'],
                    parentId: "orders",

                    click: function (e: any) {
                        e.preventDefault();
                        setIsCompletedOrders(!isCompletedOrders)
                    },
                    stateVariables: isCompletedOrders,
                },
            ]
        },
        {
            id: 'users',
            label: 'Usuarios',
            icon: ' ri-user-line',
            link: "/users/view_users",
            roles: ["Superadmin", 'farm_manager'],
            stateVariables: isUsers,
            click: function (e: any) {
                e.preventDefault();
                setIsUsers(!isUsers)
                setIscurrentState('Users');
                updateIconSidebar(e);
            },
        },
        {
            id: 'pigs',
            label: 'Cerdos',
            icon: 'bx bxs-dog',
            link: '/#',
            roles: ['farm_manager', 'warehouse_manager',],
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState('Pigs')
                setIsPigs(!isPigs)
                updateIconSidebar(e);
            },
            stateVariables: isPigs,
            subItems: [
                {
                    id: "viewPigs",
                    label: "Cerdos",
                    link: "/pigs/view_pigs",
                    roles: ['farm_manager', 'warehouse_manager',],
                    parentId: "pigs",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsViewPigs(!isViewPigs)
                    },
                    stateVariables: isViewPigs,
                },
                {
                    id: "viewGroups",
                    label: "Grupos",
                    link: "/groups/view_groups",
                    roles: ['farm_manager', 'warehouse_manager',],
                    parentId: "pigs",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsViewGroups(!isViewGroups)
                    },
                    stateVariables: isViewGroups,
                },
                {
                    id: "discardedPigs",
                    label: "Descartados",
                    link: "/pigs/discarded_pigs",
                    roles: ['farm_manager'],
                    parentId: "pigs",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsDiscardedPigs(!DiscardedPigs)
                    },
                    stateVariables: isViewPigs,
                },
            ]
        },
        {
            id: 'reproduction',
            label: 'Reproducción',
            icon: 'bx bx-heart',
            link: '/#',
            roles: ['farm_manager', 'warehouse_manager',],
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
                    roles: ['farm_manager', 'warehouse_manager',],
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
                            roles: ['farm_manager'],
                            parentId: "laboratory"
                        },
                        {
                            id: 2,
                            label: "Genética líquida",
                            link: "/laboratory/samples/view_samples",
                            roles: ['farm_manager'],
                            parentId: "laboratory"
                        },
                    ]
                },
                {
                    id: "gestation",
                    label: "Gestación",
                    link: "/#",
                    roles: ['farm_manager',],
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
                            roles: ['farm_manager'],
                            parentId: "laboratory"
                        },
                        {
                            id: 2,
                            label: "Embarazos",
                            link: "/gestation/view_pregnancies",
                            roles: ['farm_manager'],
                            parentId: "laboratory"
                        },
                    ]
                },
                {
                    id: 'births',
                    label: 'Partos',
                    link: '/#',
                    roles: ['farm_manager'],
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
                            roles: ['farm_manager'],
                            parentId: "births"
                        },
                        {
                            id: 2,
                            label: "Partos registrados",
                            link: "/births/view_births",
                            roles: ['farm_manager'],
                            parentId: "births"
                        },

                    ]
                }
            ]
        },
        {
            id: 'medication',
            label: 'Medicación',
            icon: 'mdi mdi-heart-pulse',
            link: '/#',
            roles: ['farm_manager', 'warehouse_manager',],
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
                    roles: ['farm_manager', 'warehouse_manager',],
                    parentId: "medication",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsMedicationPackage(!isMedicationPackage)
                    },
                    stateVariables: isMedicationPackage,
                },
                {
                    id: "vaccinationPlans",
                    label: "Planes de vacunacion",
                    link: "/medication/view_vaccination_plans",
                    roles: ['farm_manager', 'warehouse_manager',],
                    parentId: "medication",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsVaccinationPlans(!isVaccinationPlans)
                    },
                    stateVariables: isVaccinationPlans,
                },
            ]
        }
    ];
    return <React.Fragment>{menuItems}</React.Fragment>;
};
export default Navdata;