import {FC, useCallback, useEffect, useState} from "react";

import { IoIosAdd as AddIcon } from "react-icons/io";
import { MdModeEditOutline as EditIcon } from "react-icons/md";
import { MdDelete as DeleteIcon } from "react-icons/md";
import { IoIosSave as SaveIcon } from "react-icons/io";
import { IoCloseSharp as CancelIcon } from "react-icons/io5";

import Button from '@mui/material/Button';

import {
    GridRowId,
    GridColDef,
    DataGrid,
    GridToolbarContainer,
    GridToolbarColumnsButton,
    GridToolbarFilterButton,
    GridToolbarExport,
    GridToolbarDensitySelector,
    GridToolbarQuickFilter,
    GridActionsCellItem,
    GridRowModesModel,
    GridRowModes,
    GridRowsProp,
    GridEventListener,
    GridRowEditStopReasons,
    GridRowModel,
} from '@mui/x-data-grid';

import {fetchSuppliers, fetchSupplierStorages} from "../api/ApiCollection.tsx";
import {Paper} from "@mui/material";

interface Supplier {
    id: number;
    name: string;
    short_name: string;
    address: string;
    account_number: string;
    payment: number;
    trader: string;
    time_road: string;
    time_debit: string;
    currency_parser: string;
    currency_rule: string | null;
    return_range: number;
    is_active: boolean;
    purchasing_operator: number;
    accounting_operator: number;
    is_use_new_category: boolean;
    comment: string;
    real_supplier_id: number | null;
    parent_id: number | null;
};

const paginationModel = { page: 0, size: 20 };

interface EditToolbarProps {
    setList: (newList: (oldList: GridRowsProp) => GridRowsProp) => void;
    setRowModesModel: (
        newModel: (oldModel: GridRowModesModel) => GridRowModesModel,
    ) => void;
}

const EditToolbar: FC<EditToolbarProps> = (props) => {
    const { setList, setRowModesModel } = props;

    const handleClick = () => {
        const id = Math.floor(Math.random() * (9999999999 - 1)) + 1;
        setList((oldList) => [...oldList, { id, name: '', age: '', isNew: true }]);
        setRowModesModel((oldModel) => ({
            ...oldModel,
            [id]: { mode: GridRowModes.Edit, fieldToFocus: 'name' },
        }));
    };

    return (
        <GridToolbarContainer>
            <Button color="primary" startIcon={<AddIcon />} onClick={handleClick}>
                Add Row
            </Button>
        </GridToolbarContainer>
    );
}

interface ToolbarSecondProps extends EditToolbarProps {

}

const ToolbarSecond: FC<ToolbarSecondProps> = (props) => {
    return(
        <GridToolbarContainer>
            <EditToolbar {...props} />
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            <GridToolbarDensitySelector
                slotProps={{ tooltip: { title: 'Change density' } }}
            />
            <GridToolbarExport
                slotProps={{
                    tooltip: { title: 'Export data' },
                    button: { material: { variant: 'outlined' } },
                }}
            />
            <GridToolbarQuickFilter  />
        </GridToolbarContainer>
    )
}

interface Warehouse {
    id: number;
    supplier_id: number;
    name: string;
    region_id: number;
    delivery_days: number;
    time_limit: string;
    delivery_time: string;
    weekend_work: boolean;
    saturday_delivery: boolean;
}

interface TableItemWarehouse extends Warehouse {
    isNew: boolean;
}

interface WarehousePopUpState {
    show: boolean;
    supplierId: string;
}

interface WarehousePopUpProps {
    warehousePopUpState: WarehousePopUpState;
    close: () => void;
}

