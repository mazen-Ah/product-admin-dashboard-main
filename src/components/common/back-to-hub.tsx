import { Button } from "@/components/tailgrids/core/button";
import Link from "next/link";

export function BackToHub({ projectId }: { projectId: string }) {
  return (
    <Link href={`/projects/${projectId}`}>
      <Button appearance="ghost" size="sm">
        لوحة المشروع
      </Button>
    </Link>
  );
}
