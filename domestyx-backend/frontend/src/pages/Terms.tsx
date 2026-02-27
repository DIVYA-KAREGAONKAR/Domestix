import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Terms = () => {
  return (
    <div className="app-shell py-8">
      <div className="page-wrap space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Terms and Conditions</h1>
          <Link to="/"><Button variant="outline">Back</Button></Link>
        </div>
        <Card className="glass-card border-slate-200">
          <CardHeader><CardTitle>Platform Terms</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>You must be 18+ to register and use the platform.</p>
            <p>Users must provide accurate profile and job information.</p>
            <p>Employers must follow legal, fair, and non-discriminatory hiring practices.</p>
            <p>Workers must provide valid legal work information where required.</p>
            <p>The platform facilitates matching and communication, but hiring decisions and contracts are user responsibility.</p>
            <p>Fraud, harassment, fake profiles, and illegal activities may lead to account suspension or removal.</p>
            <p>By using this platform, you agree to these terms and applicable laws.</p>
            <p>For privacy details, review the <Link className="text-primary underline" to="/privacy">Privacy Policy</Link>.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
