import { DashboardApp } from "@/components/DashboardApp";
import { Toaster } from "sonner";

export default function Home() {
  return (
    <>
      <DashboardApp />
      <Toaster position="top-right" richColors />
    </>
  );
}
