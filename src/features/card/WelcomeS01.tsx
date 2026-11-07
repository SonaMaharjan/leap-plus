import { useNavigate } from "react-router-dom";
import { Button } from "../../ui/Button";

export function WelcomeS01() {
  const navigate = useNavigate();
  return (
    <section className="flex min-h-full flex-col px-6 pb-8 pt-12">
      <div className="mx-auto flex h-40 w-64 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-2xl font-bold text-white shadow-md">
        Leap+
      </div>
      <h1 className="mt-10 text-center text-2xl font-bold">Add your Leap card</h1>
      <p className="mt-2 text-center text-sm text-ink-muted">Your card, balance and journeys in one place.</p>
      <div className="mt-auto space-y-3">
        <Button onClick={() => navigate("/scan")}>Scan card</Button>
        <Button variant="secondary" onClick={() => navigate("/enter")}>
          Enter card number
        </Button>
      </div>
    </section>
  );
}
