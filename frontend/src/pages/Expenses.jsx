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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus } from "@phosphor-icons/react";

export default function Expenses() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("salary");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // salary form
  const [worker, setWorker] = useState(null);
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryNote, setSalaryNote] = useState("");

  // maintenance form
  const [maintCategory, setMaintCategory] = useState("Software");
  const [maintAmount, setMaintAmount] = useState("");
  const [maintNote, setMaintNote] = useState("");

  const load = () => {
    setLoading(true);
    api.get("/expenses").then(r => setRows(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submitSalary = async (e) => {
    e.preventDefault();
    if (!worker) return toast.error("Select a worker");
    try {
      await api.post("/expenses", { kind: "salary", worker_id: worker.id, month: salaryMonth, amount: Number(salaryAmount), note: salaryNote });
      toast.success("Salary recorded"); setOpen(false); setWorker(null); setSalaryAmount(""); setSalaryNote(""); load();
    } catch (e) { toast.error(formatDetail(e.response?.data?.detail)); }
  };

  const submitMaint = async (e) => {
    e.preventDefault();
    try {
      await api.post("/expenses", { kind: "maintenance", category: maintCategory, amount: Number(maintAmount), note: maintNote });
      toast.success("Expense recorded"); setOpen(false); setMaintAmount(""); setMaintNote(""); load();
    } catch (e) { toast.error(formatDetail(e.response?.data?.detail)); }
  };

  return (
    <div data-testid="expenses-page">
      <PageHeader
        title="Expenses"
        subtitle="Record worker salaries and maintenance / operating expenses (software, utilities, supplies)."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="btn-accent-copper rounded-full px-5 py-6" data-testid="add-expense-btn">
                <Plus size={16} weight="bold" className="mr-2" /> New Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle className="font-serif text-2xl">Record Expense</DialogTitle></DialogHeader>
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  <TabsTrigger value="salary" data-testid="tab-salary">Salary</TabsTrigger>
                  <TabsTrigger value="maintenance" data-testid="tab-maintenance">Maintenance</TabsTrigger>
                </TabsList>

                <TabsContent value="salary" className="space-y-5 pt-4">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-copper mb-2">Step 1 · Worker</div>
                    <PersonLookupForm kind="workers" hideOnFound onSaved={setWorker} />
                  </div>
                  {worker && (
                    <form onSubmit={submitSalary} className="space-y-4 border-t border-earth pt-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Month</Label><Input type="month" value={salaryMonth} onChange={e => setSalaryMonth(e.target.value)} data-testid="salary-month" /></div>
                        <div><Label>Amount (₹)</Label><Input type="number" required min="1" value={salaryAmount} onChange={e => setSalaryAmount(e.target.value)} data-testid="salary-amount" /></div>
                      </div>
                      <div><Label>Note</Label><Textarea value={salaryNote} onChange={e => setSalaryNote(e.target.value)} /></div>
                      <Button className="btn-primary-moss rounded-full" data-testid="salary-submit">Save Salary</Button>
                    </form>
                  )}
                </TabsContent>

                <TabsContent value="maintenance" className="space-y-4 pt-4">
                  <form onSubmit={submitMaint} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Category</Label>
                        <Select value={maintCategory} onValueChange={setMaintCategory}>
                          <SelectTrigger data-testid="maint-category"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Software">Software</SelectItem>
                            <SelectItem value="Utilities">Utilities</SelectItem>
                            <SelectItem value="Supplies">Supplies</SelectItem>
                            <SelectItem value="Rent">Rent</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Amount (₹)</Label><Input type="number" required min="1" value={maintAmount} onChange={e => setMaintAmount(e.target.value)} data-testid="maint-amount" /></div>
                    </div>
                    <div><Label>Note</Label><Textarea value={maintNote} onChange={e => setMaintNote(e.target.value)} /></div>
                    <Button className="btn-primary-moss rounded-full" data-testid="maint-submit">Save Expense</Button>
                  </form>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="card-earth overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-sidebar">
              <TableHead>Kind</TableHead>
              <TableHead>Recipient / Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="py-10 text-center text-[color:var(--text-muted)]">Loading…</TableCell></TableRow>
              : rows.length === 0 ? <TableRow><TableCell colSpan={5} className="py-10 text-center text-[color:var(--text-muted)]">No expenses yet.</TableCell></TableRow>
              : rows.map(e => (
                <TableRow key={e.id} data-testid={`expense-row-${e.id}`}>
                  <TableCell className="capitalize">{e.kind}</TableCell>
                  <TableCell>{e.kind === "salary" ? `${e.worker?.name || "—"} · ${e.month || ""}` : e.category}</TableCell>
                  <TableCell className="font-semibold">{inr(e.amount)}</TableCell>
                  <TableCell className="text-xs text-[color:var(--text-muted)]">{new Date(e.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm">{e.note || "—"}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
