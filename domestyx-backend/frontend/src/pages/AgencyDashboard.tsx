import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";

type EmployerOption = {
  id: number;
  name: string;
  email: string;
  company_name?: string;
};

const AgencyDashboard = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    agency_name: "",
    mohre_approval_number: "",
    contact_information: "",
    verification_document: "",
  });
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [employers, setEmployers] = useState<EmployerOption[]>([]);
  const [form, setForm] = useState({ worker_id: "", job_role: "", experience_summary: "", notes: "" });
  const [submissionDoc, setSubmissionDoc] = useState<File | null>(null);
  const [jobForm, setJobForm] = useState({
    employer_id: "",
    title: "",
    description: "",
    location: "",
    salary: "",
    job_type: "full-time",
  });

  const load = async () => {
    try {
      const [profileRes, submissionRes, employerRes] = await Promise.all([
        api.get("/agency/profile/"),
        api.get("/agency/worker-submissions/"),
        api.get("/agency/employers/"),
      ]);
      setProfile(profileRes.data || {});
      setSubmissions(submissionRes.data || []);
      setEmployers(employerRes.data || []);
    } catch {
      toast({ title: "Error", description: "Unable to load agency data.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/agency/login");
      return;
    }
    void load();
  }, [isAuthenticated]);

  const saveProfile = async () => {
    try {
      await api.put("/agency/profile/", profile);
      toast({ title: "Saved", description: "Agency profile updated." });
    } catch {
      toast({ title: "Error", description: "Profile update failed.", variant: "destructive" });
    }
  };

  const uploadAgencyDocument = async (file: File) => {
    const formData = new FormData();
    formData.append("verification_document", file);
    try {
      const response = await api.put("/agency/profile/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile((prev: any) => ({ ...prev, verification_document: response.data?.verification_document || prev.verification_document }));
      toast({ title: "Uploaded", description: "Verification document uploaded." });
    } catch {
      toast({ title: "Error", description: "Document upload failed.", variant: "destructive" });
    }
  };

  const submitWorker = async () => {
    try {
      if (submissionDoc) {
        const data = new FormData();
        data.append("worker", String(Number(form.worker_id)));
        data.append("job_role", form.job_role);
        data.append("experience_summary", form.experience_summary);
        data.append("notes", form.notes);
        data.append("verification_document", submissionDoc);
        await api.post("/agency/worker-submissions/", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/agency/worker-submissions/", {
          worker: Number(form.worker_id),
          job_role: form.job_role,
          experience_summary: form.experience_summary,
          notes: form.notes,
        });
      }
      setForm({ worker_id: "", job_role: "", experience_summary: "", notes: "" });
      setSubmissionDoc(null);
      toast({ title: "Submitted", description: "Worker submitted successfully." });
      await load();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error || "Submission failed.", variant: "destructive" });
    }
  };

  const createJobForEmployer = async () => {
    try {
      const res = await api.post("/agency/jobs/create-for-employer/", {
        ...jobForm,
        employer_id: Number(jobForm.employer_id),
      });
      toast({ title: "Job Posted", description: `Job created with review status: ${res.data?.review_status || "pending"}.` });
      setJobForm({
        employer_id: "",
        title: "",
        description: "",
        location: "",
        salary: "",
        job_type: "full-time",
      });
    } catch (err: any) {
      const details = err?.response?.data;
      const firstError = details && typeof details === "object" ? Object.values(details)[0] : null;
      const msg = Array.isArray(firstError) ? firstError[0] : firstError;
      toast({ title: "Error", description: (msg as string) || "Unable to create job.", variant: "destructive" });
    }
  };

  return (
    <div className="app-shell">
      <header className="border-b border-border/70 bg-white/90 backdrop-blur">
        <div className="page-wrap flex h-16 items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">DomestyX</Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">{user?.first_name || "Agency"}</span>
            <Button variant="outline" size="sm" onClick={() => { logout(); navigate("/"); }}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="page-wrap space-y-6 py-6">
        <Card className="glass-card border-slate-200">
          <CardHeader><CardTitle>Agency Profile</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1"><Label>Agency Name</Label><Input value={profile.agency_name} onChange={(e) => setProfile((p) => ({ ...p, agency_name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Approval Number</Label><Input value={profile.mohre_approval_number} onChange={(e) => setProfile((p) => ({ ...p, mohre_approval_number: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Contact</Label><Input value={profile.contact_information} onChange={(e) => setProfile((p) => ({ ...p, contact_information: e.target.value }))} /></div>
            <div className="space-y-1 md:col-span-3">
              <Label>Verification Document</Label>
              <Input type="file" onChange={(e) => e.target.files && void uploadAgencyDocument(e.target.files[0])} />
              {profile.verification_document && (
                <a className="text-xs text-primary underline" href={profile.verification_document} target="_blank" rel="noreferrer">
                  View uploaded document
                </a>
              )}
            </div>
            <div className="md:col-span-3"><Button className="btn-primary" onClick={() => void saveProfile()}>Save Profile</Button></div>
          </CardContent>
        </Card>

        <Card className="glass-card border-slate-200">
          <CardHeader><CardTitle>Post Job for Employer</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label>Employer</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={jobForm.employer_id}
                onChange={(e) => setJobForm((f) => ({ ...f, employer_id: e.target.value }))}
              >
                <option value="">Select Employer</option>
                {employers.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.email}){e.company_name ? ` - ${e.company_name}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1"><Label>Title</Label><Input value={jobForm.title} onChange={(e) => setJobForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Location</Label><Input value={jobForm.location} onChange={(e) => setJobForm((f) => ({ ...f, location: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Salary</Label><Input value={jobForm.salary} onChange={(e) => setJobForm((f) => ({ ...f, salary: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label>Job Type</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={jobForm.job_type}
                onChange={(e) => setJobForm((f) => ({ ...f, job_type: e.target.value }))}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="one-time">One-time</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2"><Label>Description</Label><Textarea value={jobForm.description} onChange={(e) => setJobForm((f) => ({ ...f, description: e.target.value }))} /></div>
            <div className="md:col-span-2"><Button onClick={() => void createJobForEmployer()}>Create Job</Button></div>
          </CardContent>
        </Card>

        <Card className="glass-card border-slate-200">
          <CardHeader><CardTitle>Submit Worker Profile</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label>Worker User ID</Label><Input value={form.worker_id} onChange={(e) => setForm((f) => ({ ...f, worker_id: e.target.value }))} placeholder="Enter worker ID" /></div>
            <div className="space-y-1"><Label>Job Role</Label><Input value={form.job_role} onChange={(e) => setForm((f) => ({ ...f, job_role: e.target.value }))} placeholder="Nanny, Cleaner, Cook..." /></div>
            <div className="space-y-1"><Label>Experience Summary</Label><Input value={form.experience_summary} onChange={(e) => setForm((f) => ({ ...f, experience_summary: e.target.value }))} placeholder="5 years household support" /></div>
            <div className="space-y-1"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Verification Document</Label><Input type="file" onChange={(e) => setSubmissionDoc(e.target.files?.[0] || null)} /></div>
            <Button onClick={() => void submitWorker()}>Submit Worker</Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-slate-200">
          <CardHeader><CardTitle>Submitted Workers</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {submissions.length === 0 ? (
              <p className="text-sm text-slate-500">No submissions yet.</p>
            ) : submissions.map((s) => (
              <div key={s.id} className="rounded-lg border p-3">
                <p className="font-medium text-slate-900">Worker: {s.worker_name || s.worker}</p>
                <p className="text-sm text-slate-600">Role: {s.job_role || "N/A"}</p>
                <p className="text-sm text-slate-600">Experience: {s.experience_summary || "N/A"}</p>
                <p className="text-sm text-slate-600">Status: {s.status}</p>
                <p className="text-sm text-slate-600">Notes: {s.notes || "N/A"}</p>
                {s.verification_document && <a href={s.verification_document} target="_blank" rel="noreferrer" className="text-sm text-primary underline">View Document</a>}
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AgencyDashboard;
