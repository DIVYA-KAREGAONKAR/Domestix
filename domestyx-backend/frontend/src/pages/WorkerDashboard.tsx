import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api"; 
import { Search, MapPin, IndianRupee, CheckCircle, Filter, Clock, Loader2, MessageCircle, Bookmark, Scale } from "lucide-react";

const WorkerDashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'browse' | 'saved' | 'compare' | 'applied' | 'offers' | 'notifications' | 'messages'>('browse');
  const [jobs, setJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [compareSelection, setCompareSelection] = useState<number[]>([]);
  const [comparedJobs, setComparedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ New state to track which job is currently being processed
  const [isApplying, setIsApplying] = useState<number | null>(null);
  const [applicationNotes, setApplicationNotes] = useState<Record<number, string>>({});
  const [applicationFiles, setApplicationFiles] = useState<Record<number, File | null>>({});
  
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [calls, setCalls] = useState<any[]>([]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/worker/available-jobs/", {
        params: { search: searchQuery, category: category !== "all" ? category : "" }
      }); 
      setJobs(response.data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load jobs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliedJobs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/worker/my-applications/");
      setAppliedJobs(response.data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load applications", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/worker/notifications/");
      setNotifications(response.data || []);
    } catch {
      setNotifications([]);
    }
  };

  const fetchOffers = async () => {
    try {
      const response = await api.get("/worker/offers/");
      setOffers(response.data || []);
    } catch {
      setOffers([]);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const response = await api.get("/worker/saved-jobs/");
      setSavedJobs(response.data || []);
    } catch {
      setSavedJobs([]);
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
      navigate('/worker/login');
      return;
    }
    
    // Only fetch if authenticated to prevent extra calls during logout
    const timer = setTimeout(() => {
      if (activeTab === "browse") {
        void fetchJobs();
      } else if (activeTab === "saved" || activeTab === "compare") {
        void fetchSavedJobs();
      } else if (activeTab === "applied") {
        void fetchAppliedJobs();
      } else if (activeTab === "offers") {
        void fetchOffers();
      } else if (activeTab === "notifications") {
        void fetchNotifications();
      } else {
        void fetchThreads();
      }
    }, 300); // 300ms debounce to prevent spamming Render during state changes

    return () => clearTimeout(timer);
  }, [isAuthenticated, activeTab, category]);

  useEffect(() => {
    if (!activeThreadId || activeTab !== "messages") return;
    void fetchMessages(activeThreadId);
    void fetchCalls(activeThreadId);
    const interval = setInterval(() => void fetchMessages(activeThreadId), 5000);
    return () => clearInterval(interval);
  }, [activeThreadId, activeTab]);

  const handleApply = async (jobId: number) => {
    if (isApplying !== null) return; // ✅ Prevent double-clicks immediately

    setIsApplying(jobId);
    try {
      const file = applicationFiles[jobId];
      const note = applicationNotes[jobId] || "";
      if (file) {
        const formData = new FormData();
        formData.append("cover_note", note);
        formData.append("supporting_document", file);
        await api.post(`/jobs/${jobId}/apply/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post(`/jobs/${jobId}/apply/`, { cover_note: note });
      }
      toast({ title: "Success", description: "Application sent successfully!" });
      // Refresh jobs to update the "Applied" status locally
      await fetchJobs(); 
      setApplicationNotes((prev) => ({ ...prev, [jobId]: "" }));
      setApplicationFiles((prev) => ({ ...prev, [jobId]: null }));
    } catch (err: any) {
      const message = err.response?.data?.message || "Application failed.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsApplying(null); // ✅ Release the lock
    }
  };

  const handleSaveJob = async (jobId: number) => {
    try {
      await api.post("/worker/saved-jobs/", { job_id: jobId });
      toast({ title: "Saved", description: "Job saved successfully." });
      await fetchSavedJobs();
    } catch {
      toast({ title: "Error", description: "Unable to save job.", variant: "destructive" });
    }
  };

  const handleRemoveSavedJob = async (jobId: number) => {
    try {
      await api.delete("/worker/saved-jobs/", { params: { job_id: jobId } });
      toast({ title: "Removed", description: "Job removed from saved list." });
      await fetchSavedJobs();
      setCompareSelection((prev) => prev.filter((id) => id !== jobId));
      setComparedJobs((prev) => prev.filter((job: any) => job.id !== jobId));
    } catch {
      toast({ title: "Error", description: "Unable to remove saved job.", variant: "destructive" });
    }
  };

  const handleToggleCompareJob = (jobId: number) => {
    setComparedJobs([]);
    setCompareSelection((prev) => {
      if (prev.includes(jobId)) return prev.filter((id) => id !== jobId);
      if (prev.length >= 3) {
        toast({ title: "Limit reached", description: "You can compare up to 3 jobs." });
        return prev;
      }
      return [...prev, jobId];
    });
  };

  const handleRunCompareJobs = async () => {
    if (compareSelection.length < 2) {
      toast({ title: "Select Jobs", description: "Pick at least 2 jobs to compare.", variant: "destructive" });
      return;
    }
    try {
      const response = await api.get("/worker/compare-jobs/", {
        params: { job_ids: compareSelection.join(",") },
      });
      setComparedJobs(response.data || []);
    } catch {
      toast({ title: "Error", description: "Compare request failed.", variant: "destructive" });
    }
  };

  const respondOffer = async (id: number, status: "accepted" | "rejected") => {
    try {
      await api.patch(`/worker/offers/${id}/respond/`, { status });
      toast({ title: "Updated", description: `Offer ${status}.` });
      await fetchOffers();
      await fetchNotifications();
      await fetchAppliedJobs();
    } catch {
      toast({ title: "Error", description: "Unable to update offer.", variant: "destructive" });
    }
  };

  const signOffer = async (offerId: number) => {
    const signatureName = window.prompt("Enter worker signature name:");
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

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'hired': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'applied': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
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

  if (!user) return null;
  const savedJobIds = new Set(savedJobs.map((item: any) => item.job));

  return (
    <div className="app-shell pb-10">
      <header className="sticky top-0 z-10 border-b border-border/70 bg-white/90 backdrop-blur">
        <div className="page-wrap flex h-16 items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">DomestyX</Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/worker/profile"><Button variant="ghost" size="sm">Profile</Button></Link>
            <Link to="/worker/support-services"><Button variant="ghost" size="sm">Support Services</Button></Link>
            <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="page-wrap py-6 md:py-8">
        <div className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Worker Dashboard</h1>
            <div className="flex w-full gap-1 rounded-xl border border-border/70 bg-secondary/60 p-1 md:w-auto">
                <Button 
                    variant={activeTab === 'browse' ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => setActiveTab('browse')}
                    className={`flex-1 md:flex-none ${activeTab === 'browse' ? "bg-white shadow-sm hover:bg-white" : ""}`}
                >
                    Browse Jobs
                </Button>
                <Button
                    variant={activeTab === 'saved' ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab('saved')}
                    className={`flex-1 md:flex-none ${activeTab === 'saved' ? "bg-white shadow-sm hover:bg-white" : ""}`}
                >
                    <Bookmark className="h-4 w-4 mr-1" /> Saved
                </Button>
                <Button
                    variant={activeTab === 'compare' ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab('compare')}
                    className={`flex-1 md:flex-none ${activeTab === 'compare' ? "bg-white shadow-sm hover:bg-white" : ""}`}
                >
                    <Scale className="h-4 w-4 mr-1" /> Compare
                </Button>
                <Button 
                    variant={activeTab === 'applied' ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => setActiveTab('applied')}
                    className={`flex-1 md:flex-none ${activeTab === 'applied' ? "bg-white shadow-sm hover:bg-white" : ""}`}
                >
                    My Applications
                </Button>
                <Button
                    variant={activeTab === 'offers' ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab('offers')}
                    className={`flex-1 md:flex-none ${activeTab === 'offers' ? "bg-white shadow-sm hover:bg-white" : ""}`}
                >
                    Offers
                </Button>
                <Button
                    variant={activeTab === 'notifications' ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab('notifications')}
                    className={`flex-1 md:flex-none ${activeTab === 'notifications' ? "bg-white shadow-sm hover:bg-white" : ""}`}
                >
                    Notifications
                </Button>
                <Button
                    variant={activeTab === 'messages' ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab('messages')}
                    className={`flex-1 md:flex-none ${activeTab === 'messages' ? "bg-white shadow-sm hover:bg-white" : ""}`}
                >
                    <MessageCircle className="h-4 w-4 mr-1" /> Messages
                </Button>
            </div>
        </div>

        {activeTab === 'browse' ? (
          <>
            <div className="mb-8 flex flex-col md:flex-row gap-4">
              <form onSubmit={(e) => { e.preventDefault(); fetchJobs(); }} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search jobs..." 
                    className="pl-10 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full md:w-[200px] bg-white">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="babysitting">Babysitting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-slate-500">Connecting to server...</p>
                </div>
              ) : jobs.map((job: any) => (
                <Card key={job.id} className="glass-card border-slate-200 transition-shadow hover:shadow-md">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold">{job.title}</h3>
                          <Badge variant="outline" className="capitalize">{job.job_type}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                          <span className="flex items-center"><IndianRupee className="h-4 w-4 mr-1 text-green-600" />{job.salary}</span>
                          <span className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-red-400" />{job.location}</span>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handleApply(job.id)} 
                        disabled={job.has_applied || user?.role !== 'worker' || isApplying === job.id}
                        className={job.has_applied || user?.role !== 'worker' ? "border bg-secondary text-muted-foreground" : ""}
                      >
                        {isApplying === job.id ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                        ) : job.has_applied ? (
                          <><CheckCircle className="h-4 w-4 mr-2"/> Applied</>
                        ) : user?.role !== 'worker' ? (
                          "Worker Only"
                        ) : (
                          "Apply Now"
                        )}
                      </Button>
                      <Button
                        variant={savedJobIds.has(job.id) ? "secondary" : "outline"}
                        onClick={() => savedJobIds.has(job.id) ? void handleRemoveSavedJob(job.id) : void handleSaveJob(job.id)}
                      >
                        <Bookmark className="h-4 w-4 mr-2" />
                        {savedJobIds.has(job.id) ? "Saved" : "Save"}
                      </Button>
                      <Button
                        variant={compareSelection.includes(job.id) ? "default" : "outline"}
                        onClick={() => handleToggleCompareJob(job.id)}
                      >
                        <Scale className="h-4 w-4 mr-2" />
                        {compareSelection.includes(job.id) ? "Selected" : "Compare"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-xs font-medium text-slate-500">Cover Note (optional)</p>
                        <Textarea
                          value={applicationNotes[job.id] || ""}
                          onChange={(e) => setApplicationNotes((prev) => ({ ...prev, [job.id]: e.target.value }))}
                          placeholder="Write a short note for employer"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">Attach Document (optional)</p>
                        <Input
                          type="file"
                          onChange={(e) =>
                            setApplicationFiles((prev) => ({
                              ...prev,
                              [job.id]: e.target.files?.[0] || null,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : activeTab === "saved" ? (
          <div className="grid grid-cols-1 gap-4">
            {savedJobs.length === 0 ? (
              <Card><CardContent className="p-6 text-sm text-slate-500">No saved jobs yet.</CardContent></Card>
            ) : savedJobs.map((item: any) => {
              const job = item.job_details;
              return (
                <Card key={item.id} className="glass-card border-slate-200">
                  <CardContent className="p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{job?.title}</h3>
                      <p className="text-sm text-slate-600">{job?.location} · {job?.salary}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => handleToggleCompareJob(job.id)}>
                        {compareSelection.includes(job.id) ? "Selected" : "Select Compare"}
                      </Button>
                      <Button variant="destructive" onClick={() => void handleRemoveSavedJob(job.id)}>Remove</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : activeTab === "compare" ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-3">
                <p className="text-sm text-slate-600">Select up to 3 saved jobs and compare salary, location, type, and requirements.</p>
                <div className="flex gap-2">
                  <Button onClick={() => void handleRunCompareJobs()}>Run Compare</Button>
                  <Button variant="outline" onClick={() => { setCompareSelection([]); setComparedJobs([]); }}>Clear</Button>
                </div>
              </CardContent>
            </Card>
            {comparedJobs.length > 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {comparedJobs.map((job: any) => (
                  <Card key={job.id}>
                    <CardContent className="space-y-2 p-5">
                      <h3 className="font-semibold text-slate-900">{job.title}</h3>
                      <p className="text-sm text-slate-600">{job.location}</p>
                      <p className="text-sm text-slate-600">Salary: {job.salary}</p>
                      <p className="text-sm text-slate-600">Type: {job.job_type}</p>
                      <p className="text-sm text-slate-600">Experience: {job.experience_required || "N/A"}</p>
                      <p className="text-sm text-slate-600">Languages: {(job.language_requirements || []).join(", ") || "N/A"}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "applied" ? (
          <div className="grid grid-cols-1 gap-4">
            {appliedJobs.map((app: any) => (
                <Card key={app.id} className="glass-card border-l-4 border-l-primary border-slate-200">
                <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold">{app.job_details?.title || "Position Title"}</h3>
                    <div className="flex items-center text-sm text-slate-500">
                      <Clock className="h-3 w-3 mr-1" /> 
                      Applied on {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recent'}
                    </div>
                  </div>
                  <Badge className={`px-4 py-1 border shadow-sm ${getStatusStyles(app.status)}`}>
                    {app.status === 'hired' ? 'ACCEPTED' : app.status.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeTab === "offers" ? (
          <div className="grid grid-cols-1 gap-4">
            {offers.length === 0 ? (
              <Card><CardContent className="p-6 text-sm text-slate-500">No offers yet.</CardContent></Card>
            ) : offers.map((offer: any) => (
              <Card key={offer.id} className="glass-card border-slate-200">
                <CardContent className="p-5 space-y-2">
                  <p className="font-semibold text-slate-900">{offer.job_title}</p>
                  <p className="text-sm text-slate-600">From: {offer.employer_name || offer.employer}</p>
                <p className="text-sm text-slate-600">Status: {offer.status}</p>
                <p className="text-sm text-slate-600">Message: {offer.message || "N/A"}</p>
                {offer.contract_text && <p className="text-sm text-slate-600 whitespace-pre-wrap">Contract: {offer.contract_text}</p>}
                <p className="text-sm text-slate-600">Employer Signature: {offer.employer_signature_name || "Not signed"}</p>
                <p className="text-sm text-slate-600">Worker Signature: {offer.worker_signature_name || "Not signed"}</p>
                <div className="flex gap-2 flex-wrap">
                  {offer.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => void respondOffer(offer.id, "accepted")}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => void respondOffer(offer.id, "rejected")}>Reject</Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={() => void signOffer(offer.id)}>Sign</Button>
                  <Button size="sm" variant="outline" onClick={() => downloadOffer(offer)}>Download Offer</Button>
                </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeTab === "notifications" ? (
          <div className="grid grid-cols-1 gap-4">
            {notifications.length === 0 ? (
              <Card><CardContent className="p-6 text-sm text-slate-500">No notifications yet.</CardContent></Card>
            ) : notifications.map((n: any) => (
              <Card key={n.id} className="glass-card border-slate-200">
                <CardContent className="p-5 space-y-1">
                  <p className="font-medium text-slate-900">{n.message}</p>
                  <p className="text-xs text-slate-500">{new Date(n.updated_at).toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardContent className="p-4 space-y-3">
                <h2 className="font-semibold text-lg text-slate-700">Conversations</h2>
                {threads.length === 0 ? (
                  <p className="text-sm text-slate-500">No conversations yet.</p>
                ) : (
                  threads.map((thread: any) => (
                    <button
                      key={thread.id}
                      className={`w-full rounded-lg border p-3 text-left ${activeThreadId === thread.id ? "border-primary bg-primary/5" : "border-border"}`}
                      onClick={() => setActiveThreadId(thread.id)}
                    >
                      <p className="font-medium text-slate-900 truncate">{thread.employer_name || "Employer"}{thread.job_title ? ` · ${thread.job_title}` : ""}</p>
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
      </main>
    </div>
  );
};

export default WorkerDashboard;
