import { useState } from "react";
import { api, formatDetail } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MagnifyingGlass, CheckCircle } from "@phosphor-icons/react";

const singularKind = { donors: "donor", beneficiaries: "beneficiary", workers: "worker" };

/**
 * PersonLookupForm
 * kind: 'donors' | 'beneficiaries' | 'workers'
 * onSaved(person)
 */
export default function PersonLookupForm({ kind, onSaved, hideOnFound = false }) {
  const [contact, setContact] = useState("");
  const [checking, setChecking] = useState(false);
  const [found, setFound] = useState(null); // record if exists
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", father_name: "", address: "", area: "" });
  const [saving, setSaving] = useState(false);

  const noun = singularKind[kind] || kind;

  const doLookup = async () => {
    if (!contact.trim()) { toast.error("Enter contact number"); return; }
    setChecking(true); setFound(null); setShowForm(false);
    try {
      const { data } = await api.get(`/people/${kind}/lookup`, { params: { contact: contact.trim() } });
      if (data.exists) {
        setFound(data.record);
        if (hideOnFound) onSaved?.(data.record);
      } else {
        setShowForm(true);
      }
    } catch (e) {
      toast.error(formatDetail(e.response?.data?.detail));
    } finally { setChecking(false); }
  };

  const doSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post(`/people/${kind}`, { ...form, contact: contact.trim() });
      toast.success(`${noun} registered`);
      setFound(data);
      setShowForm(false);
      onSaved?.(data);
    } catch (e) {
      toast.error(formatDetail(e.response?.data?.detail));
    } finally { setSaving(false); }
  };

  const reset = () => {
    setContact(""); setFound(null); setShowForm(false);
    setForm({ name: "", father_name: "", address: "", area: "" });
  };

  return (
    <div className="space-y-4" data-testid={`lookup-${kind}`}>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
        <div className="flex-1">
          <Label>Contact Number</Label>
          <Input
            data-testid="lookup-contact"
            value={contact}
            onChange={e => setContact(e.target.value)}
            placeholder="e.g. 9876543210"
            onKeyDown={e => e.key === "Enter" && doLookup()}
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button" onClick={doLookup} disabled={checking}
            data-testid="lookup-btn"
            className="btn-primary-moss rounded-full px-5 flex-1 sm:flex-none"
          >
            <MagnifyingGlass size={16} weight="bold" className="mr-2" /> {checking ? "Checking…" : "Lookup"}
          </Button>
          {(found || showForm) && (
            <Button type="button" variant="outline" onClick={reset} data-testid="lookup-reset" className="rounded-full">Reset</Button>
          )}
        </div>
      </div>

      {found && (
        <div className="card-earth p-5 flex items-start gap-4" data-testid="lookup-found">
          <div className="coin-badge shrink-0">{found.serial?.charAt(0) || "•"}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} weight="fill" className="text-[#2D7A4D]" />
              <div className="font-semibold text-[color:var(--text-primary)]">{found.name}</div>
              <span className="text-xs text-[color:var(--text-muted)]">#{found.serial}</span>
            </div>
            <div className="mt-1 text-sm text-[color:var(--text-secondary)]">
              Father: {found.father_name} · {found.address} · {found.contact}
              {found.area && <> · Area: {found.area}</>}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={doSave} className="card-earth p-6 space-y-4" data-testid="lookup-new-form">
            <div className="text-sm uppercase tracking-widest text-copper font-medium">New {noun} Registration</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input required data-testid="new-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Father&apos;s Name</Label>
              <Input required data-testid="new-father" value={form.father_name} onChange={e => setForm({ ...form, father_name: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Address</Label>
              <Input required data-testid="new-address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label>Area</Label>
              <Input data-testid="new-area" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} />
            </div>
          </div>
          <Button disabled={saving} className="btn-accent-copper rounded-full" data-testid="new-save-btn">
            {saving ? "Saving…" : `Register ${noun}`}
          </Button>
        </form>
      )}
    </div>
  );
}
