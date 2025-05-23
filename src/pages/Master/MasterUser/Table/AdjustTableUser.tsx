import React, { useMemo } from "react";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../../../../components/tables/MasterDataTable/TableComponent";
import { usePagePermissions } from "../../../../utils/UserPermission/UserPagePermissions";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  branch: string;
  created_on: string;
  nik: string;
  nik_spv: string;
  is_active: string;
  valid_to: string;
};

type MenuTableProps = {
  data: User[];
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  onDetail: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit?: (data: User) => void;
};

const MenuTable = ({
  data,
  globalFilter,
  setGlobalFilter,
  onDetail,
  onDelete,
  onEdit,
}: MenuTableProps) => {
  const { canUpdate, canDelete } = usePagePermissions();

  const columns: ColumnDef<User>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: (info) => String(info.getValue()),
      },
      {
        accessorKey: "nik",
        header: "NIK",
        cell: (info) => String(info.getValue()),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: (info) => String(info.getValue()),
      },
      {
        accessorKey: "branch",
        header: "Branch",
        cell: (info) => String(info.getValue()),
      },
      {
        accessorKey: "region_code",
        header: "Region",
        cell: (info) => String(info.getValue()),
      },
      {
        accessorKey: "created_on",
        header: "Created On",
        cell: (info) => String(info.getValue()),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="space-x-4">
            <button
              className="text-green-600"
              onClick={() => onDetail(row.original.id)}
            >
              <FaEye />
            </button>
          </div>
        ),
      },
    ],
    [onDelete, onDetail, canUpdate, canDelete, onEdit]
  );

  return (
    <TableComponent
      data={data}
      columns={columns}
      globalFilter={globalFilter}
      setGlobalFilter={setGlobalFilter}
      onDetail={onDetail}
    />
  );
};

export default MenuTable;
