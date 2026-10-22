import { ButtonLink } from "@/components/ui/Button";

export default function Forbidden() {
  return (
    <main id="main" className="mx-auto grid max-w-xl gap-4 px-4 py-24">
      <h1 className="text-3xl">You don’t have access to this page</h1>
      <p>Your role doesn’t include this part of the admin. Ask a Super Admin if you need it.</p>
      <div>
        <ButtonLink href="/admin">Back to the admin home</ButtonLink>
      </div>
    </main>
  );
}
