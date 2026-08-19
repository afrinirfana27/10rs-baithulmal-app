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
import { Plus, Receipt as ReceiptIcon, WhatsappLogo, MagnifyingGlass } from "@phosphor-icons/react";
import { canApprovePayments, isCollector, isStaff, useAuth } from "@/context/AuthContext";
import { generatePdf, downloadPdf, shareWhatsApp } from "@/lib/pdf";

export default function Payments() {
  const { user } = useAuth();
  const canApprove = canApprovePayments(user);
  const canDelete = isStaff(user);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [donor, setDonor] = useState(null);
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(10);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const params = {};
    if (filterFrom) params.date_from = filterFrom;
    if (filterTo) params.date_to = filterTo;
    api.get("/payments", { params }).then(r => { setRows(r.data); setFilteredRows(r.data); }).finally(() => setLoading(false));
  };
  useEffect(load, [filterFrom, filterTo]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredRows(rows);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = rows.filter(p =>
      p.receipt_no?.toLowerCase().includes(lowerQuery) ||
      p.donor?.name?.toLowerCase().includes(lowerQuery) ||
      p.donor?.contact?.includes(query) ||
      p.collected_by_name?.toLowerCase().includes(lowerQuery) ||
      p.status?.toLowerCase().includes(lowerQuery) ||
      p.collection_date?.includes(query)
    );
    setFilteredRows(filtered);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!donor) return toast.error("Select a donor first");
    setSaving(true);
    try {
      const { data } = await api.post("/payments", {
        donor_id: donor.id,
        collection_date: collectionDate,
        amount_per_month: Number(amount),
        note,
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
        heading: "Payment Details",
        columns: ["Collection Date", "Amount"],
        rows: [[p.collection_date || "—", inr(p.total_amount)]],
        total: p.total_amount,
      }],
    });
    downloadPdf(doc, `${p.receipt_no}.pdf`);
  };

  const whatsappShare = (p) => {
    const msg = `10Rs Baithulmal Receipt #${p.receipt_no}\nDonor: ${p.donor.name}\nDate: ${p.collection_date || "—"}\nTotal: ${inr(p.total_amount)}\n*ஜஸாகல்லாஹ் ஹைரன்* 

10ரூபாய் பைத்துல்மாலுக்கு நிதி உதவி செய்த தங்ங்களுக்கும், உங்களுடைய குடும்பத்தார்கள்  மற்றும் முன்னோர்கள் அனைவர்களுக்கும் *அல்லாஹுத்தஆலா* இம்மை,மறுமை ஈருலகத்திலும் வெற்றியை தந்தருள்வானாக...

 உங்ககளுடைய *பொருளாதாரத்தில், வியாபாரத்தில் பரக்கத் செய்வானாக* ...

 ஜென்னத்துல் பிரதௌஸ் என்னும் உயரிய சொர்க்கத்தை உங்களுக்கும், உங்களுடைய மனைவி, பிள்ளைகள், உங்களுடைய உறவினர்கள், சந்ததியினர் மற்றும் முன்னோர்கள் அனைவருக்கும் தந்தருள்வானாக...

 *ஆமீன்*`;
    shareWhatsApp(msg);
  };

  return (
    <div data-testid="payments-page">
      <PageHeader
        title="Payment Collection"
        subtitle="Record donations against a single collection date."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="px-5 py-6 rounded-full btn-accent-copper" data-testid="add-payment-btn">
                <Plus size={16} weight="bold" className="mr-2" /> Collect Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle className="font-serif text-2xl">Collect Payment</DialogTitle></DialogHeader>
              <div className="space-y-5">
                <div>
                  <div className="mb-2 text-xs tracking-widest uppercase text-copper">Step 1 · Find Donor</div>
                  <PersonLookupForm kind="donors" hideOnFound onSaved={setDonor} allowCreate={!isCollector(user)} />
                </div>
                {donor && (
                  <form onSubmit={submit} className="pt-5 space-y-4 border-t border-earth">
                    <div className="text-xs tracking-widest uppercase text-copper">Step 2 · Payment Details</div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label>Collection Date</Label>
                        <Input type="date" required value={collectionDate} onChange={e => setCollectionDate(e.target.value)} data-testid="pay-collection-date" />
                      </div>
                      <div>
                        <Label>₹ Amount</Label>
                        <Input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} data-testid="pay-amount" />
                      </div>
                    </div>
                    <div>
                      <Label>Note (optional)</Label>
                      <Input value={note} onChange={e => setNote(e.target.value)} data-testid="pay-note" />
                    </div>
                    <Button disabled={saving} className="rounded-full btn-primary-moss" data-testid="pay-submit">
                      {saving ? "Saving…" : "Record Payment"}
                    </Button>
                  </form>
                )}
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="card-earth mb-4 p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex gap-2 items-center flex-1">
            <MagnifyingGlass size={18} className="text-[color:var(--text-muted)]" />
            <Input
              placeholder="Search by receipt, donor name, contact, collector..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              data-testid="search-payments"
              className="flex-1"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} data-testid="filter-date-from" />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} data-testid="filter-date-to" />
            </div>
            {(filterFrom || filterTo) && (
              <Button type="button" variant="outline" className="rounded-full mt-5" onClick={() => { setFilterFrom(""); setFilterTo(""); }}>Clear dates</Button>
            )}
          </div>
          {searchQuery && <span className="text-xs text-[color:var(--text-muted)]">Found: {filteredRows.length}</span>}
        </div>
      </div>

      <div className="overflow-x-auto card-earth">
        <Table>
          <TableHeader>
            <TableRow className="bg-sidebar">
              <TableHead>Receipt</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Collection Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Collected by</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-10 text-[color:var(--text-muted)]">Loading…</TableCell></TableRow>
              : filteredRows.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-10 text-[color:var(--text-muted)]">{searchQuery ? "No matching payments." : "No payments yet."}</TableCell></TableRow>
              : filteredRows.map(p => (
                <TableRow key={p.id} data-testid={`payment-row-${p.id}`}>
                  <TableCell className="font-mono text-xs text-copper">{p.receipt_no}</TableCell>
                  <TableCell><div className="font-medium">{p.donor?.name}</div><div className="text-xs text-[color:var(--text-muted)]">{p.donor?.contact}</div></TableCell>
                  <TableCell className="text-sm">{p.collection_date || "—"}</TableCell>
                  <TableCell className="font-semibold">{inr(p.total_amount)}</TableCell>
                  <TableCell className="text-sm">{p.collected_by_name || "—"}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => receipt(p)} data-testid={`pdf-${p.id}`}><ReceiptIcon size={14} weight="duotone" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => whatsappShare(p)} data-testid={`whatsapp-${p.id}`}><WhatsappLogo size={14} weight="duotone" /></Button>
                      {canApprove && p.status === "pending" && (
                        <>
                          <Button size="sm" className="text-xs rounded-full btn-primary-moss" onClick={() => approve(p.id, true)} data-testid={`approve-${p.id}`}>Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => approve(p.id, false)} data-testid={`reject-${p.id}`}>Reject</Button>
                        </>
                      )}
                      {canDelete && (
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => api.delete(`/payments/${p.id}`).then(() => load()).catch(e => toast.error(formatDetail(e.response?.data?.detail)))} data-testid={`delete-payment-${p.id}`}>Delete</Button>
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
