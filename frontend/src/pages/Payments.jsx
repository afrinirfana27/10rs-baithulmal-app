import { useEffect, useState } from "react";
import { api, inr, formatDetail } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import PersonLookupForm from "@/components/PersonLookupForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";
import { Plus, Receipt as ReceiptIcon, WhatsappLogo } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { generatePdf, downloadPdf, shareWhatsApp } from "@/lib/pdf";

export default function Payments() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [donor, setDonor] = useState(null);
  const [monthFrom, setMonthFrom] = useState(new Date().toISOString().slice(0, 7));
  const [monthTo, setMonthTo] = useState(new Date().toISOString().slice(0, 7));
  const [amount, setAmount] = useState(10);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get("/payments").then(r => setRows(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!donor) return toast.error("Select a donor first");
    setSaving(true);
    try {
      const { data } = await api.post("/payments", {
        donor_id: donor.id, month_from: monthFrom, month_to: monthTo,
        amount_per_month: Number(amount), note,
      });
      toast.success(`Receipt ${data.receipt_no} · ${inr(data.total_amount)}`);
      setOpen(false); setDonor(null); setNote(""); load();
    } catch (e) { toast.error(formatDetail(e.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  const approve = async (id, ok) => {
    try {
      await api.post(`/payments/${id}/approve`, { approve: ok, note: "" });
      toast.success(ok ? "Approved" : "Rejected");
      load();
    } catch (e) { toast.error(formatDetail(e.response?.data?.detail)); }
  };

  const receipt = (p) => {
    const doc = generatePdf({
      title: `Donation Receipt · ${p.receipt_no}`,
      subtitle: `Donor: ${p.donor.name} (${p.donor.serial}) · ${p.donor.contact}`,
      sections: [{
        heading: "Payment Breakdown",
        columns: ["Month", "Amount"],
        rows: p.months.map(m => [m, inr(p.amount_per_month)]),
        total: p.total_amount,
      }],
    });
    downloadPdf(doc, `${p.receipt_no}.pdf`);
  };

  const whatsappShare = (p) => {
    const msg = `10Rs Baithulmal Receipt #${p.receipt_no}\nDonor: ${p.donor.name}\nMonths: ${p.month_from} to ${p.month_to}\nTotal: ${inr(p.total_amount)}\nJazakumullah Khairan.`;
    shareWhatsApp(msg);
  };

  return (
    <div data-testid="payments-page">
      <PageHeader
        title="Payment Collection"
        subtitle="Record monthly ₹10 contributions from donors. Choose a month range and add a note."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="btn-accent-copper rounded-full px-5 py-6" data-testid="add-payment-btn">
                <Plus size={16} weight="bold" className="mr-2" /> Collect Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle className="font-serif text-2xl">Collect Payment</DialogTitle></DialogHeader>
              <div className="space-y-5">
                <div>
                  <div className="text-xs uppercase tracking-widest text-copper mb-2">Step 1 · Find Donor</div>
                  <PersonLookupForm kind="donors" hideOnFound onSaved={setDonor} />
                </div>
                {donor && (
                  <form onSubmit={submit} className="space-y-4 border-t border-earth pt-5">
                    <div className="text-xs uppercase tracking-widest text-copper">Step 2 · Payment Details</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Month From</Label>
                        <Input type="month" value={monthFrom} onChange={e => setMonthFrom(e.target.value)} data-testid="pay-from" />
                      </div>
                      <div>
                        <Label>Month To</Label>
                        <Input type="month" value={monthTo} onChange={e => setMonthTo(e.target.value)} data-testid="pay-to" />
                      </div>
                      <div>
                        <Label>₹ per month</Label>
                        <Input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} data-testid="pay-amount" />
                      </div>
                    </div>
                    <div>
                      <Label>Note (optional)</Label>
                      <Input value={note} onChange={e => setNote(e.target.value)} data-testid="pay-note" />
                    </div>
                    <Button disabled={saving} className="btn-primary-moss rounded-full" data-testid="pay-submit">
                      {saving ? "Saving…" : "Record Payment"}
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
              <TableHead>Receipt</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Months</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Collected by</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-10 text-[color:var(--text-muted)]">Loading…</TableCell></TableRow>
              : rows.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-10 text-[color:var(--text-muted)]">No payments yet.</TableCell></TableRow>
              : rows.map(p => (
                <TableRow key={p.id} data-testid={`payment-row-${p.id}`}>
                  <TableCell className="font-mono text-xs text-copper">{p.receipt_no}</TableCell>
                  <TableCell><div className="font-medium">{p.donor?.name}</div><div className="text-xs text-[color:var(--text-muted)]">{p.donor?.contact}</div></TableCell>
                  <TableCell className="text-sm">{p.month_from} → {p.month_to} <span className="text-[color:var(--text-muted)]">({p.months.length})</span></TableCell>
                  <TableCell className="font-semibold">{inr(p.total_amount)}</TableCell>
                  <TableCell className="text-sm">{p.collected_by_name || "—"}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => receipt(p)} data-testid={`pdf-${p.id}`}><ReceiptIcon size={14} weight="duotone" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => whatsappShare(p)} data-testid={`whatsapp-${p.id}`}><WhatsappLogo size={14} weight="duotone" /></Button>
                      {isAdmin && p.status === "pending" && (
                        <>
                          <Button size="sm" className="btn-primary-moss rounded-full text-xs" onClick={() => approve(p.id, true)} data-testid={`approve-${p.id}`}>Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => approve(p.id, false)} data-testid={`reject-${p.id}`}>Reject</Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
