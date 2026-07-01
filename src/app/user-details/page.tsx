"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, UserCog } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { UserDetailsView } from "@/features/users/user-details-view";

export default function UserDetailsPage() {
  const [userId, setUserId] = React.useState("");

  // Pick up ?u=<userId> from the URL (deep-link from User Management).
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("u");
    if (q) setUserId(q);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="User Details"
        description="View and manage an individual account"
        icon={UserCog}
        breadcrumb={
          <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5 text-muted-foreground">
            <Link href="/users"><ArrowLeft className="size-4" /> User Management</Link>
          </Button>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <UserDetailsView userId={userId} />
      </div>
    </div>
  );
}
