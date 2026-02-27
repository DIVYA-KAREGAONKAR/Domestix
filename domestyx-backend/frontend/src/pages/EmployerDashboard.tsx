import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";
import {
  Briefcase,
  Users,
  LogOut,
  Plus,
  MapPin,
  Trash2,
  History,
  Star,
  Scale,
  FileText,
  Mail,
  Phone,
  Check,
  X,
  MessageCircle,
} from "lucide-react";

type ViewMode = "active" | "history" | "offers" | "shortlist" | "compare" | "contracts" | "chat";

const EmployerDashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("active");

  const [history, setHistory] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [recommendedWorkers, setRecommendedWorkers] = useState<any[]>([]);
  const [shortlistedWorkers, setShortlistedWorkers] = useState<any[]>([]);
  const [compareSelection, setCompareSelection] = useState<number[]>([]);
  const [comparedWorkers, setComparedWorkers] = useState<any[]>([]);
  const [notesByWorker, setNotesByWorker] = useState<Record<number, string>>({});

  const [contractForm, setContractForm] = useState({
    workerName: "",
    jobTitle: "",
    salary: "",
    startDate: "",
    hoursPerWeek: "48",
    location: "",
    accommodation: "Provided by employer",
    notes: "",
  });
  const [generatedContract, setGeneratedContract] = useState("");
  const [reviewForms, setReviewForms] = useState<Record<number, { rating: string; comment: string }>>({});
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [calls, setCalls] = useState<any[]>([]);

  const metrics = useMemo(() => {
    const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicants?.length || 0), 0);
    const hiredCount = history.filter((h) => h.status === "hired").length;
    const rejectedCount = history.filter((h) => h.status === "rejected").length;
    return {
      totalJobs: jobs.length,
      totalApplicants,
      hiredCount,
      rejectedCount,
    };
  }, [jobs, history]);

  const fetchMyJobs = async () => {
    try {
      const response = await api.get("/employer/jobs/");
      const jobsData = response.data || [];
      setJobs(jobsData);

      if (jobsData.length === 0) {
        setSelectedJob(null);
        return;
      }

      if (!selectedJob) {
        setSelectedJob(jobsData[0]);
        return;
      }

      const updated = jobsData.find((j: any) => j.id === selectedJob.id);
      setSelectedJob(updated || jobsData[0]);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch jobs", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get("/employer/application-history/");
      setHistory(response.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to fetch history", variant: "destructive" });
    }
  };

  const fetchOffers = async () => {
    try {
      const response = await api.get("/employer/offers/");
      setOffers(response.data || []);
    } catch {
      setOffers([]);
    }
  };

  const fetchRecommendedWorkers = async (jobId?: number) => {
    if (!jobId) {
      setRecommendedWorkers([]);
      return;
    }
    try {
      const response = await api.get(`/employer/jobs/${jobId}/recommended-workers/`);
      setRecommendedWorkers(response.data || []);
    } catch {
      setRecommendedWorkers([]);
    }
  };

  const fetchShortlistedWorkers = async (jobId?: number) => {
    try {
      const response = await api.get("/employer/shortlisted-workers/", {
        params: jobId ? { job_id: jobId } : {},
      });
      setShortlistedWorkers(response.data || []);
    } catch {
      setShortlistedWorkers([]);
    }
  };

  const fetchThreads = async () => {
    try {
      const response = await api.get("/chat/threads/");
      setThreads(response.data || []);
    } catch {
      setThreads([]);
    }
  };

  const fetchMessages = async (threadId: number) => {
    try {
      const response = await api.get(`/chat/threads/${threadId}/messages/`);
      setMessages(response.data || []);
    } catch {
      setMessages([]);
    }
  };

  const fetchCalls = async (threadId: number) => {
    try {
      const response = await api.get(`/chat/threads/${threadId}/calls/`);
      setCalls(response.data || []);
    } catch {
      setCalls([]);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/employer/login");
      return;
    }
    void fetchMyJobs();
    void fetchHistory();
    void fetchOffers();
    void fetchThreads();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedJob?.id) return;
    setContractForm((prev) => ({
      ...prev,
      jobTitle: selectedJob.title || prev.jobTitle,
      location: selectedJob.location || prev.location,
      salary: selectedJob.salary || prev.salary,
    }));
    void fetchRecommendedWorkers(selectedJob.id);
    void fetchShortlistedWorkers(selectedJob.id);
  }, [selectedJob?.id]);

  useEffect(() => {
    if (!activeThreadId) return;
    void fetchMessages(activeThreadId);
    void fetchCalls(activeThreadId);
    const interval = setInterval(() => void fetchMessages(activeThreadId), 5000);
    return () => clearInterval(interval);
  }, [activeThreadId]);

  const isShortlisted = (workerId: number) => {
    return shortlistedWorkers.some(
      (item: any) => item.worker === workerId || item.worker_details?.id === workerId
    );
  };

  const handleStatusUpdate = async (applicationId: number, status: "accepted" | "rejected") => {
    try {
      await api.patch(`/applications/${applicationId}/status/`, { status });
      toast({ title: "Success", description: `Applicant ${status} successfully.` });
      await fetchMyJobs();
      await fetchHistory();
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!window.confirm("Delete this job and all its applications?")) return;
    try {
      await api.delete(`/employer/jobs/${jobId}/delete/`);
      toast({ title: "Deleted", description: "Job removed." });
      if (selectedJob?.id === jobId) setSelectedJob(null);
      await fetchMyJobs();
    } catch {
      toast({ title: "Error", description: "Delete failed.", variant: "destructive" });
    }
  };

  const handleJobStatusChange = async (jobId: number, status: "active" | "closed") => {
    try {
      await api.patch(`/employer/jobs/${jobId}/status/`, { status });
      toast({ title: "Updated", description: `Job marked as ${status}.` });
      await fetchMyJobs();
    } catch {
      toast({ title: "Error", description: "Failed to update job status.", variant: "destructive" });
    }
  };

  const handleToggleShortlist = async (workerId: number) => {
    if (!selectedJob?.id) {
      toast({ title: "Select a Job", description: "Please select a job first.", variant: "destructive" });
      return;
    }

    try {
      if (isShortlisted(workerId)) {
        await api.delete(`/employer/workers/${workerId}/shortlist/`, {
          params: { job_id: selectedJob.id },
        });
        toast({ title: "Removed", description: "Worker removed from shortlist." });
      } else {
        await api.post(`/employer/workers/${workerId}/shortlist/`, {
          job_id: selectedJob.id,
          notes: notesByWorker[workerId] || "",
        });
        toast({ title: "Saved", description: "Worker saved to shortlist." });
      }
      await fetchShortlistedWorkers(selectedJob.id);
    } catch {
      toast({ title: "Error", description: "Unable to update shortlist.", variant: "destructive" });
    }
  };

  const handleToggleCompare = (workerId: number) => {
    setComparedWorkers([]);
    setCompareSelection((prev) => {
      if (prev.includes(workerId)) return prev.filter((id) => id !== workerId);
      if (prev.length >= 3) {
        toast({ title: "Limit reached", description: "You can compare up to 3 workers." });
        return prev;
      }
      return [...prev, workerId];
    });
  };

  const handleRunCompare = async () => {
    if (compareSelection.length < 2) {
      toast({ title: "Select Workers", description: "Pick at least 2 workers to compare.", variant: "destructive" });
      return;
    }
    try {
      const response = await api.get("/employer/compare-workers/", {
        params: { worker_ids: compareSelection.join(",") },
      });
      setComparedWorkers(response.data || []);
    } catch {
      toast({ title: "Error", description: "Compare request failed.", variant: "destructive" });
    }
  };

  const generateContract = () => {
    const contract = `DOMESTYX EMPLOYMENT AGREEMENT\n\nEmployer: ${user?.first_name || ""} ${user?.last_name || ""}\nWorker: ${contractForm.workerName}\nRole/Job: ${contractForm.jobTitle}\nWork Location: ${contractForm.location}\nMonthly Salary: ${contractForm.salary}\nStart Date: ${contractForm.startDate}\nWork Hours per Week: ${contractForm.hoursPerWeek}\nAccommodation: ${contractForm.accommodation}\n\nAdditional Notes:\n${contractForm.notes || "N/A"}\n\nBoth parties agree to comply with applicable labor laws and platform terms.\nSignature (Employer): ____________________\nSignature (Worker): ______________________\nDate: ___________________`;
    setGeneratedContract(contract);
  };

  const copyContract = async () => {
    if (!generatedContract) return;
    await navigator.clipboard.writeText(generatedContract);
    toast({ title: "Copied", description: "Contract text copied to clipboard." });
  };

  const handleSubmitReview = async (item: any) => {
    const form = reviewForms[item.id] || { rating: "", comment: "" };
    if (!form.rating) {
      toast({ title: "Rating required", description: "Select a rating before submitting.", variant: "destructive" });
      return;
    }
    try {
      await api.post("/reviews/", {
        worker_id: item.worker,
        job_id: item.job,
        rating: Number(form.rating),
        comment: form.comment || "",
      });
      toast({ title: "Feedback saved", description: "Worker feedback submitted successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error || "Unable to submit feedback.", variant: "destructive" });
    }
  };

  const handleSendOffer = async (applicationId: number) => {
    const message = window.prompt("Offer message (optional):", "") || "";
    const contractText = window.prompt("Contract text (optional):", "") || "";
    try {
      await api.post("/employer/offers/", {
        application_id: applicationId,
        message,
        contract_text: contractText,
      });
      toast({ title: "Offer sent", description: "Formal offer sent to worker." });
      await fetchOffers();
    } catch {
      toast({ title: "Error", description: "Unable to send offer.", variant: "destructive" });
    }
  };

  const signOffer = async (offerId: number) => {
    const signatureName = window.prompt("Enter employer signature name:");
    if (!signatureName) return;
    try {
      await api.patch(`/offers/${offerId}/sign/`, { signature_name: signatureName });
      toast({ title: "Signed", description: "Offer signed successfully." });
      await fetchOffers();
    } catch {
      toast({ title: "Error", description: "Unable to sign offer.", variant: "destructive" });
    }
  };

  const downloadOffer = (offer: any) => {
    const content = [
      "DOMESTYX FORMAL OFFER",
      `Job: ${offer.job_title || ""}`,
      `Employer: ${offer.employer_name || ""}`,
      `Worker: ${offer.worker_name || ""}`,
      `Status: ${offer.status || ""}`,
      "",
      "Message:",
      offer.message || "",
      "",
      "Contract:",
      offer.contract_text || "",
      "",
      `Employer Signature: ${offer.employer_signature_name || "N/A"}`,
      `Employer Signed At: ${offer.employer_signed_at || "N/A"}`,
      `Worker Signature: ${offer.worker_signature_name || "N/A"}`,
      `Worker Signed At: ${offer.worker_signed_at || "N/A"}`,
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `offer-${offer.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartChat = async (workerId: number, jobId?: number) => {
    try {
      const response = await api.post("/chat/threads/", {
        worker_id: workerId,
        job_id: jobId || undefined,
      });
      const threadId = response.data?.id;
      await fetchThreads();
      if (threadId) {
        setActiveThreadId(threadId);
        setViewMode("chat");
      }
    } catch {
      toast({ title: "Error", description: "Unable to start chat.", variant: "destructive" });
    }
  };

  const handleSendMessage = async () => {
    if (!activeThreadId || !messageText.trim()) return;
    try {
      await api.post(`/chat/threads/${activeThreadId}/messages/`, { message: messageText.trim() });
      setMessageText("");
      await fetchMessages(activeThreadId);
      await fetchThreads();
    } catch {
      toast({ title: "Error", description: "Unable to send message.", variant: "destructive" });
    }
  };

  const handleCallAction = async (action: "request" | "accept" | "reject" | "end", callId?: number) => {
    if (!activeThreadId) return;
    try {
      if (action === "request") {
        await api.post(`/chat/threads/${activeThreadId}/calls/`, {});
      } else {
        await api.patch(`/chat/threads/${activeThreadId}/calls/`, { call_id: callId, action });
      }
      await fetchCalls(activeThreadId);
    } catch (err: any) {
      toast({ title: "Call error", description: err?.response?.data?.error || "Unable to process call action.", variant: "destructive" });
    }
  };

  if (!user || isLoading) return <div className="p-10 text-center font-medium">Loading Dashboard...</div>;

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-white/90 backdrop-blur">
        <div className="page-wrap flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link to="/" className="text-2xl font-bold text-primary">DomestyX</Link>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">Employer Portal</Badge>
        </div>
        <div className="flex space-x-2 sm:space-x-3">
          <Button onClick={() => navigate("/employer/post-job")} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Post Job
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/employer/support-services")}>
            Support Services
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { logout(); navigate("/"); }}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
        </div>
      </header>

      <main className="page-wrap space-y-6 py-6 md:py-8">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user.first_name || "Employer"}!</h1>
          <div className="flex w-full flex-wrap gap-1 rounded-xl border border-border/70 bg-secondary/60 p-1 md:w-auto">
            <Button variant={viewMode === "active" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("active")} className={viewMode === "active" ? "bg-white shadow-sm" : ""}><Briefcase className="w-4 h-4 mr-2" /> Active</Button>
            <Button variant={viewMode === "history" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("history")} className={viewMode === "history" ? "bg-white shadow-sm" : ""}><History className="w-4 h-4 mr-2" /> History</Button>
            <Button variant={viewMode === "offers" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("offers")} className={viewMode === "offers" ? "bg-white shadow-sm" : ""}><FileText className="w-4 h-4 mr-2" /> Offers</Button>
            <Button variant={viewMode === "shortlist" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("shortlist")} className={viewMode === "shortlist" ? "bg-white shadow-sm" : ""}><Star className="w-4 h-4 mr-2" /> Shortlist</Button>
            <Button variant={viewMode === "compare" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("compare")} className={viewMode === "compare" ? "bg-white shadow-sm" : ""}><Scale className="w-4 h-4 mr-2" /> Compare</Button>
            <Button variant={viewMode === "chat" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("chat")} className={viewMode === "chat" ? "bg-white shadow-sm" : ""}><MessageCircle className="w-4 h-4 mr-2" /> Chat</Button>
            <Button variant={viewMode === "contracts" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("contracts")} className={viewMode === "contracts" ? "bg-white shadow-sm" : ""}><FileText className="w-4 h-4 mr-2" /> Contracts</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="glass-card border-slate-200"><CardContent className="p-4"><p className="text-xs text-slate-500">Jobs Posted</p><p className="text-xl font-bold">{metrics.totalJobs}</p></CardContent></Card>
          <Card className="glass-card border-slate-200"><CardContent className="p-4"><p className="text-xs text-slate-500">Applicants</p><p className="text-xl font-bold">{metrics.totalApplicants}</p></CardContent></Card>
          <Card className="glass-card border-slate-200"><CardContent className="p-4"><p className="text-xs text-slate-500">Accepted</p><p className="text-xl font-bold text-green-600">{metrics.hiredCount}</p></CardContent></Card>
          <Card className="glass-card border-slate-200"><CardContent className="p-4"><p className="text-xs text-slate-500">Rejected</p><p className="text-xl font-bold text-red-600">{metrics.rejectedCount}</p></CardContent></Card>
        </div>

        {viewMode === "active" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <h2 className="font-semibold text-lg text-slate-700">Your Job Postings</h2>
                {jobs.length === 0 ? (
                  <div className="p-12 border-2 border-dashed rounded-xl text-center text-slate-400">No jobs posted yet.</div>
                ) : jobs.map((job: any) => (
                  <Card key={job.id} onClick={() => setSelectedJob(job)} className={`cursor-pointer transition-all border-l-4 ${selectedJob?.id === job.id ? "border-primary shadow-md bg-white" : "border-transparent"}`}>
                    <CardContent className="p-5 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg">{job.title}</h3>
                        <div className="flex space-x-4 text-sm text-slate-500 mt-1">
                          <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> {job.applicants?.length || 0} applicants</span>
                          <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {job.location}</span>
                          <Badge variant="outline" className="capitalize">{job.status || "active"}</Badge>
                          <Badge variant={job.review_status === "approved" ? "default" : "secondary"} className="capitalize">
                            Review: {job.review_status || "pending"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleJobStatusChange(job.id, job.status === "active" ? "closed" : "active");
                          }}
                        >
                          {job.status === "active" ? "Close" : "Reopen"}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); void handleDeleteJob(job.id); }}>
                          <Trash2 className="w-4 h-4 text-slate-300 hover:text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="lg:col-span-1">
                <h2 className="font-semibold text-lg text-slate-700 mb-4">Applicant Review</h2>
                {!selectedJob ? (
                  <div className="p-8 border-2 border-dashed rounded-xl text-center text-slate-400">Select a job to see applicants.</div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 mb-4">
                      <p className="text-xs font-bold text-primary uppercase">Reviewing for:</p>
                      <p className="font-bold text-slate-800">{selectedJob.title}</p>
                      <p className="text-xs text-slate-600 mt-1">Publish Review: {selectedJob.review_status || "pending"}</p>
                      {selectedJob.review_status !== "approved" && (
                        <p className="text-xs text-amber-700 mt-1">This job is not publicly visible until approved by review team.</p>
                      )}
                    </div>
                    {selectedJob.review_status !== "approved" ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
                        Applications are blocked while this job is in {selectedJob.review_status || "pending"} review state.
                      </div>
                    ) : selectedJob.applicants?.length === 0 ? (
                      <div className="rounded-xl border border-border/60 bg-secondary/40 p-8 text-center text-slate-500">No applicants yet.</div>
                    ) : selectedJob.applicants.map((app: any) => (
                      <Card key={app.id}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={app.worker_details?.profile_image} />
                              <AvatarFallback className="bg-secondary">{app.worker_details?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-slate-900 truncate">{app.worker_details?.name}</p>
                              <p className="text-xs text-slate-500">{app.worker_details?.experience || "No experience listed"}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {app.worker_details?.email && (
                              <a href={`mailto:${app.worker_details.email}`} className="inline-flex">
                                <Button variant="outline" size="sm"><Mail className="w-4 h-4 mr-1" /> Email</Button>
                              </a>
                            )}
                            {app.worker_details?.phone && (
                              <a href={`tel:${app.worker_details.phone}`} className="inline-flex">
                                <Button variant="outline" size="sm"><Phone className="w-4 h-4 mr-1" /> Call</Button>
                              </a>
                            )}
                          </div>

                          <div className="flex space-x-2">
                            {app.status === "applied" || app.status === "pending" ? (
                              <>
                                <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => void handleStatusUpdate(app.id, "accepted")}>Accept</Button>
                                <Button size="sm" variant="outline" className="flex-1 text-red-600 hover:bg-red-50" onClick={() => void handleStatusUpdate(app.id, "rejected")}>Reject</Button>
                              </>
                            ) : (
                              <div className="w-full space-y-2">
                                <Badge className={`w-full justify-center py-1 ${app.status === "hired" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                  {app.status === "hired" ? "ACCEPTED" : app.status.toUpperCase()}
                                </Badge>
                                {app.status === "hired" && (
                                  <Button size="sm" className="w-full" onClick={() => void handleSendOffer(app.id)}>Send Formal Offer</Button>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-semibold text-lg text-slate-700">Recommended Workers (AI Match)</h2>
              {!selectedJob ? (
                <Card><CardContent className="p-6 text-slate-400">Select a job to load recommendations.</CardContent></Card>
              ) : recommendedWorkers.length === 0 ? (
                <Card><CardContent className="p-6 text-slate-400">No recommended workers found for this job yet.</CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendedWorkers.map((worker: any) => {
                    const workerId = worker.worker_id;
                    const saved = isShortlisted(workerId);
                    return (
                      <Card key={workerId}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">{worker.name}</p>
                              <p className="text-xs text-slate-500">Experience: {worker.experience || "N/A"}</p>
                            </div>
                            <Badge variant="outline">Match {worker.match_score || 0}</Badge>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {worker.email && <a href={`mailto:${worker.email}`}><Button variant="outline" size="sm"><Mail className="w-4 h-4 mr-1" /> Email</Button></a>}
                            {worker.phone && <a href={`tel:${worker.phone}`}><Button variant="outline" size="sm"><Phone className="w-4 h-4 mr-1" /> Call</Button></a>}
                            <Button variant="outline" size="sm" onClick={() => void handleStartChat(workerId, selectedJob?.id)}><MessageCircle className="w-4 h-4 mr-1" /> Chat</Button>
                          </div>

                          <Input
                            placeholder="Shortlist note (optional)"
                            value={notesByWorker[workerId] || ""}
                            onChange={(e) => setNotesByWorker((prev) => ({ ...prev, [workerId]: e.target.value }))}
                          />

                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1" variant={saved ? "outline" : "default"} onClick={() => void handleToggleShortlist(workerId)}>
                              {saved ? <><X className="w-4 h-4 mr-1" /> Remove</> : <><Star className="w-4 h-4 mr-1" /> Save</>}
                            </Button>
                            <Button size="sm" variant={compareSelection.includes(workerId) ? "default" : "outline"} onClick={() => handleToggleCompare(workerId)}>
                              <Scale className="w-4 h-4 mr-1" /> Compare
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === "history" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg text-slate-700">Decision History</h2>
            {history.length === 0 ? (
              <Card className="p-12 text-center text-slate-400">No past decisions recorded.</Card>
            ) : history.map((item: any) => (
              <Card key={item.id} className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-center space-x-4 min-w-0">
                    <Avatar>
                      <AvatarImage src={item.worker_details?.profile_image} />
                      <AvatarFallback>{item.worker_details?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{item.worker_details?.name}</p>
                      <p className="text-sm text-slate-500 truncate">Job: {item.job_details?.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => void handleStartChat(item.worker, item.job)}>
                      <MessageCircle className="w-4 h-4 mr-1" /> Chat
                    </Button>
                    <Badge variant={item.status === "hired" ? "default" : "destructive"}>
                      {item.status === "hired" ? "ACCEPTED" : item.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {item.status === "hired" && (
                  <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      placeholder="Rating (1-5)"
                      value={reviewForms[item.id]?.rating || ""}
                      onChange={(e) => setReviewForms((prev) => ({
                        ...prev,
                        [item.id]: { rating: e.target.value, comment: prev[item.id]?.comment || "" },
                      }))}
                    />
                    <Input
                      className="md:col-span-2"
                      placeholder="Feedback comment (optional)"
                      value={reviewForms[item.id]?.comment || ""}
                      onChange={(e) => setReviewForms((prev) => ({
                        ...prev,
                        [item.id]: { rating: prev[item.id]?.rating || "", comment: e.target.value },
                      }))}
                    />
                    <div className="md:col-span-3">
                      <Button size="sm" onClick={() => void handleSubmitReview(item)}>Submit Feedback</Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {viewMode === "offers" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg text-slate-700">Sent Offers</h2>
            {offers.length === 0 ? (
              <Card><CardContent className="p-8 text-slate-400 text-center">No offers sent yet.</CardContent></Card>
            ) : offers.map((offer: any) => (
              <Card key={offer.id}>
                <CardContent className="p-4 space-y-2">
                  <p className="font-semibold text-slate-900">{offer.job_title}</p>
                  <p className="text-sm text-slate-600">Worker: {offer.worker_name || offer.worker}</p>
                  <p className="text-sm text-slate-600">Status: {offer.status}</p>
                  <p className="text-sm text-slate-600">Message: {offer.message || "N/A"}</p>
                  <p className="text-sm text-slate-600">Employer Signature: {offer.employer_signature_name || "Not signed"}</p>
                  <p className="text-sm text-slate-600">Worker Signature: {offer.worker_signature_name || "Not signed"}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => void signOffer(offer.id)}>Sign</Button>
                    <Button size="sm" variant="outline" onClick={() => downloadOffer(offer)}>Download Offer</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {viewMode === "shortlist" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg text-slate-700">Saved / Shortlisted Workers</h2>
            {shortlistedWorkers.length === 0 ? (
              <Card><CardContent className="p-10 text-center text-slate-400">No shortlisted workers yet.</CardContent></Card>
            ) : shortlistedWorkers.map((item: any) => (
              <Card key={item.id}>
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar>
                      <AvatarImage src={item.worker_details?.profile_image} />
                      <AvatarFallback>{item.worker_details?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{item.worker_details?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{item.job_details?.title || "General shortlist"}</p>
                      <p className="text-xs text-slate-500 truncate">{item.notes || "No notes"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {item.worker_details?.email && <a href={`mailto:${item.worker_details.email}`}><Button variant="outline" size="sm"><Mail className="w-4 h-4 mr-1" /> Email</Button></a>}
                    {item.worker_details?.phone && <a href={`tel:${item.worker_details.phone}`}><Button variant="outline" size="sm"><Phone className="w-4 h-4 mr-1" /> Call</Button></a>}
                    <Button variant="outline" size="sm" onClick={() => void handleStartChat(item.worker_details?.id, item.job_details?.id)}><MessageCircle className="w-4 h-4 mr-1" /> Chat</Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggleCompare(item.worker_details?.id)}><Scale className="w-4 h-4 mr-1" /> Compare</Button>
                    <Button variant="outline" size="sm" onClick={() => void handleToggleShortlist(item.worker_details?.id)}><Trash2 className="w-4 h-4 mr-1" /> Remove</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {viewMode === "compare" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg text-slate-700">Compare Workers</h2>
              <Button onClick={() => void handleRunCompare()}><Check className="w-4 h-4 mr-1" /> Run Compare</Button>
            </div>
            <p className="text-sm text-slate-500">Select up to 3 shortlisted workers and compare profile, skills, and hiring history.</p>

            {shortlistedWorkers.length === 0 ? (
              <Card><CardContent className="p-8 text-slate-400 text-center">Shortlist workers first to compare.</CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {shortlistedWorkers.map((item: any) => {
                  const workerId = item.worker_details?.id;
                  const selected = compareSelection.includes(workerId);
                  return (
                    <Card key={item.id} className={selected ? "border-primary" : ""}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.worker_details?.name}</p>
                          <p className="text-xs text-slate-500">{item.worker_details?.experience || "N/A"}</p>
                        </div>
                        <Button size="sm" variant={selected ? "default" : "outline"} onClick={() => handleToggleCompare(workerId)}>
                          {selected ? "Selected" : "Select"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {comparedWorkers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comparedWorkers.map((worker: any) => (
                    <Card key={worker.id}>
                    <CardContent className="p-4 space-y-2">
                      <p className="text-lg font-bold">{worker.name}</p>
                      <p className="text-sm text-slate-500">Experience: {worker.experience || "N/A"}</p>
                      <p className="text-sm text-slate-500">Gender: {worker.gender || "N/A"}</p>
                      <p className="text-sm text-slate-500">Nationality: {worker.nationality || "N/A"}</p>
                      <p className="text-sm text-slate-500">Job Roles: {(worker.job_roles || worker.services || []).join(", ") || "N/A"}</p>
                      <p className="text-sm text-slate-500">Skills: {(worker.services || []).join(", ") || "N/A"}</p>
                      <p className="text-sm text-slate-500">Languages: {(worker.languages || []).join(", ") || "N/A"}</p>
                      <p className="text-sm text-slate-500">Availability: {(worker.availability || []).join(", ") || "N/A"}</p>
                      <p className="text-sm text-slate-500">Work Preference: {worker.work_preference || "N/A"}</p>
                      <p className="text-sm text-slate-500">Preferred Locations: {(worker.preferred_work_locations || []).join(", ") || "N/A"}</p>
                      <p className="text-sm text-slate-500">Willing to Relocate: {worker.willing_to_relocate ? "Yes" : "No"}</p>
                      <p className="text-sm text-slate-500">Expected Salary (hourly): {worker.expected_salary_hourly ? `AED ${worker.expected_salary_hourly}` : "N/A"}</p>
                      <p className="text-sm text-slate-500">Expected Salary (full-time): {worker.expected_salary_full_time ? `AED ${worker.expected_salary_full_time}` : "N/A"}</p>
                      <p className="text-sm text-slate-500">Expected Salary (part-time): {worker.expected_salary_part_time ? `AED ${worker.expected_salary_part_time}` : "N/A"}</p>
                      <p className="text-sm text-slate-500">Expected Benefits: {(worker.expected_benefits || []).join(", ") || "N/A"}</p>
                      <p className="text-sm text-slate-500">Available From: {worker.available_from || "N/A"}</p>
                      <p className="text-sm text-slate-500">Location: {[worker.location?.city, worker.location?.state, worker.location?.country].filter(Boolean).join(", ") || "N/A"}</p>
                      <p className="text-sm text-slate-500">Verified: {worker.is_verified ? "Yes" : "No"}</p>
                      <p className="text-sm text-slate-500">Visa Type: {worker.visa_type || "N/A"}</p>
                      <p className="text-sm text-slate-500">Work Permit: {worker.work_permit_status || "N/A"}</p>
                      <p className="text-sm text-slate-500">Police Clearance: {worker.police_clearance_available ? "Yes" : "No"}</p>
                      <p className="text-sm text-slate-500">Criminal Record: {worker.has_criminal_record ? "Yes" : "No"}</p>
                      <p className="text-sm text-slate-500">Applications: {worker.total_applications || 0}</p>
                      <p className="text-sm text-slate-500">Hired: {worker.total_hired || 0}</p>
                      {worker.email && <a className="text-sm text-primary underline" href={`mailto:${worker.email}`}>Email</a>}
                      {worker.phone && <a className="text-sm text-primary underline block" href={`tel:${worker.phone}`}>Call</a>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === "chat" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardContent className="p-4 space-y-3">
                <h2 className="font-semibold text-lg text-slate-700">Conversations</h2>
                {threads.length === 0 ? (
                  <p className="text-sm text-slate-500">No conversations yet. Start chat from History or Shortlist.</p>
                ) : (
                  threads.map((thread: any) => (
                    <button
                      key={thread.id}
                      className={`w-full rounded-lg border p-3 text-left ${activeThreadId === thread.id ? "border-primary bg-primary/5" : "border-border"}`}
                      onClick={() => setActiveThreadId(thread.id)}
                    >
                      <p className="font-medium text-slate-900 truncate">{thread.worker_name || "Worker"}{thread.job_title ? ` · ${thread.job_title}` : ""}</p>
                      <p className="text-xs text-slate-500 truncate">{thread.last_message?.message || "No messages yet"}</p>
                      {thread.unread_count > 0 && <Badge className="mt-2">{thread.unread_count} new</Badge>}
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardContent className="p-4 space-y-3">
                <h2 className="font-semibold text-lg text-slate-700">Messages</h2>
                {!activeThreadId ? (
                  <p className="text-sm text-slate-500">Select a conversation to view messages.</p>
                ) : (
                  <>
                    {(() => {
                      const activeCall = calls.find((c: any) => c.status === "requested" || c.status === "accepted");
                      return (
                        <div className="flex flex-wrap gap-2">
                          {!activeCall && <Button size="sm" variant="outline" onClick={() => void handleCallAction("request")}>Request Call</Button>}
                          {activeCall && activeCall.status === "requested" && activeCall.receiver === user?.id && (
                            <>
                              <Button size="sm" onClick={() => void handleCallAction("accept", activeCall.id)}>Accept Call</Button>
                              <Button size="sm" variant="outline" onClick={() => void handleCallAction("reject", activeCall.id)}>Reject</Button>
                            </>
                          )}
                          {activeCall && activeCall.status === "accepted" && (
                            <Button size="sm" variant="destructive" onClick={() => void handleCallAction("end", activeCall.id)}>End Call</Button>
                          )}
                        </div>
                      );
                    })()}
                    <div className="h-[360px] overflow-y-auto rounded-lg border p-3 space-y-2">
                      {messages.length === 0 ? (
                        <p className="text-sm text-slate-500">No messages yet.</p>
                      ) : (
                        messages.map((msg: any) => (
                          <div key={msg.id} className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.sender === user?.id ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary text-slate-800"}`}>
                            <p>{msg.message}</p>
                            <p className={`mt-1 text-[10px] ${msg.sender === user?.id ? "text-primary-foreground/80" : "text-slate-500"}`}>
                              {new Date(msg.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void handleSendMessage();
                          }
                        }}
                      />
                      <Button onClick={() => void handleSendMessage()}>Send</Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {viewMode === "contracts" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="font-semibold text-lg text-slate-700">Contract Generator</h2>
                <div className="space-y-2">
                  <Label>Worker Name</Label>
                  <Input value={contractForm.workerName} onChange={(e) => setContractForm((p) => ({ ...p, workerName: e.target.value }))} placeholder="Worker full name" />
                </div>
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input value={contractForm.jobTitle} onChange={(e) => setContractForm((p) => ({ ...p, jobTitle: e.target.value }))} placeholder="Nanny / Cleaner / Cook" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Salary</Label>
                    <Input value={contractForm.salary} onChange={(e) => setContractForm((p) => ({ ...p, salary: e.target.value }))} placeholder="AED 2500/month" />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={contractForm.startDate} onChange={(e) => setContractForm((p) => ({ ...p, startDate: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Hours/Week</Label>
                    <Input value={contractForm.hoursPerWeek} onChange={(e) => setContractForm((p) => ({ ...p, hoursPerWeek: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input value={contractForm.location} onChange={(e) => setContractForm((p) => ({ ...p, location: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Accommodation</Label>
                  <Input value={contractForm.accommodation} onChange={(e) => setContractForm((p) => ({ ...p, accommodation: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={contractForm.notes} onChange={(e) => setContractForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Any additional legal or work terms" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={generateContract}><FileText className="w-4 h-4 mr-1" /> Generate</Button>
                  <Button variant="outline" onClick={() => void copyContract()}>Copy</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h2 className="font-semibold text-lg text-slate-700 mb-3">Contract Preview</h2>
                <pre className="min-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-secondary/40 p-4 text-sm text-slate-700">
                  {generatedContract || "Generate contract to preview here."}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default EmployerDashboard;
