import { Suspense } from "react";
import { BottomNav } from "./BottomNav";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="mx-auto max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(7.5rem+env(safe-area-inset-bottom))]">{children}</main>
      <Suspense>
        <BottomNav />
      </Suspense>
    </>
  );
}
