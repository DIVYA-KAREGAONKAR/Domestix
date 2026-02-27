import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/services/api";

const BrowseWorkers = () => {
  const [workers, setWorkers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [location, setLocation] = useState("");

  const fetchWorkers = async () => {
    try {
      const response = await api.get("/workers/public/", {
        params: { search, job_role: jobRole, location },
      });
      setWorkers(response.data || []);
    } catch {
      setWorkers([]);
    }
  };

  useEffect(() => {
    void fetchWorkers();
  }, []);

  return (
    <div className="app-shell py-8">
      <div className="page-wrap space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">Browse Workers</h1>
          <Link to="/"><Button variant="outline">Back</Button></Link>
        </div>

        <Card>
          <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-4">
            <div><Label>Search</Label><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="name, skill" /></div>
            <div><Label>Job Role</Label><Input value={jobRole} onChange={(e) => setJobRole(e.target.value)} placeholder="nanny, cleaner" /></div>
            <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="city or country" /></div>
            <div className="flex items-end"><Button className="w-full" onClick={() => void fetchWorkers()}>Search</Button></div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workers.map((worker) => (
            <Card key={worker.id} className="glass-card border-slate-200">
              <CardHeader><CardTitle className="text-lg">{worker.name}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p><span className="font-medium text-slate-800">Location:</span> {[worker.city, worker.state, worker.country].filter(Boolean).join(", ") || "N/A"}</p>
                <p><span className="font-medium text-slate-800">Experience:</span> {worker.experience || "N/A"}</p>
                <p><span className="font-medium text-slate-800">Services:</span> {(worker.services || []).join(", ") || "N/A"}</p>
                <p><span className="font-medium text-slate-800">Availability:</span> {(worker.availability || []).join(", ") || "N/A"}</p>
                <p><span className="font-medium text-slate-800">Verified:</span> {worker.is_verified ? "Yes" : "No"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrowseWorkers;
