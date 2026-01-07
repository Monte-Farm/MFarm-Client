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

    //Feeding
    const [isFeeding, setIsFeeding] = useState<boolean>(false)
    const [isFeedingPackage, setIsFeedingPackage] = useState<boolean>(false)

    //Lactation
    const [isLactation, setIsLactation] = useState<boolean>(false)
    const [isLitters, setIsLitters] = useState<boolean>(false)


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
        if (iscurrentState !== 'Feeding') {
            setIsFeeding(false)
        }
        if (iscurrentState !== 'Lactation') {
            setIsLactation(false)
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
        isMedication,
        isFeeding,
        isLactation,
    ]);

    const menuItems: any = [

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

        //Opcines de almacen para subwarehouseManager
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
                    id: "viewPigs",
                    label: "Cerdos",
                    link: "/pigs/view_pigs",
                    roles: ['farm_manager', 'general_worker', , 'reproduction_technician', 'veterinarian'],
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
                    roles: ['farm_manager', 'general_worker', , 'reproduction_technician', 'veterinarian'],
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
                    roles: ['farm_manager', 'general_worker', 'reproduction_technician', 'veterinarian'],
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
                {
                    id: "vaccinationPlans",
                    label: "Planes de vacunacion",
                    link: "/medication/view_vaccination_plans",
                    roles: ['farm_manager', 'veterinarian',],
                    parentId: "medication",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsVaccinationPlans(!isVaccinationPlans)
                    },
                    stateVariables: isVaccinationPlans,
                },
            ]
        },
        {
            id: 'feeding',
            label: 'Alimentacion',
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
                    label: "Paquetes de alimentacion",
                    link: "/feeding/view_feeding_packages",
                    roles: ['farm_manager', 'veterinarian',],
                    parentId: "feeding",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsFeedingPackage(!isFeedingPackage)
                    },
                    stateVariables: isFeedingPackage,
                },
            ]
        },

    ];
    return <React.Fragment>{menuItems}</React.Fragment>;
};
export default Navdata;