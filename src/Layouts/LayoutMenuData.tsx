import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Navdata = () => {
    const history = useNavigate();

    //state data
    const [isHome, setIsHome] = useState<boolean>(false);
    const [isWarehouse, setIsWarehouse] = useState<boolean>(false);

    //Warehouse
    const [isSuppliers, setIsSupplier] = useState<boolean>(false)
    const [isIncomes, setIsIncomes] = useState<boolean>(false)

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
            label: "Warehouse",
            icon: "ri-building-line",
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
                    label: "Inventory",
                    link: "/warehouse/inventory/view_inventory",
                    parentId: "warehouse",
                },
                {
                    id: "suppliers",
                    label: "Suppliers",
                    link: "/#",
                    parentId: "warehouse",
                    isChildItem: true,
                    click: function (e: any) {
                        e.preventDefault();
                        setIsSupplier(!isSuppliers);
                    },
                    stateVariables: isSuppliers,
                    childItems: [
                        {
                            id: 1,
                            label: "Create Supplier",
                            link: "/warehouse/suppliers/create_supplier",
                            parentId: "suppliers"
                        },
                        {
                            id: 2,
                            label: "View Supplier",
                            link: "/warehouse/suppliers/view_suppliers",
                            parentId: "suppliers"
                        },
                    ]
                },
                {
                    id: "incomes",
                    label: "Incomes",
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
                            label: "Create Incomes",
                            link: "/warehouse/incomes/create_income",
                            parentId: "incomes"
                        },
                        {
                            id: 2,
                            label: "View Incomes",
                            link: "/warehouse/incomes/view_incomes",
                            parentId: "incomes"
                        },
                    ]
                },
            ],
        },
    ];
    return <React.Fragment>{menuItems}</React.Fragment>;
};
export default Navdata;