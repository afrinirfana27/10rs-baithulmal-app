import { useEffect, useState } from "react";
import { api, inr, formatDetail } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import PersonLookupForm from "@/components/PersonLookupForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";
import { Plus, MagnifyingGlass } from "@phosphor-icons/react";
import { isStaff, useAuth } from "@/context/AuthContext";

const CATEGORIES = ["Medical", "Education", "Economic"];

export default function Kadan({ variant }) {
  const { user } = useAuth();
  const isAdmin = isStaff(user);
  const isVatti = variant === "vattiyilla";
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [beneficiary, setBeneficiary] = useState(null);
  const [category, setCategory] = useState("Medical");
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState(isVatti ? 3 : 6);
  const [area, setArea] = useState("");
  const [notes, setNotes] = useState("");
  const [security, setSecurity] = useState({ name: "", father_name: "", address: "", contact: "" });
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const [repayAmt, setRepayAmt] = useState("");

  const load = () => {
    setLoading(true);
    api.get("/loans", { params: { kadan_type: isVatti ? "vattiyilla" : "kadan" } })
      .then(r => { setRows(r.data); setFilteredRows(r.data); }).finally(() => setLoading(false));
  };
  useEffect(load, [isVatti]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredRows(rows);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = rows.filter(l =>
      l.beneficiary?.name?.toLowerCase().includes(lowerQuery) ||
      l.beneficiary?.contact?.includes(query) ||
      l.category?.toLowerCase().includes(lowerQuery) ||
      l.status?.toLowerCase().includes(lowerQuery)
    );
    setFilteredRows(filtered);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!beneficiary) return toast.error("Select a beneficiary");
    if (!security.name || !security.contact) return toast.error("Fill security details");
    setSaving(true);
    try {
      await api.post("/loans", {
        beneficiary_id: beneficiary.id,
        kadan_type: isVatti ? "vattiyilla" : "kadan",
        category, amount: Number(amount), repayment_months: Number(months),
        area, security, notes,
      });
      toast.success("Loan created");
      setOpen(false); load();
      setBeneficiary(null); setAmount(""); setNotes(""); setSecurity({ name: "", father_name: "", address: "", contact: "" });
    } catch (e) { toast.error(formatDetail(e.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  const repay = async () => {
    if (!repayAmt) return;
    try {
      const { data } = await api.post(`/loans/${detail.id}/repay`, { amount: Number(repayAmt) });
      setDetail(data);
      setRepayAmt("");
      toast.success("Repayment recorded");
      load();
    } catch (e) { toast.error(formatDetail(e.response?.data?.detail)); }
  };

  const extend = async () => {
    const months = prompt("Extend by how many months?", "3");
    if (!months) return;
    const note = prompt("Reason / note:", "") || "";
    try {
      const { data } = await api.post(`/loans/${detail.id}/extend`, { additional_months: Number(months), note });
      setDetail(data); toast.success("Loan extended"); load();
    } catch (e) { toast.error(formatDetail(e.response?.data?.detail)); }
  };

  const block = async () => {
    const reason = prompt("Reason for block:");
    if (!reason) return;
    const bm = prompt("Block for how many months?", "6");
    if (!bm) return;
    try {
      const { data } = await api.post(`/loans/${detail.id}/block`, { reason, block_months: Number(bm) });
      setDetail(data); toast.success("Beneficiary blocked"); load();
    } catch (e) { toast.error(formatDetail(e.response?.data?.detail)); }
  };

  const unblock = async () => {
    try {
      const { data } = await api.post(`/loans/${detail.id}/unblock`);
      setDetail(data); toast.success("Unblocked"); load();
    } catch (e) { toast.error(formatDetail(e.response?.data?.detail)); }
  };

  return (
    <div data-testid={`kadan-page-${variant}`}>
      <PageHeader
        title={isVatti ? "Vattiyilla Kadan" : "Kadan (Loan)"}
        subtitle={isVatti ? "Interest-free short-term loans — typically 3 months, with security details." : "Community loans across Medical, Education & Economic categories with repayment tracking."}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="btn-accent-copper rounded-full px-5 py-6" data-testid={`add-${variant}-btn`}>
                <Plus size={16} weight="bold" className="mr-2" /> New {isVatti ? "Vattiyilla Kadan" : "Kadan"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-serif text-2xl">New {isVatti ? "Vattiyilla Kadan" : "Kadan"}</DialogTitle></DialogHeader>
              <div className="space-y-5">
                <div>
                  <div className="text-xs uppercase tracking-widest text-copper mb-2">Step 1 · Beneficiary</div>
                  <PersonLookupForm kind="beneficiaries" hideOnFound onSaved={setBeneficiary} />
                </div>

                {beneficiary && (
                  <form onSubmit={submit} className="space-y-5 border-t border-earth pt-5">
                    <div className="text-xs uppercase tracking-widest text-copper">Step 2 · Loan & Security</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger data-testid="loan-category"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Amount (₹)</Label>
                        <Input type="number" required min="1" value={amount} onChange={e => setAmount(e.target.value)} data-testid="loan-amount" />
                      </div>
                      <div>
                        <Label>Repayment (months)</Label>
                        <Input type="number" required min="1" value={months} onChange={e => setMonths(e.target.value)} data-testid="loan-months" />
                      </div>
                      <div>
                        <Label>Area</Label>
                        <Input value={area} onChange={e => setArea(e.target.value)} data-testid="loan-area" />
                      </div>
                    </div>

                    <div className="card-earth p-5 bg-sidebar">
                      <div className="text-sm font-semibold text-moss mb-3">Security Details</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input placeholder="Security Name" value={security.name} onChange={e => setSecurity({ ...security, name: e.target.value })} data-testid="sec-name" />
                        <Input placeholder="Father's Name" value={security.father_name} onChange={e => setSecurity({ ...security, father_name: e.target.value })} data-testid="sec-father" />
                        <Input placeholder="Address" value={security.address} onChange={e => setSecurity({ ...security, address: e.target.value })} data-testid="sec-address" />
                        <Input placeholder="Contact Number" value={security.contact} onChange={e => setSecurity({ ...security, contact: e.target.value })} data-testid="sec-contact" />
                      </div>
                    </div>

                    <div>
                      <Label>Notes</Label>
                      <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>

                    <Button disabled={saving} className="btn-primary-moss rounded-full" data-testid="loan-submit">
                      {saving ? "Saving…" : "Create Loan"}
                    </Button>
                  </form>
                )}
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      
      <div className="card-earth mb-4 p-4">
        <div className="flex gap-2 items-center">
          <MagnifyingGlass size={18} className="text-[color:var(--text-muted)]" />
          <Input
            placeholder="Search by beneficiary name, contact, category, status..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            data-testid="search-loans"
            className="flex-1"
          />
          {searchQuery && <span className="text-xs text-[color:var(--text-muted)]">Found: {filteredRows.length}</span>}
        </div>
      </div>

      <div className="card-earth overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-sidebar">
              <TableHead>Beneficiary</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="py-10 text-center text-[color:var(--text-muted)]">Loading…</TableCell></TableRow>
              : rows.length === 0 ? <TableRow><TableCell colSpan={7} className="py-10 text-center text-[color:var(--text-muted)]">No loans yet.</TableCell></TableRow>
              : rows.map(l => (
                <TableRow key={l.id} data-testid={`loan-row-${l.id}`}>
                  <TableCell><div className="font-medium">{l.beneficiary?.name}</div><div className="text-xs text-[color:var(--text-muted)]">{l.beneficiary?.contact}</div></TableCell>
                  <TableCell>{l.category}</TableCell>
                  <TableCell className="font-semibold">{inr(l.amount)}</TableCell>
                  <TableCell>{inr(l.total_paid)}</TableCell>
                  <TableCell className="text-xs">{new Date(l.due_date).toLocaleDateString()}</TableCell>
                  <TableCell><StatusBadge status={l.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => setDetail(l)} data-testid={`view-loan-${l.id}`}>Manage</Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">
                  {detail.beneficiary?.name} · {detail.category}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                <div className="flex items-center gap-3"><StatusBadge status={detail.status} />
                  <span className="text-sm text-[color:var(--text-muted)]">Due {new Date(detail.due_date).toLocaleDateString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="card-earth p-4"><div className="text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]">Amount</div><div className="font-serif text-2xl">{inr(detail.amount)}</div></div>
                  <div className="card-earth p-4"><div className="text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]">Paid</div><div className="font-serif text-2xl text-moss">{inr(detail.total_paid)}</div></div>
                </div>

                <div className="card-earth p-4 bg-sidebar text-sm">
                  <div className="font-semibold text-moss mb-1">Security</div>
                  <div>{detail.security?.name} · {detail.security?.father_name}</div>
                  <div className="text-[color:var(--text-secondary)]">{detail.security?.address} · {detail.security?.contact}</div>
                </div>

                {detail.block_info && (
                  <div className="card-earth p-4 border-l-4 border-[#A93F35]">
                    <div className="font-semibold text-[#A93F35]">Blocked — {detail.block_info.reason}</div>
                    <div className="text-sm text-[color:var(--text-secondary)]">
                      For {detail.block_info.block_months} months · until {new Date(detail.block_info.unblock_at).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {detail.status !== "blocked" && detail.status !== "closed" && (
                  <div className="card-earth p-4">
                    <div className="text-sm font-semibold mb-3">Record Repayment</div>
                    <div className="flex gap-2">
                      <Input placeholder="Amount" type="number" value={repayAmt} onChange={e => setRepayAmt(e.target.value)} data-testid="repay-amount" />
                      <Button className="btn-primary-moss rounded-full" onClick={repay} data-testid="repay-btn">Add</Button>
                    </div>
                  </div>
                )}

                {detail.repayments?.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-[color:var(--text-muted)] mb-2">Repayment history</div>
                    <ul className="space-y-1">
                      {detail.repayments.map(r => (
                        <li key={r.id} className="flex justify-between text-sm border-b border-earth py-1">
                          <span>{new Date(r.at).toLocaleDateString()}</span>
                          <span className="font-medium">{inr(r.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {isAdmin && (
                  <div className="flex gap-2 flex-wrap">
                    {detail.status === "time_limit_exceed" && (
                      <Button variant="outline" onClick={extend} data-testid="extend-btn" className="rounded-full">Extend Period</Button>
                    )}
                    {detail.status !== "blocked" && (
                      <Button variant="outline" onClick={block} data-testid="block-btn" className="rounded-full border-[#A93F35] text-[#A93F35]">Block Beneficiary</Button>
                    )}
                    {detail.status === "blocked" && (
                      <Button onClick={unblock} className="btn-primary-moss rounded-full" data-testid="unblock-btn">Unblock</Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
