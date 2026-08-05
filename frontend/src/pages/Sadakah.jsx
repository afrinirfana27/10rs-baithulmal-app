import { useEffect, useState } from "react";
import { api, inr, formatDetail } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import PersonLookupForm from "@/components/PersonLookupForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus } from "@phosphor-icons/react";

export default function Sadakah() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [beneficiary, setBeneficiary] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get("/sadakah").then(r => setRows(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!beneficiary) return toast.error("Select a beneficiary");
    setSaving(true);
    try {
      await api.post("/sadakah", { beneficiary_id: beneficiary.id, amount: Number(amount), note });
      toast.success("Sadakah recorded");
      setOpen(false); setBeneficiary(null); setAmount(""); setNote(""); load();
    } catch (e) { toast.error(formatDetail(e.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  return (
    <div data-testid="sadakah-page">
      <PageHeader
        title="Sadakah"
        subtitle="Direct charitable gifts to beneficiaries. Recorded, remembered, rewarded."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="btn-accent-copper rounded-full px-5 py-6" data-testid="add-sadakah-btn">
                <Plus size={16} weight="bold" className="mr-2" /> Give Sadakah
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle className="font-serif text-2xl">Give Sadakah</DialogTitle></DialogHeader>
              <div className="space-y-5">
                <div>
                  <div className="text-xs uppercase tracking-widest text-copper mb-2">Step 1 · Beneficiary</div>
                  <PersonLookupForm kind="beneficiaries" hideOnFound onSaved={setBeneficiary} />
                </div>
                {beneficiary && (
                  <form onSubmit={submit} className="space-y-4 border-t border-earth pt-5">
                    <div>
                      <Label>Amount (₹)</Label>
                      <Input type="number" required min="1" value={amount} onChange={e => setAmount(e.target.value)} data-testid="sadakah-amount" />
                    </div>
                    <div>
                      <Label>Purpose / Note</Label>
                      <Textarea value={note} onChange={e => setNote(e.target.value)} data-testid="sadakah-note" />
                    </div>
                    <Button disabled={saving} className="btn-primary-moss rounded-full" data-testid="sadakah-submit">
                      {saving ? "Saving…" : "Record Sadakah"}
                    </Button>
                  </form>
                )}
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="card-earth overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-sidebar">
              <TableHead>Beneficiary</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="py-10 text-center text-[color:var(--text-muted)]">Loading…</TableCell></TableRow>
              : rows.length === 0 ? <TableRow><TableCell colSpan={4} className="py-10 text-center text-[color:var(--text-muted)]">No sadakah recorded yet.</TableCell></TableRow>
              : rows.map(s => (
                <TableRow key={s.id} data-testid={`sadakah-row-${s.id}`}>
                  <TableCell><div className="font-medium">{s.beneficiary?.name}</div><div className="text-xs text-[color:var(--text-muted)]">{s.beneficiary?.contact}</div></TableCell>
                  <TableCell className="font-semibold text-copper">{inr(s.amount)}</TableCell>
                  <TableCell className="text-sm">{s.note || "—"}</TableCell>
                  <TableCell className="text-xs text-[color:var(--text-muted)]">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
