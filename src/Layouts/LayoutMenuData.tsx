import { getLoggedinUser } from "helpers/api_helper";
import CreateOrder from "pages/Orders/CreateOrder";
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

    //Warehouse
    const [isSuppliers, setIsSupplier] = useState<boolean>(false)
    const [isIncomes, setIsIncomes] = useState<boolean>(false)
    const [isOutcomes, setIsOutcomes] = useState<boolean>(false)
    const [isInventory, setIsInventory] = useState<boolean>(false)
    const [isProducts, setIsProducts] = useState<boolean>(false)
    const [isWarehouseConfiguration, setIsWarehouseConfiguration] = useState<boolean>(false)

    // Subwarehouese
    const [isViewSubwarehouses, setIsViewSubwarehouses] = useState<boolean>(false)
    const [isSubwarehouseInventory, setIsSubwarehouseInventory] = useState<boolean>(false)
    const [isSubwarehouseIncomes, setIsSubwarehouseIncomes] = useState<boolean>(false);
    const [isSubwarehouseOutcomes, setIsSubwarehouseOutcomes] = useState<boolean>(false);

    //Orders
    const [isCreateOrder, setIsCreateOrder] = useState<boolean>(false)
    const [isPendingOrders, setIsPendingOrders] = useState<boolean>(false)
    const [isCompletedOrders, setIsCompletedOrders] = useState<boolean>(false)

    //Users

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
    }, [
        history,
        iscurrentState,
        isHome,
        isWarehouse,
        isOrders,
        isUsers
    ]);

    const menuItems: any = [

        {
            id: "home",
            label: "Home",
            icon: "ri-home-2-line",
            link: "/home",
            roles: ["Superadmin", 'Encargado de subalmacen', 'Encargado de almacen'],
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState('Home');
            }
        },
        {
            id: "warehouse",
            label: "Almacén",
            icon: "ri-community-line",
            link: "/#",
            roles: ["Superadmin", 'Encargado de almacen'],
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
                    roles: ["Superadmin", 'Encargado de almacen'],
                    parentId: "warehouse",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsInventory(!isInventory)
                    },
                    stateVariables: isInventory,
                },
                {
                    id: "incomes",
                    label: "Entradas",
                    link: "/#",
                    roles: ["Superadmin", 'Encargado de almacen'],
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
                            roles: ["Superadmin", 'Encargado de almacen'],
                            parentId: "incomes"
                        },
                        {
                            id: 2,
                            label: "Ver Entradas",
                            link: "/warehouse/incomes/view_incomes",
                            roles: ["Superadmin", 'Encargado de almacen'],
                            parentId: "incomes"
                        },
                    ]
                },
                {
                    id: "outcomes",
                    label: "Salidas",
                    link: "/#",
                    roles: ["Superadmin", 'Encargado de almacen'],
                    parentId: "warehouse",
                    isChildItem: true,
                    click: function (e: any) {
                        e.preventDefault();
                        setIsIncomes(!isOutcomes);
                    },
                    stateVariables: isOutcomes,
                    childItems: [
                        {
                            id: 1,
                            label: "Nueva Salida",
                            link: "/warehouse/outcomes/create_outcome",
                            roles: ["Superadmin", 'Encargado de almacen'],
                            parentId: "outcomes"
                        },
                        {
                            id: 2,
                            label: "Ver Salidas",
                            link: "/warehouse/outcomes/view_outcomes",
                            roles: ["Superadmin", 'Encargado de almacen'],
                            parentId: "outcomes"
                        },
                    ]
                },
                {
                    id: "suppliers",
                    label: "Proveedores",
                    link: "/warehouse/suppliers/view_suppliers",
                    roles: ["Superadmin", 'Encargado de almacen'],
                    parentId: "warehouse",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsSupplier(!isSuppliers);
                    },
                    stateVariables: isSuppliers,
                },
                {
                    id: "products",
                    label: "Catálogo de Productos",
                    link: "/warehouse/products/product_catalog",
                    roles: ["Superadmin"],
                    parentId: "warehouse",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsIncomes(!isProducts);
                    },
                },
                {
                    id: "configurations",
                    label: "Configuracion",
                    link: "/warehouse/configuration",
                    roles: ["Superadmin"],
                    parentId: "warehouse",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsWarehouseConfiguration(!isWarehouseConfiguration);
                    },
                },
            ],
        },
        {
            id: 'subwarehouse',
            label: 'Subalmacén',
            icon: 'ri-building-3-line',
            link: '/subwarehouse/view_subwarehouse',
            roles: ["Superadmin", 'Encargado de subalmacen'],
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
                    roles: ['Superadmin'],
                    parentId: 'subwarehouse',
                    click: function (e: any) {
                        e.preventDefault();
                        setIsViewSubwarehouses(!isViewSubwarehouses)
                    },
                    stateVariables: isViewSubwarehouses
                },
                {
                    id: 'subwarehouseInventory',
                    label: 'Inventario',
                    link: '/subwarehouse/subwarehouse_inventory',
                    roles: ['Encargado de subalmacen'],
                    parentId: 'subwarehouse',
                    click: function (e: any) {
                        e.preventDefault();
                        setIsSubwarehouseInventory(!isSubwarehouseInventory)
                    },
                    stateVariables: isSubwarehouseInventory
                },
                {
                    id: 'subwarehouseIncomes',
                    label: 'Entradas',
                    link: '/subwarehouse/subwarehouse_incomes',
                    roles: ['Encargado de subalmacen'],
                    parentId: 'subwarehouse',
                    click: function (e: any) {
                        e.preventDefault();
                        setIsSubwarehouseIncomes(!isSubwarehouseIncomes)
                    },
                    stateVariables: isSubwarehouseIncomes
                },
                {
                    id: 'subwarehouseOutcomes',
                    label: 'Salidas',
                    link: '#',
                    roles: ['Encargado de subalmacen'],
                    parentId: 'subwarehouse',
                    isChildItem: true,
                    click: function (e: any) {
                        e.preventDefault();
                        setIsSubwarehouseOutcomes(!isSubwarehouseOutcomes)
                    },
                    stateVariables: isSubwarehouseOutcomes,
                    childItems: [
                        {
                            id: 1,
                            label: "Nueva Salida",
                            link: "/subwarehouse/create_subwarehouse_outcome",
                            roles: ['Encargado de subalmacen'],
                            parentId: "subwarehouseOutcomes"
                        },
                        {
                            id: 2,
                            label: "Ver Salidas",
                            link: "/subwarehouse/subwarehouse_outcomes",
                            roles: ['Encargado de subalmacen'],
                            parentId: "subwarehouseOutcomes"
                        },
                    ]
                }
            ]
        },
        {
            id: 'orders',
            label: 'Pedidos',
            icon: 'ri-shopping-bag-line',
            link: '/#',
            roles: ['Encargado de subalmacen', 'Encargado de almacen'],
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
                    roles: ['Encargado de subalmacen'],
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
                    roles: ["Encargado de subalmacen", 'Encargado de almacen'],
                    parentId: "orders",

                    click: function (e: any) {
                        e.preventDefault();
                        setIsPendingOrders(!isPendingOrders)
                    },
                    stateVariables: isPendingOrders,
                },
                {
                    id: "pendingOrders",
                    label: 'Pedidos Completados',
                    link: "/orders/completed_orders",
                    roles: ['Encargado de almacen'],
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
            link: '/users/view_users',
            roles: ["Superadmin"],
            click: function (e: any) {
                e.preventDefault();
                setIsUsers(!isUsers)
                setIscurrentState('Users');
                updateIconSidebar(e);
            },
        },
    ];
    return <React.Fragment>{menuItems}</React.Fragment>;
};
export default Navdata;