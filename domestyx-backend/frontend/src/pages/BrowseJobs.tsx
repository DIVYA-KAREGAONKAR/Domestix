import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/services/api";

const BrowseJobs = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  const fetchJobs = async () => {
    try {
      const response = await api.get("/jobs/public/", {
        params: { search, category, location },
      });
      setJobs(response.data || []);
    } catch {
      setJobs([]);
    }
  };

  useEffect(() => {
    void fetchJobs();
  }, []);

  return (
    <div className="app-shell py-8">
      <div className="page-wrap space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">Browse Jobs</h1>
          <Link to="/"><Button variant="outline">Back</Button></Link>
        </div>

        <Card>
          <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-4">
            <div><Label>Search</Label><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="title, description" /></div>
            <div><Label>Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="full-time, cleaner" /></div>
            <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="city or country" /></div>
            <div className="flex items-end"><Button className="w-full" onClick={() => void fetchJobs()}>Search</Button></div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id} className="glass-card border-slate-200">
              <CardHeader><CardTitle className="text-lg">{job.title}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p><span className="font-medium text-slate-800">Location:</span> {job.location || "N/A"}</p>
                <p><span className="font-medium text-slate-800">Salary:</span> {job.salary || "N/A"}</p>
                <p><span className="font-medium text-slate-800">Type:</span> {job.job_type || "N/A"}</p>
                <p><span className="font-medium text-slate-800">Description:</span> {job.description || "N/A"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrowseJobs;
