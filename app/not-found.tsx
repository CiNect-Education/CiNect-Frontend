import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="bg-muted mb-4 rounded-full p-4">
        <FileQuestion className="text-muted-foreground h-8 w-8" />
      </div>
      <h2 className="mb-2 text-xl font-bold">Page Not Found</h2>
      <p className="text-muted-foreground mb-6 max-w-md text-sm">
        The page you are looking for does not exist.
      </p>
      <Button asChild>
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  );
}
