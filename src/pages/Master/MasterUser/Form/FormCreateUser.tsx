import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import Select from "react-select";
import DatePicker from "../../../../components/form/date-picker";
import Button from "../../../../components/ui/button/Button";
import Checkbox from "../../../../components/form/input/Checkbox";
import { FaEye, FaEyeSlash } from "react-icons/fa";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "number"
  | "file"
  | "date"
  | "checkbox"
  | "password";

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string | boolean; label: string }[];
  validation?: {
    required?: boolean | string;
    [key: string]: unknown;
  };
  info?: string;
  placeholder?: string;
}

export type FormValues = Record<string, unknown>;

export interface UserFormInputProps {
  formFields: FormField[];
  onSubmit: SubmitHandler<FormValues>;
  onClose: () => void;
  defaultValues?: FormValues;
}

/* -------------------------------------------------------------------------- */
/*                              Helper Components                             */
/* -------------------------------------------------------------------------- */

const FormError: React.FC<{ message?: string }> = ({ message }) => (
  <p
    className={`text-sm min-h-[0.4rem] ${
      message ? "text-red-500" : "text-transparent"
    }`}
  >
    {message || ""}
  </p>
);

/** Password field dengan show/hide + indikator cocok */
const PasswordField: React.FC<{
  field: FormField;
  control: any;
  register: ReturnType<typeof useForm>["register"];
  error: string | undefined;
  toggle: (name: string) => void;
  show: boolean;
}> = ({ field, control, register, error, toggle, show }) => {
  const value = useWatch({ control, name: field.name });
  const password = useWatch({ control, name: "password" });
  const isConfirm = field.name === "confirm_password";
  const matched = isConfirm && value && value === password;

  const feedback = (() => {
    if (matched) return { text: "Password cocok", cls: "text-green-600" };
    if (error) return { text: error, cls: "text-red-500" };
    if (isConfirm && value && !matched)
      return { text: "Password belum sama", cls: "text-red-500" };
    if (!isConfirm && value && !error)
      return {
        text: "Great! Your password meets all the requirements.",
        cls: "text-green-600",
      };
    return { text: "", cls: "text-transparent" };
  })();

  return (
    <div className="relative">
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          autoComplete="new-password"
          {...register(field.name, {
            ...field.validation,
            validate: isConfirm
              ? (v: string) => v === password || "Password tidak sama"
              : undefined,
          })}
          className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring ${
            matched
              ? "border-green-500 focus:ring-green-300"
              : error
              ? "border-red-500 focus:ring-red-300"
              : "focus:ring-blue-300"
          }`}
        />
        <button
          type="button"
          onClick={() => toggle(field.name)}
          className="absolute inset-y-0 right-3 flex items-center text-gray-500"
          tabIndex={-1}
        >
          {show ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      <p className={`text-sm mt-1 min-h-[1.25rem] ${feedback.cls}`}>
        {feedback.text || "placeholder"}
      </p>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Main Component                              */
/* -------------------------------------------------------------------------- */

const FormCreateUser: React.FC<UserFormInputProps> = ({
  formFields,
  onSubmit,
  defaultValues,
}) => {
  /* ------------------------------ react-hook-form ----------------------------- */
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setError, //  <-- tambahkan
    clearErrors, //  <-- tambahkan
  } = useForm<FormValues>({ defaultValues, mode: "onChange" });

  /* ---------------------- cek nilai role “TSF” ---------------------- */
  const rolesValue = useWatch({ control, name: "roles" }) as {
    label: string;
    value: string;
  };

  const isTSF = rolesValue?.label === "TSF";
  const isSales = rolesValue?.label === "SALESMAN";
  const isRegional = rolesValue?.label === "REGIONAL";

  /* ------------------------------ local states -------------------------------- */
  const [nikStatus, setNikStatus] = useState<
    "valid" | "invalid" | "checking" | null
  >(null);
  const [showPwdMap, setShowPwdMap] = useState<Record<string, boolean>>({});

  /* ------------------------------ side effects -------------------------------- */
  useEffect(() => {
    if (defaultValues) reset(defaultValues);
  }, [defaultValues, reset]);

  /* -------------------------------- handlers ---------------------------------- */
  const toggleShowPassword = useCallback(
    (name: string) =>
      setShowPwdMap((prev) => ({ ...prev, [name]: !prev[name] })),
    []
  );

  /* -------------------- fungsi checkNik -------------------- */
  const [nikData, setNikData] = useState<any>(null);

  const checkNik = useCallback(
    async (nik: string) => {
      if (!nik) return;
      setNikStatus("checking");

      const url = isSales
        ? `http://10.0.29.47:9003/api/v1/salesman/meta-find-salesrep-number/${nik}`
        : `http://10.0.29.47:9003/api/v1/employee/meta-find-employee-number/${nik}`;

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        const isValid = data?.data?.data?.length > 0;
        setNikStatus(isValid ? "valid" : "invalid");

        if (isValid) {
          const processedData = {
            ...data?.data?.data[0],
            employee_id: Number(data?.data?.data[0]?.employee_id) || null,
            salesrep_id: Number(data?.data?.data[0]?.salesrep_id) || null,
            organization_id:
              Number(data?.data?.data[0]?.organization_id) || null,
            // Tambahkan konversi ID lainnya jika diperlukan
          };
          setNikData(processedData); // Simpan data yang sudah diproses
          clearErrors("nik");
        } else {
          setNikData(null); // Reset state jika tidak valid
          setError("nik", { type: "manual", message: "NIK tidak ditemukan" });
        }
      } catch (e) {
        console.error(e);
        setNikStatus("invalid");
        setNikData(null); // Reset state jika terjadi error
        setError("nik", { type: "manual", message: "Gagal cek NIK" });
      }
    },
    [isSales, clearErrors, setError]
  );

  /* ------------------------------ submit handler ------------------------------ */
  const onSubmitInternal: SubmitHandler<FormValues> = (data) => {
    const payload: any = {
      supervisor_number: data.nik_spv,
      email: data.email,
      name: data.name,
      employee_id: nikData?.salesrep_number || nikData?.employee_id,
      non_employee: data.is_employee ?? false,
      password: data.password,
      is_active: true,
      join_date: new Date().toISOString(),
      valid_from: new Date().toISOString(),
      valid_to: data.valid_to,
      role_id: Number((data.roles as { value: string }).value), // Pastikan role_id adalah number
      role_name: (data.roles as { label: string }).label,
      branch_id: Number((data.branch as { value: string }).value),
      region_code: (data.region as { label: string })?.label || null,
      phone_number: data.phone_number, // Tambahkan phone_number ke payload
      created_by: "Superuser", // Contoh hardcoded
      updated_by: "Superuser", // Contoh hardcoded
    };

    if (isSales) {
      payload.salesman = {
        salesrep_number: nikData?.salesrep_number || null,
        salesrep_name: nikData?.salesrep_name || null,
        employee_name: nikData?.employee_name || null,
        supervisor_number: data.nik_spv,
        salesrep_id: Number(nikData?.salesrep_id) || null,
        sales_credit_type_id: Number(nikData?.sales_credit_type_id) || null,
        subinventory_code: nikData?.subinventory_code || null,
        locator_id: Number(nikData?.locator_id) || null,
        vendor_name: nikData?.vendor_name || null,
        vendor_num: nikData?.vendor_num || null,
        vendor_site_code: nikData?.vendor_site_code || null,
        vendor_id: Number(nikData?.vendor_id) || null,
        vendor_site_id: Number(nikData?.vendor_site_id) || null,
        organization_code: nikData?.organization_code || null,
        organization_name: nikData?.organization_name || null,
        organization_id: Number(nikData?.organization_id) || null,
        org_name: nikData?.org_name || null,
        org_id: Number(nikData?.org_id) || null,
        status: nikData?.status || null,
        start_date_active: nikData?.start_date_active || null,
        end_date_active: nikData?.end_date_active || null,
        created_by: "admin",
        updated_by: "admin",
      };
    } else if (!isTSF) {
      payload.employee = {
        employee_id: nikData?.employee_id || null,
        employee_number: nikData?.employee_number || null,
        employee_name: nikData?.employee_name || null,
        flag_salesman: nikData?.flag_salesman || null,
        supervisor_number: data.nik_spv,
        vendor_name: nikData?.vendor_name || null,
        vendor_num: nikData?.vendor_num || null,
        vendor_site_code: nikData?.vendor_site_code || null,
        vendor_id: Number(nikData?.vendor_id) || null,
        vendor_site_id: Number(nikData?.vendor_site_id) || null,
        effective_start_date: nikData?.effective_start_date || null,
        effective_end_date: nikData?.effective_end_date || null,
        organization_code: nikData?.organization_code || null,
        organization_name: nikData?.organization_name || null,
        organization_id: Number(nikData?.organization_id) || null,
        org_name: nikData?.org_name || null,
        org_id: Number(nikData?.org_id) || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    onSubmit(payload);
  };

  /* ------------------------------ render helpers ------------------------------ */
  const commonClasses =
    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300";
  const errorClasses =
    "w-full px-3 py-2 border rounded-md focus:outline-none ring ring-red-300";
  const getClassName = (hasError: boolean) =>
    hasError ? errorClasses : commonClasses;

  /* ---------- filter field sesuai role (tampilan & logic) ---------- */
  const visibleFields = useMemo(() => {
    if (isTSF) {
      // TSF: hilangkan NIK, tampilkan is_employee & tsf_type, sembunyikan region
      return formFields.filter((f) => !["nik", "region"].includes(f.name));
    }

    if (isRegional) {
      // REGIONAL: tampilkan region, sembunyikan branch, is_employee, dan tsf_type
      return formFields.filter(
        (f) => !["branch", "is_employee", "tsf_type"].includes(f.name)
      );
    }

    // non-TSF dan non-REGIONAL: sembunyikan is_employee & tsf_type, tampilkan NIK
    return formFields.filter(
      (f) => !["is_employee", "tsf_type", "region"].includes(f.name)
    );
  }, [formFields, isTSF, isRegional]);

  const renderField = (field: FormField) => {
    /* ------ kondisi visibilitas per-field ------ */
    if (field.name === "nik" && isTSF) return null;
    if (field.name === "is_employee" && (!isTSF || isRegional)) return null; // Sembunyikan jika bukan TSF atau REGIONAL
    if (field.name === "tsf_type" && (!isTSF || isRegional)) return null; // Sembunyikan jika bukan TSF atau REGIONAL
    if (field.name === "branch" && isRegional) return null; // Sembunyikan branch jika REGIONAL
    if (field.name === "region" && !isRegional) return null; // Sembunyikan region jika bukan REGIONAL

    /* ------ render seperti biasa ------ */
    switch (field.type) {
      case "textarea":
        return (
          <>
            <textarea
              {...register(field.name, field.validation)}
              className={getClassName(!!errors[field.name])}
            />
            <FormError message={(errors[field.name] as any)?.message} />
          </>
        );

      case "select":
        return (
          <>
            <Controller
              name={field.name}
              control={control}
              rules={{
                validate: (v) =>
                  (v !== undefined && v !== null) || field.validation?.required,
              }}
              render={({ field: c }) => (
                <Select
                  {...c}
                  options={field.options}
                  placeholder={ `-- ${field.placeholder} --` || "-- Select an option --"} // Gunakan placeholder dari field
                  classNamePrefix="react-select"
                  value={field.options?.find((o) => o.value === c.value)}
                  onChange={(opt) => c.onChange(opt ?? null)}
                />
              )}
            />
            <FormError message={(errors[field.name] as any)?.message} />
          </>
        );

      case "file":
        return (
          <>
            <input
              type="file"
              {...register(field.name, field.validation)}
              className={getClassName(!!errors[field.name])}
            />
            <FormError message={(errors[field.name] as any)?.message} />
          </>
        );

      case "date":
        return (
          <>
            <Controller
              name={field.name}
              control={control}
              rules={field.validation}
              render={({ field: c }) => (
                <DatePicker
                  id={`${field.name}-date-picker`}
                  placeholder="Select a date"
                  onChange={(d: Date | Date[]) =>
                    c.onChange(Array.isArray(d) ? d[0] : d)
                  }
                />
              )}
            />
            <FormError message={(errors[field.name] as any)?.message} />
          </>
        );

      case "checkbox":
        return (
          <>
            <div className="flex items-center gap-2">
              <Controller
                name={field.name}
                control={control}
                render={({ field: c }) => (
                  <Checkbox
                    checked={!!c.value}
                    onChange={c.onChange}
                    label=""
                  />
                )}
              />
              {field.info && (
                <p className="text-sm text-blue-400 italic">{field.info}</p>
              )}
            </div>
            <FormError message={(errors[field.name] as any)?.message} />
          </>
        );

      case "text":
        /* -------------------- renderField untuk 'nik' -------------------- */
        if (field.name === "nik") {
          /* ambil handler bawaan RHF lebih dulu */
          const {
            ref: nikRef,
            onChange: rhfOnChange,
            ...nikRest
          } = register(field.name, field.validation);

          return (
            <>
              <input
                {...nikRest}
                ref={nikRef}
                type="text"
                className={getClassName(!!errors[field.name])}
                onChange={(e) => {
                  /* simpan ke RHF dulu */
                  rhfOnChange(e);

                  /* kemudian logic lokal */
                  const val = e.target.value.trim();
                  if (val.length >= 12) {
                    checkNik(val);
                  } else {
                    setNikStatus(null);
                    clearErrors("nik"); // hapus error bila panjang < 12
                  }
                }}
              />

              {/* indikator proses / sukses */}
              {nikStatus === "valid" && (
                <p className="text-sm text-green-500">NIK valid</p>
              )}
              {nikStatus === "checking" && (
                <p className="text-sm text-yellow-500">Checking NIK...</p>
              )}

              {/* pesan error resmi dari RHF (manual maupun required) */}
              <FormError message={errors[field.name]?.message} />
            </>
          );
        }
        return (
          <>
            <input
              type="text"
              {...register(field.name, field.validation)}
              className={getClassName(!!errors[field.name])}
            />
            <FormError message={(errors[field.name] as any)?.message} />
          </>
        );

      case "password":
        return (
          <PasswordField
            field={field}
            control={control}
            register={register}
            error={errors[field.name]?.message as string | undefined}
            show={!!showPwdMap[field.name]}
            toggle={toggleShowPassword}
          />
        );

      default:
        return (
          <>
            <input
              type="text"
              {...register(field.name, field.validation)}
              className={getClassName(!!errors[field.name])}
            />
            <FormError message={(errors[field.name] as any)?.message} />
          </>
        );
    }
  };

  /* ------------------------------ layout helpers ------------------------------ */
  const [leftFields, rightFields] = useMemo(() => {
    if (visibleFields.length <= 12) return [visibleFields, []];
    const left = visibleFields.filter((_, index) => index % 2 === 0);
    const right = visibleFields.filter((_, index) => index % 2 !== 0);
    return [left, right];
  }, [visibleFields]);

  /* ---------------------------------- view ----------------------------------- */
  return (
    <div className="mx-auto mt-10 p-6 rounded-md">
      <form onSubmit={handleSubmit(onSubmitInternal)} className="space-y-4">
        <div
          className={`grid ${
            rightFields.length ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          } gap-6`}
        >
          {[leftFields, rightFields].map(
            (col, idx) =>
              col.length > 0 && (
                <div key={idx}>
                  {col.map((field) => (
                    <div key={field.name} className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        {field.label}
                      </label>
                      {renderField(field)}
                    </div>
                  ))}
                </div>
              )
          )}
        </div>

        <div className="flex justify-end gap-2 mt-10">
          {/* <Button variant="outline" onClick={onClose}>Cancel</Button> */}
          <Button variant="primary">Submit Oyyyy</Button>
        </div>
      </form>
    </div>
  );
};

export default FormCreateUser;
