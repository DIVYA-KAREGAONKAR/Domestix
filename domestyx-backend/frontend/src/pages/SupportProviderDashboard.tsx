import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";

const SupportProviderDashboard = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    company_name: "",
    service_categories: [] as string[],
    contact_information: "",
  });
  const [categoryText, setCategoryText] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");

  const load = async () => {
    try {
      const [profileRes, requestsRes] = await Promise.all([
        api.get("/support/profile/"),
        api.get("/support/requests/"),
      ]);
      setProfile(profileRes.data || {});
      setCategoryText((profileRes.data?.service_categories || []).join(", "));
      setRequests(requestsRes.data || []);
    } catch {
      toast({ title: "Error", description: "Unable to load support provider data.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/support-provider/login");
      return;
    }
    void load();
  }, [isAuthenticated]);

  const saveProfile = async () => {
    try {
      await api.put("/support/profile/", {
        ...profile,
        service_categories: categoryText.split(",").map((i) => i.trim()).filter(Boolean),
      });
      toast({ title: "Saved", description: "Support provider profile updated." });
      await load();
    } catch {
      toast({ title: "Error", description: "Profile update failed.", variant: "destructive" });
    }
  };

  const updateRequest = async (id: number, status: string) => {
    try {
      await api.patch(`/support/requests/${id}/`, { status });
      await load();
    } catch {
      toast({ title: "Error", description: "Unable to update request status.", variant: "destructive" });
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
    <div className="app-shell">
      <header className="border-b border-border/70 bg-white/90 backdrop-blur">
        <div className="page-wrap flex h-16 items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">DomestyX</Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">{user?.first_name || "Support Provider"}</span>
            <Button variant="outline" size="sm" onClick={() => { logout(); navigate("/"); }}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="page-wrap space-y-6 py-6">
        <Card className="glass-card border-slate-200">
          <CardHeader><CardTitle>Support Provider Profile</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1"><Label>Company Name</Label><Input value={profile.company_name} onChange={(e) => setProfile((p) => ({ ...p, company_name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Service Categories</Label><Input value={categoryText} onChange={(e) => setCategoryText(e.target.value)} placeholder="visa processing, legal consultancy" /></div>
            <div className="space-y-1"><Label>Contact</Label><Input value={profile.contact_information} onChange={(e) => setProfile((p) => ({ ...p, contact_information: e.target.value }))} /></div>
            <div className="md:col-span-3"><Button className="btn-primary" onClick={() => void saveProfile()}>Save Profile</Button></div>
          </CardContent>
        </Card>

        <Card className="glass-card border-slate-200">
          <CardHeader><CardTitle>Service Requests</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-sm text-slate-500">No service requests assigned yet.</p>
            ) : requests.map((r) => (
              <div key={r.id} className="rounded-lg border p-3 space-y-2">
                <p className="font-medium text-slate-900">Request #{r.id} · {r.service_type}</p>
                <p className="text-sm text-slate-600">Requester: {r.requester_name || r.requester}</p>
                <p className="text-sm text-slate-600">Details: {r.details || "N/A"}</p>
                <p className="text-sm text-slate-600">Status: {r.status}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => void updateRequest(r.id, "accepted")}>Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => void updateRequest(r.id, "completed")}>Complete</Button>
                  <Button size="sm" variant="outline" onClick={() => void updateRequest(r.id, "cancelled")}>Cancel</Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setActiveRequestId(r.id);
                      void fetchMessages(r.id);
                    }}
                  >
                    Open Chat
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card border-slate-200">
          <CardHeader><CardTitle>Request Chat</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!activeRequestId ? (
              <p className="text-sm text-slate-500">Select a request and click Open Chat.</p>
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
      </main>
    </div>
  );
};

export default SupportProviderDashboard;
