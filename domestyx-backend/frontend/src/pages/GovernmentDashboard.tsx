import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";

const GovernmentDashboard = () => {
 const { isAuthenticated, logout, user } = useAuth();
 const navigate = useNavigate();
 const [reports, setReports] = useState<any[]>([]);
 const [jobReviews, setJobReviews] = useState<any[]>([]);
 const [analytics, setAnalytics] = useState<any>(null);
 const [profile, setProfile] = useState<any>({ authority_name: "", credential_reference: "", verification_document: "" });
 const [resolutionNotes, setResolutionNotes] = useState<Record<number, string>>({});
 const [jobReviewNotes, setJobReviewNotes] = useState<Record<number, string>>({});

 const load = async () => {
 try {
 const [reportsRes, analyticsRes, profileRes] = await Promise.all([
 api.get("/reports/compliance/"),
 api.get("/reports/analytics/"),
 api.get("/government/profile/"),
 ]);
 setReports(reportsRes.data || []);
 setAnalytics(analyticsRes.data || null);
 setProfile(profileRes.data || { authority_name: "", credential_reference: "", verification_document: "" });
 const jobsRes = await api.get("/reports/job-reviews/", { params: { status: "pending" } });
 setJobReviews(jobsRes.data || []);
 } catch {
 toast({ title: "Error", description: "Unable to load regulatory data.", variant: "destructive" });
 }
 };

 useEffect(() => {
 if (!isAuthenticated) {
 navigate("/government/login");
 return;
 }
 void load();
 }, [isAuthenticated]);

 const updateReport = async (id: number, payload: any) => {
 try {
 await api.patch(`/reports/compliance/${id}/`, payload);
 await load();
 } catch {
 toast({ title: "Error", description: "Unable to update report.", variant: "destructive" });
 }
 };

 const updateJobReview = async (id: number, review_status: "approved" | "rejected" | "pending") => {
 try {
 await api.patch(`/reports/job-reviews/${id}/`, {
 review_status,
 review_notes: jobReviewNotes[id] || "",
 });
 await load();
 } catch {
 toast({ title: "Error", description: "Unable to update job review.", variant: "destructive" });
 }
 };

 const saveGovernmentProfile = async () => {
 try {
 const form = new FormData();
 form.append("authority_name", profile.authority_name || "");
 form.append("credential_reference", profile.credential_reference || "");
 if (profile.verification_document instanceof File) {
 form.append("verification_document", profile.verification_document);
 }
 await api.put("/government/profile/", form, {
 headers: { "Content-Type": "multipart/form-data" },
 });
 toast({ title: "Saved", description: "Government profile updated." });
 await load();
 } catch {
 toast({ title: "Error", description: "Unable to save government profile.", variant: "destructive" });
 }
 };

 return (
 <div className="min-h-screen bg-slate-50">
 <header className="bg-white shadow-sm border-b">
 <div className="max-w-7xl mx-auto px-4 flex h-16 items-center justify-between">
 <Link to="/" className="text-2xl font-bold text-primary">DomestyX</Link>
 <div className="flex items-center gap-2">
 <span className="text-sm text-gray-600">{user?.first_name || "Government"}</span>
 <Button variant="outline" size="sm" onClick={() => { logout(); navigate("/"); }}>Logout</Button>
 </div>
 </div>
 </header>

 <main className="max-w-7xl mx-auto px-4 space-y-6 py-6">
 <Card className="shadow-lg border-0 bg-white">
 <CardHeader><CardTitle>Government Verification Profile</CardTitle></CardHeader>
 <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
 <div className="space-y-1">
 <Label>Authority Name</Label>
 <Input value={profile.authority_name || ""} onChange={(e) => setProfile((p: any) => ({ ...p, authority_name: e.target.value }))} />
 </div>
 <div className="space-y-1">
 <Label>Credential Reference</Label>
 <Input value={profile.credential_reference || ""} onChange={(e) => setProfile((p: any) => ({ ...p, credential_reference: e.target.value }))} />
 </div>
 <div className="space-y-1">
 <Label>Verification Document</Label>
 <Input
 type="file"
 onChange={(e) => {
 const file = e.target.files?.[0];
 if (!file) return;
 setProfile((p: any) => ({ ...p, verification_document: file }));
 }}
 />
 {typeof profile.verification_document === "string" && profile.verification_document ? (
 <a className="text-xs text-primary underline" href={profile.verification_document} target="_blank" rel="noreferrer">View uploaded document</a>
 ) : null}
 </div>
 <div className="md:col-span-3">
 <Button onClick={() => void saveGovernmentProfile()}>Save Profile</Button>
 </div>
 </CardContent>
 </Card>

 <Card className="shadow-lg border-0 bg-white">
 <CardHeader><CardTitle>Platform Analytics</CardTitle></CardHeader>
 <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
 <div className="rounded-lg border p-3"><p className="text-xs text-gray-500">Jobs</p><p className="text-xl font-bold">{analytics?.totals?.jobs || 0}</p></div>
 <div className="rounded-lg border p-3"><p className="text-xs text-gray-500">Applications</p><p className="text-xl font-bold">{analytics?.totals?.applications || 0}</p></div>
 <div className="rounded-lg border p-3"><p className="text-xs text-gray-500">Hired</p><p className="text-xl font-bold">{analytics?.totals?.hired || 0}</p></div>
 <div className="rounded-lg border p-3"><p className="text-xs text-gray-500">Open Reports</p><p className="text-xl font-bold">{analytics?.totals?.compliance_reports_open || 0}</p></div>
 </CardContent>
 </Card>

 <Card className="shadow-lg border-0 bg-white">
 <CardHeader><CardTitle>Pending Job Reviews</CardTitle></CardHeader>
 <CardContent className="space-y-3">
 {jobReviews.length === 0 ? (
 <p className="text-sm text-gray-500">No pending jobs for review.</p>
 ) : jobReviews.map((j) => (
 <div key={j.id} className="rounded-lg border p-3 space-y-2">
 <p className="font-semibold text-app-text">{j.title}</p>
 <p className="text-sm text-gray-600">Location: {j.location}</p>
 <p className="text-sm text-gray-600">Salary: {j.salary}</p>
 <p className="text-sm text-gray-600">Status: {j.review_status}</p>
 <div className="space-y-1">
 <Label>Review Notes</Label>
 <Input value={jobReviewNotes[j.id] || ""} onChange={(e) => setJobReviewNotes((p) => ({ ...p, [j.id]: e.target.value }))} />
 </div>
 <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
 <Button size="sm" variant="outline" onClick={() => void updateJobReview(j.id, "approved")}>Approve</Button>
 <Button size="sm" variant="outline" onClick={() => void updateJobReview(j.id, "rejected")}>Reject</Button>
 <Button size="sm" variant="outline" onClick={() => void updateJobReview(j.id, "pending")}>Keep Pending</Button>
 </div>
 </div>
 ))}
 </CardContent>
 </Card>

 <Card className="shadow-lg border-0 bg-white">
 <CardHeader><CardTitle>Compliance Reports</CardTitle></CardHeader>
 <CardContent className="space-y-3">
 {reports.length === 0 ? (
 <p className="text-sm text-gray-500">No compliance reports found.</p>
 ) : reports.map((r) => (
 <div key={r.id} className="rounded-lg border p-3 space-y-2">
 <p className="font-semibold text-app-text">Report #{r.id} · {r.category}</p>
 <p className="text-sm text-gray-600">{r.description}</p>
 <p className="text-sm text-gray-600">Status: {r.status}</p>
 <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
 <Button size="sm" variant="outline" onClick={() => void updateReport(r.id, { status: "in_review" })}>Mark In Review</Button>
 <Button size="sm" variant="outline" onClick={() => void updateReport(r.id, { status: "resolved" })}>Resolve</Button>
 <Button size="sm" variant="outline" onClick={() => void updateReport(r.id, { status: "dismissed" })}>Dismiss</Button>
 </div>
 <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
 <Button size="sm" variant="destructive" onClick={() => void updateReport(r.id, { action: "suspend_user", resolution_notes: resolutionNotes[r.id] || "" })}>Suspend Reported User</Button>
 <Button size="sm" variant="outline" onClick={() => void updateReport(r.id, { action: "activate_user", resolution_notes: resolutionNotes[r.id] || "" })}>Activate User</Button>
 <div className="space-y-1">
 <Label>Resolution Notes</Label>
 <Input value={resolutionNotes[r.id] || ""} onChange={(e) => setResolutionNotes((p) => ({ ...p, [r.id]: e.target.value }))} />
 </div>
 </div>
 </div>
 ))}
 </CardContent>
 </Card>
 </main>
 </div>
 );
};

export default GovernmentDashboard;
