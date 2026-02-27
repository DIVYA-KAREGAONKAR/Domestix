import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Privacy = () => {
  return (
    <div className="app-shell py-8">
      <div className="page-wrap space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Privacy Policy</h1>
          <Link to="/"><Button variant="outline">Back</Button></Link>
        </div>
        <Card className="glass-card border-slate-200">
          <CardHeader><CardTitle>Data and Privacy</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>We collect profile, contact, and job-related data needed to run matching and hiring workflows.</p>
            <p>We use data for account management, job matching, support, fraud prevention, and compliance.</p>
            <p>We do not sell your personal data.</p>
            <p>Data may be shared with relevant users (employer/worker/provider), legal authorities when required, and technical service providers.</p>
            <p>We use security controls and encourage users to protect account credentials.</p>
            <p>You can request profile updates or account deactivation from settings.</p>
            <p>By using this platform, you agree to this policy and the <Link className="text-primary underline" to="/terms">Terms and Conditions</Link>.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;