const WarehousePopUp: FC<WarehousePopUpProps> = (props) => {
    const [list, setList] = useState<TableItemWarehouse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

    const handleEditClick = (id: GridRowId) => () => {
        setRowModesModel({...rowModesModel, [id]: {mode: GridRowModes.Edit}});
    };

    const handleSaveClick = (id: GridRowId) => () => {
        setRowModesModel({...rowModesModel, [id]: {mode: GridRowModes.View}});
    };

    const handleCancelClick = (id: GridRowId) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: {mode: GridRowModes.View, ignoreModifications: true},
        });

        const editedRow = list.find((item) => item.id === id);
        if (editedRow!.isNew) {
            setList(list.filter((item) => item.id !== id));
        }
    };

    const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const handleDeleteClick = (id: GridRowId) => () => {
        setList(list.filter((item) => item.id !== id));
    };

    const processRowUpdate = (newItem: GridRowModel) => {
        const updatedRow: TableItemWarehouse = { ...newItem, isNew: false };
        setList(list.map((item) => (item.id === newItem.id ? updatedRow : item)));
        return updatedRow;
    };

    const columns = [
        {field: 'id', headerName: 'id', width: 100},
        {field: 'supplier_id', headerName: 'supplier_id', width: 100},
        {field: 'name', headerName: 'name', width: 300, editable: true},
        {field: 'region_id', headerName: 'region_id', width: 100},
        {field: 'delivery_days', headerName: 'delivery_days', width: 200, editable: true, type: 'number'},
        {field: 'time_limit', headerName: 'time_limit', width: 200, editable: true, type: 'dateTime'},
        {field: 'delivery_time', headerName: 'delivery_time', width: 200, editable: true, type: 'dateTime'},
        {field: 'weekend_work', headerName: 'weekend_work', width: 300, editable: true, type: 'boolean'},
        {field: 'saturday_delivery', headerName: 'saturday_delivery', width: 300, editable: true, type: 'boolean'},
        {
            type: 'actions',
            headerName: 'Actions',
            width: 100,
            cellClassName: 'actions',
            getActions: ({id}) => {
                const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

                if (isInEditMode) {
                    return [
                        <GridActionsCellItem
                            icon={<SaveIcon/>}
                            label="Save"
                            sx={{
                                color: 'primary.main',
                            }}
                            onClick={handleSaveClick(id)}
                        />,
                        <GridActionsCellItem
                            icon={<CancelIcon/>}
                            label="Cancel"
                            className="textPrimary"
                            color="inherit"
                            onClick={handleCancelClick(id)}
                        />,
                    ];
                }

                return [
                    <GridActionsCellItem
                        icon={<EditIcon/>}
                        label="Edit"
                        className="textPrimary"
                        color="inherit"
                        onClick={handleEditClick(id)}
                    />,
                    <GridActionsCellItem
                        icon={<DeleteIcon/>}
                        label="Delete"
                        color="inherit"
                        onClick={handleDeleteClick(id)}
                    />,
                ];
            },
        }
    ];

    const stopPropagation = useCallback((e) => {
        e.stopPropagation();
    }, []);

    const fetchList = async () => {
        setIsLoading(true);

        if (!props.warehousePopUpState.supplierId) {
            setIsLoading(false);
            return;

        }
        const data = await fetchSupplierStorages(props.warehousePopUpState.supplierId);
        setIsLoading(false);
        setList(data.map((el) => {
            const dateRegex = /^(\d{2}):(\d{2}):(\d{2})$/;

            for (let key in el) {
                if(dateRegex.test(el[key])) {
                    const map = dateRegex.exec(el[key]);

                    if(Array.isArray(map)) {
                        const date = new Date();
                        const hours = parseInt(map[1], 10);
                        const minutes = parseInt(map[2], 10);
                        const seconds = parseInt(map[3], 10);

                        date.setHours(hours, minutes, seconds);

                        el[key] = date;
                    }
                }
            }

            return {
                ...el,
                isNew: false
            }
        }));
    }

    useEffect(() => {
        fetchList();
    }, [props.warehousePopUpState.supplierId]);

    if (!props.warehousePopUpState.show) {
        return null;
    }

    if (!props.warehousePopUpState.supplierId) {
        return (
            <div onClick={props.close} className="fixed left-0 right-0 top-0 bottom-0 bg-[rgba(0,0,0,0.5)]">
                <Paper onClick={stopPropagation}
                       className="z-10 absolute right-0 top-0 bottom-0 w-full lg:w-1/2 pt-[157px] flex flex-col justify-center">
                    <div onClick={props.close}
                         className="absolute top-[112px] right-[16px] rotate-45 text-[45px] cursor-pointer">+
                    </div>
                    <span className="m-auto">Warehouses for supplier does not exist!</span>
                </Paper>
            </div>
        )
    }

    return (
        <div onClick={props.close} className="fixed left-0 right-0 top-0 bottom-0 bg-[rgba(0,0,0,0.5)]">
            <Paper onClick={stopPropagation} className="z-10 absolute right-0 top-0 bottom-0 w-full lg:w-1/2 pt-[157px]">
                <div onClick={props.close}
                     className="absolute top-[112px] right-[16px] rotate-45 text-[45px] cursor-pointer">+
                </div>
                <DataGrid
                    rows={list}
                    columns={columns}
                    initialState={{pagination: {paginationModel}}}
                    pageSizeOptions={[10, 20]}
                    checkboxSelection
                    sx={{border: 0}}
                    loading={isLoading}
                    editMode="row"
                    rowModesModel={rowModesModel}
                    onRowModesModelChange={handleRowModesModelChange}
                    onRowEditStop={handleRowEditStop}
                    processRowUpdate={processRowUpdate}
                    slots={{
                        toolbar: ToolbarSecond
                    }}
                    slotProps={{
                        toolbar: {
                            setList, setRowModesModel
                        }
                    }}
                />
            </Paper>
        </div>
    )
}

