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

const SupportServices = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [providers, setProviders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [form, setForm] = useState({ provider: "", service_type: "", details: "" });
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");

  const load = async () => {
    try {
      const [providerRes, requestRes] = await Promise.all([
        api.get("/support/providers/"),
        api.get("/support/requests/"),
      ]);
      setProviders(providerRes.data || []);
      setRequests(requestRes.data || []);
    } catch {
      toast({ title: "Error", description: "Unable to load support services.", variant: "destructive" });
    }
  };

  const fetchMessages = async (requestId: number) => {
    try {
      const response = await api.get(`/support/requests/${requestId}/messages/`);
      setMessages(response.data || []);
    } catch {
      setMessages([]);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    void load();
  }, [isAuthenticated]);

  const createRequest = async () => {
    if (!form.provider || !form.service_type.trim()) {
      toast({ title: "Required", description: "Provider and service type are required.", variant: "destructive" });
      return;
    }
    try {
      await api.post("/support/requests/", {
        provider: Number(form.provider),
        service_type: form.service_type.trim(),
        details: form.details.trim(),
      });
      setForm({ provider: "", service_type: "", details: "" });
      toast({ title: "Created", description: "Support request created." });
      await load();
    } catch {
      toast({ title: "Error", description: "Unable to create request.", variant: "destructive" });
    }
  };

  const sendMessage = async () => {
    if (!activeRequestId || !messageText.trim()) return;
    try {
      await api.post(`/support/requests/${activeRequestId}/messages/`, {
        message: messageText.trim(),
      });
      setMessageText("");
      await fetchMessages(activeRequestId);
    } catch {
      toast({ title: "Error", description: "Unable to send message.", variant: "destructive" });
    }
  };

  return (
    <div className="app-shell py-8">
      <div className="page-wrap space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Support Services</h1>
          <Link to={user?.role === "employer" ? "/employer/dashboard" : "/worker/dashboard"}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        <Card className="glass-card border-slate-200">
          <CardHeader><CardTitle>Create Service Request</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label>Support Provider</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.provider}
                onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
              >
                <option value="">Select Provider</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.company_name ? `- ${p.company_name}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1"><Label>Service Type</Label><Input value={form.service_type} onChange={(e) => setForm((f) => ({ ...f, service_type: e.target.value }))} placeholder="visa processing, legal consultancy" /></div>
            <div className="space-y-1"><Label>Details</Label><Textarea value={form.details} onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))} /></div>
            <div className="md:col-span-2"><Button onClick={() => void createRequest()}>Submit Request</Button></div>
          </CardContent>
        </Card>

        <Card className="glass-card border-slate-200">
          <CardHeader><CardTitle>My Service Requests</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-sm text-slate-500">No requests yet.</p>
            ) : requests.map((r) => (
              <div key={r.id} className="rounded-lg border p-3 space-y-2">
                <p className="font-medium text-slate-900">#{r.id} · {r.service_type}</p>
                <p className="text-sm text-slate-600">Provider: {r.provider_name || r.provider}</p>
                <p className="text-sm text-slate-600">Status: {r.status}</p>
                <p className="text-sm text-slate-600">Details: {r.details || "N/A"}</p>
                <Button size="sm" onClick={() => { setActiveRequestId(r.id); void fetchMessages(r.id); }}>Open Chat</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card border-slate-200">
          <CardHeader><CardTitle>Request Chat</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!activeRequestId ? (
              <p className="text-sm text-slate-500">Select a request and open chat.</p>
            ) : (
              <>
                <div className="h-64 overflow-y-auto rounded-lg border p-3 space-y-2">
                  {messages.length === 0 ? (
                    <p className="text-sm text-slate-500">No messages yet.</p>
                  ) : messages.map((m) => (
                    <div key={m.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.sender === user?.id ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary text-slate-800"}`}>
                      <p>{m.message}</p>
                      <p className={`mt-1 text-[10px] ${m.sender === user?.id ? "text-primary-foreground/80" : "text-slate-500"}`}>
                        {new Date(m.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type message..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                  />
                  <Button onClick={() => void sendMessage()}>Send</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupportServices;
