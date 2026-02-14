"use client";

// =============================================================
// FILE: src/app/(main)/admin/(admin)/availability/admin-availability-detail-client.tsx
// guezelwebdesign — Admin Availability Detail (Resource + Weekly + Daily)
// FINAL — App Router client
// =============================================================

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { AvailabilityResourceValues } from "@/integrations/shared";
import { isUuidLike } from "@/integrations/shared";
import {
  useCreateResourceAdminMutation,
  useGetResourceAdminQuery,
  useUpdateResourceAdminMutation,
} from "@/integrations/hooks";

import { AvailabilityForm } from "./availability-form";
import { getApiErrorMessage } from "./availability-utils";

export default function AdminAvailabilityDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const safeId = String(id ?? "").trim();
  const isNew = safeId === "new";
  const isValidId = isUuidLike(safeId);

  const getQ = useGetResourceAdminQuery(safeId, {
    skip: isNew || !isValidId,
    refetchOnMountOrArgChange: true,
  });

  const [createResource, createState] = useCreateResourceAdminMutation();
  const [updateResource, updateState] = useUpdateResourceAdminMutation();

  const loading = getQ.isLoading || getQ.isFetching;
  const saving = createState.isLoading || updateState.isLoading;

  React.useEffect(() => {
    if (!isNew && !isValidId) {
      toast.error("Geçersiz kaynak id.");
    }
  }, [isNew, isValidId]);

  const handleSubmit = async (values: AvailabilityResourceValues) => {
    try {
      if (isNew) {
        const created = await createResource(values).unwrap();
        const newId = String(created?.id ?? "").trim();
        toast.success("Kaynak oluşturuldu.");
        if (isUuidLike(newId)) {
          router.replace(`/admin/availability/${encodeURIComponent(newId)}`);
        } else {
          router.replace("/admin/availability");
        }
        return;
      }

      await updateResource({ id: safeId, patch: values }).unwrap();
      toast.success("Kaynak güncellendi.");
      await getQ.refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (!isNew && !isValidId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Geçersiz Kaynak</CardTitle>
          <CardDescription>Gelen id geçersiz. Lütfen listeye dön.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => router.push("/admin/availability")}>
            Listeye Dön
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isNew && getQ.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kaynak Bulunamadı</CardTitle>
          <CardDescription>Bu kaynağa erişilemedi veya silinmiş olabilir.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => router.push("/admin/availability")}>
            Listeye Dön
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <AvailabilityForm
        mode={isNew ? "create" : "edit"}
        initialData={isNew ? undefined : getQ.data}
        loading={loading}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/admin/availability")}
      />
    </div>
  );
}
