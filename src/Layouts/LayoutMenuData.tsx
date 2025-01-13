import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Navdata = () => {
    const history = useNavigate();

    //state data
    const [isHome, setIsHome] = useState<boolean>(false);
    const [isWarehouse, setIsWarehouse] = useState<boolean>(false);
    const [isSubwarehouse, setIsSubwarehouse] = useState<boolean>(false);

    //Warehouse
    const [isSuppliers, setIsSupplier] = useState<boolean>(false)
    const [isIncomes, setIsIncomes] = useState<boolean>(false)
    const [isOutcomes, setIsOutcomes] = useState<boolean>(false)
    const [isInventory, setIsInventory] = useState<boolean>(false)
    const [isProducts, setIsProducts] = useState<boolean>(false)

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
    }, [
        history,
        iscurrentState,
        isHome,
        isWarehouse,
    ]);

    const menuItems: any = [

        {
            id: "home",
            label: "Home",
            icon: "ri-home-2-line",
            link: "/home",
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState('Home');
            }
        },
        {
            id: "warehouse",
            label: "Almacén General",
            icon: "ri-community-line",
            link: "/#",
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
                            parentId: "incomes"
                        },
                        {
                            id: 2,
                            label: "Ver Entradas",
                            link: "/warehouse/incomes/view_incomes",
                            parentId: "incomes"
                        },
                    ]
                },
                {
                    id: "outcomes",
                    label: "Salidas",
                    link: "/#",
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
                            parentId: "outcomes"
                        },
                        {
                            id: 2,
                            label: "Ver Salidas",
                            link: "/warehouse/outcomes/view_outcomes",
                            parentId: "outcomes"
                        },
                    ]
                },
                {
                    id: "suppliers",
                    label: "Proveedores",
                    link: "/warehouse/suppliers/view_suppliers",
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
                    parentId: "warehouse",
                    click: function (e: any) {
                        e.preventDefault();
                        setIsIncomes(!isProducts);
                    },
                },
            ],
        },
        {
            id: 'subwarehouse',
            label: 'Subalmacénes',
            icon: 'ri-building-3-line',
            link: '/subwarehouse/view_subwarehouse',
            click: function (e: any) {
                e.preventDefault();
                setIsSubwarehouse(!isSubwarehouse);
                setIscurrentState('Subwarehouse');
                updateIconSidebar(e);
            },
        }
    ];
    return <React.Fragment>{menuItems}</React.Fragment>;
};
export default Navdata;