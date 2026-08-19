import { useCallback, useEffect, useState } from "react";
import { api, inr, formatDetail } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";
import { canApprovePayments, useAuth } from "@/context/AuthContext";

export default function Accounts() {
  const { user } = useAuth();
  const canApprove = canApprovePayments(user);
  const [summary, setSummary] = useState(null);
  const [outstanding, setOutstanding] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, o, p] = await Promise.all([
        api.get("/accounts/summary"),
        api.get("/accounts/user-outstanding"),
        canApprove ? api.get("/payments/pending") : Promise.resolve({ data: [] }),
      ]);
      setSummary(s.data); setOutstanding(o.data); setPending(p.data);
    } finally { setLoading(false); }
  }, [canApprove]);
  useEffect(() => { load(); }, [load]);

  const act = async (id, ok) => {
    try {
      await api.post(`/payments/${id}/approve`, { approve: ok });
      toast.success(ok ? "Approved — added to main balance" : "Rejected — remains outstanding");
      load();
    } catch (e) { toast.error(formatDetail(e.response?.data?.detail)); }
  };

  return (
    <div data-testid="accounts-page">
      <PageHeader title="Accounts" subtitle="Approve collector payments — approved amounts move into the main balance; unapproved remain outstanding." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <div className="card-earth p-6">
          <div className="text-xs uppercase tracking-widest text-[color:var(--text-muted)]">Main Balance</div>
          <div className="font-serif text-4xl mt-2 text-moss font-semibold">{inr(summary?.balance)}</div>
        </div>
        <div className="card-earth p-6">
          <div className="text-xs uppercase tracking-widest text-[color:var(--text-muted)]">Approved Collections</div>
          <div className="font-serif text-4xl mt-2 font-semibold">{inr(summary?.total_collected)}</div>
        </div>
        <div className="card-earth p-6">
          <div className="text-xs uppercase tracking-widest text-[color:var(--text-muted)]">Outstanding (Pending)</div>
          <div className="font-serif text-4xl mt-2 text-copper font-semibold">{inr(summary?.total_pending)}</div>
        </div>
      </div>

      <h2 className="font-serif text-2xl font-semibold mt-10 mb-4">Outstanding by Collector</h2>
      <div className="card-earth overflow-x-auto">
        <Table>
          <TableHeader><TableRow className="bg-sidebar">
            <TableHead>Collector</TableHead><TableHead>Pending Receipts</TableHead><TableHead>Outstanding</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {outstanding.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-[color:var(--text-muted)]">No outstanding payments.</TableCell></TableRow>
              : outstanding.map(o => (
                <TableRow key={o.user_id} data-testid={`outstanding-${o.user_id}`}>
                  <TableCell className="font-medium">{o.name}</TableCell>
                  <TableCell>{o.count}</TableCell>
                  <TableCell className="font-semibold text-copper">{inr(o.outstanding)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {canApprove && (
        <>
          <h2 className="font-serif text-2xl font-semibold mt-10 mb-4">Pending Approvals</h2>
          <div className="card-earth overflow-x-auto">
            <Table>
              <TableHeader><TableRow className="bg-sidebar">
                <TableHead>Receipt</TableHead><TableHead>Donor</TableHead><TableHead>Amount</TableHead><TableHead>Collector</TableHead><TableHead className="text-right">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {pending.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-[color:var(--text-muted)]">Nothing pending.</TableCell></TableRow>
                  : pending.map(p => (
                    <TableRow key={p.id} data-testid={`pending-${p.id}`}>
                      <TableCell className="font-mono text-xs text-copper">{p.receipt_no}</TableCell>
                      <TableCell>{p.donor?.name}</TableCell>
                      <TableCell className="font-semibold">{inr(p.total_amount)}</TableCell>
                      <TableCell className="text-sm">{p.collected_by_name}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="btn-primary-moss rounded-full text-xs mr-2" onClick={() => act(p.id, true)} data-testid={`acc-approve-${p.id}`}>Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => act(p.id, false)} data-testid={`acc-reject-${p.id}`}>Outstanding</Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
