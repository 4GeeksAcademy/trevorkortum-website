import BackofficeNav from "@/components/BackofficeNav";

export default function InventorySectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BackofficeNav />
      <div className="bo-page">{children}</div>
    </>
  );
}
