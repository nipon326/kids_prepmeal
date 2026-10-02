import { Suspense } from "react";
import { BottomNav } from "./BottomNav";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="mx-auto max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">{children}</main>
      <Suspense>
        <BottomNav />
      </Suspense>
    </>
  );
}
