import { auth, signOut } from "@/auth";

export default async function Navbar() {
  const session = await auth();

  if (!session?.user) return null;

  return (
    <nav className="flex items-center justify-between border-b border-[#1e2a45] bg-[#141b2d] px-6 py-3">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-white">GridIron Intel</span>
        <span className="hidden text-sm text-[#8899aa] sm:inline">
          NFL Historical Database
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-[#8899aa]">{session.user.name}</span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="rounded border border-[#2a3a55] px-3 py-1 text-sm text-[#ccc] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
