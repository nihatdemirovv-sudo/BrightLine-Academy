"use client";

import * as React from "react";
import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function Courses() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Kurslar
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Kurslar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tövsiyə olunan kurslar tezliklə əlavə olunacaq
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <GraduationCap className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Hələ kurs əlavə edilməyib. Tezliklə burada görünəcək.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
