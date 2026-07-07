export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto my-6 w-[380px] rounded-[36px] border shadow-xl overflow-hidden bg-background">
      {children}
    </div>
  );
}
