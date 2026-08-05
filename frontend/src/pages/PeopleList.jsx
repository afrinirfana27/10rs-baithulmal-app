import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import PersonLookupForm from "@/components/PersonLookupForm";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { formatDetail } from "@/lib/api";

const singular = { donors: "donor", beneficiaries: "beneficiary", workers: "worker" };

export default function PeopleList({ kind, title, subtitle }) {
  const noun = singular[kind] || kind;
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const load = () => {
    setLoading(true);
    api.get(`/people/${kind}`).then(r => setItems(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, [kind]);

  const remove = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await api.delete(`/people/${kind}/${id}`);
      toast.success("Deleted");
      load();
    } catch (e) { toast.error(formatDetail(e.response?.data?.detail)); }
  };

  return (
    <div data-testid={`people-${kind}`}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="btn-accent-copper rounded-full px-5 py-6" data-testid={`add-${kind}-btn`}>
                <Plus size={16} weight="bold" className="mr-2" /> Add {noun}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle className="font-serif text-2xl">Register {noun}</DialogTitle></DialogHeader>
              <PersonLookupForm kind={kind} onSaved={() => { setOpen(false); load(); }} />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="card-earth overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-sidebar">
              <TableHead className="w-24">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Father&apos;s Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Area</TableHead>
              {user?.role === "admin" && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-[color:var(--text-muted)] py-10">Loading…</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-[color:var(--text-muted)] py-10">No records yet.</TableCell></TableRow>
            ) : items.map(i => (
              <TableRow key={i.id} data-testid={`row-${i.id}`}>
                <TableCell className="font-mono text-xs text-copper">{i.serial}</TableCell>
                <TableCell className="font-medium">{i.name}</TableCell>
                <TableCell>{i.father_name}</TableCell>
                <TableCell>{i.contact}</TableCell>
                <TableCell className="max-w-xs truncate">{i.address}</TableCell>
                <TableCell>{i.area || "—"}</TableCell>
                {user?.role === "admin" && (
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => remove(i.id)} data-testid={`delete-${i.id}`}>Delete</Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