const ToolbarMain = () => {
    return(
        <GridToolbarContainer>
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            <GridToolbarDensitySelector
                slotProps={{ tooltip: { title: 'Change density' } }}
            />
            <GridToolbarExport
                slotProps={{
                    tooltip: { title: 'Export data' },
                    button: { material: { variant: 'outlined' } },
                }}
            />
            <GridToolbarQuickFilter  />
        </GridToolbarContainer>
    )
}

const Suppliers = () => {
    const [list, setList] = useState<Supplier[]>([]);
    const [warehousePopUpState, setWarehousePopUpState] = useState<WarehousePopUpState>({ show: false, supplierId: '' });

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'id', width: 100 },
        { field: 'name', headerName: 'name', width: 300 },
        { field: 'short_name', headerName: 'short_name', width: 300 },
        { field: 'address', headerName: 'address', width: 300 },
        { field: 'account_number', headerName: 'account_number', width: 200 },
        { field: 'payment', headerName: 'payment', width: 100 },
        { field: 'trader', headerName: 'trader', width: 300 },
        { field: 'time_road', headerName: 'time_road', width: 100 },
        { field: 'time_debit', headerName: 'time_debit', width: 100 },
        { field: 'currency_parser', headerName: 'currency_parser', width: 100 },
        { field: 'currency_rule', headerName: 'currency_rule', width: 100 },
        { field: 'return_range', headerName: 'return_range', width: 100 },
        { field: 'is_active', headerName: 'is_active', width: 100 },
        { field: 'purchasing_operator', headerName: 'purchasing_operator', width: 100 },
        { field: 'accounting_operator', headerName: 'accounting_operator', width: 100 },
        { field: 'is_use_new_category', headerName: 'is_use_new_category', width: 100 },
        { field: 'comment', headerName: 'comment', width: 100 },
        { field: 'real_supplier_id', headerName: 'real_supplier_id', width: 100 },
        { field: 'parent_id', headerName: 'parent_id', width: 100 },
        {
            field: "action",
            headerName: "Action",
            sortable: false,
            renderCell: (params) => {
                const onClick = (e) => {
                    e.stopPropagation(); // don't select this row after clicking

                    console.log({ params });

                    setWarehousePopUpState({ show: true, supplierId: ''+params.row.id });

                    return;
                };

                return <Button onClick={onClick}>Show More</Button>;
            }
        },
    ];

    const closePopUp = useCallback((e) => {
        setWarehousePopUpState({ show: false, supplierId: '' });
    }, []);

    const fetchList = async () => {
        const data = await fetchSuppliers();
        setList(data);
    }

    useEffect(() => {
        fetchList();
    }, []);

    return(
        <div className="home w-full p-0 m-0">
            <DataGrid
                rows={list}
                columns={columns}
                initialState={{ pagination: { paginationModel }}}
                pageSizeOptions={[10, 20]}
                checkboxSelection
                sx={{ border: 0 }}
                slots={{
                    toolbar: ToolbarMain
                }}
            />
            <WarehousePopUp warehousePopUpState={warehousePopUpState} close={closePopUp} />
        </div>
    )
}

export default Suppliers;