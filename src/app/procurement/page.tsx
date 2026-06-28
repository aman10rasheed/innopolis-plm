"use client";

import { ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ProcurementView } from "@/features/procurement/procurement-view";
import { db } from "@/mock/db";

export default function ProcurementPage() {
  const d = db();

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Procurement"
        description={`${d.rfqs.length} RFQs · ${d.quotations.length} quotations · ${d.purchaseOrders.length} purchase orders`}
        icon={ShoppingCart}
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        <ProcurementView />
      </div>
    </div>
  );
}
