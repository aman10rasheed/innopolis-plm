"use client";

import { ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ProcurementView } from "@/features/procurement/procurement-view";
import { useRfqs, usePurchaseOrders } from "@/lib/api";

export default function ProcurementPage() {
  const rfqCount = useRfqs().data?.meta.total ?? 0;
  const poCount = usePurchaseOrders().data?.meta.total ?? 0;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Procurement"
        description={`${rfqCount} RFQs · ${poCount} purchase orders`}
        icon={ShoppingCart}
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        <ProcurementView />
      </div>
    </div>
  );
}
