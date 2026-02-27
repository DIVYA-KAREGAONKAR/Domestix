import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, Briefcase, Building2, Globe2, ShieldCheck, Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="app-shell">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-white/90 backdrop-blur">
        <div className="page-wrap flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-slate-900">DOMESTYX</p>
              <p className="text-xs text-slate-500">Domestic Hiring Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/worker/login">
              <Button variant="ghost" className="font-medium">Worker Login</Button>
            </Link>
            <Link to="/employer/login">
              <Button className="btn-primary">Employer Login</Button>
            </Link>
            <Link to="/agency/login">
              <Button variant="outline" className="font-medium">Agency</Button>
            </Link>
            <Link to="/government/login">
              <Button variant="outline" className="font-medium">Government</Button>
            </Link>
            <Link to="/support-provider/login">
              <Button variant="outline" className="font-medium">Support</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="page-wrap py-16 md:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
                <Sparkles className="h-4 w-4" />
                Trusted Hiring Platform
              </div>
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-6xl">
                Professional Domestic Hiring, Designed for International Standards
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-slate-600">
                Domestyx connects verified workers and serious employers with structured profiles, clear requirements, and faster hiring decisions.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/browse-workers">
                  <Button size="lg" variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/5 sm:w-auto">
                    Browse Workers
                  </Button>
                </Link>
                <Link to="/browse-jobs">
                  <Button size="lg" variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/5 sm:w-auto">
                    Browse Jobs
                  </Button>
                </Link>
                <Link to="/employer/register">
                  <Button size="lg" className="btn-primary w-full sm:w-auto">Post a Job</Button>
                </Link>
                <Link to="/worker/register">
                  <Button size="lg" variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/5 sm:w-auto">
                    Create Worker Profile
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="glass-card border-slate-200">
              <CardContent className="space-y-5 p-6 md:p-8">
                <h2 className="text-xl font-semibold text-slate-900">Platform Highlights</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <BadgeCheck className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-slate-900">Verified Worker Profiles</p>
                      <p className="text-sm text-slate-600">Profile data supports legal and compliance-friendly hiring.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-slate-900">Safer Hiring Workflow</p>
                      <p className="text-sm text-slate-600">Compare candidates with requirement-matched details before hiring.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe2 className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-slate-900">International Readiness</p>
                      <p className="text-sm text-slate-600">Structured experience, language, location, and documentation signals.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-y border-border/60 bg-white/80 py-14">
          <div className="page-wrap grid gap-4 md:grid-cols-3">
            <Card className="border-slate-200 shadow-none">
              <CardContent className="p-6">
                <Briefcase className="mb-3 h-5 w-5 text-primary" />
                <h3 className="mb-2 text-lg font-semibold text-slate-900">For Employers</h3>
                <p className="text-sm leading-relaxed text-slate-600">Post detailed job requirements, shortlist verified workers, and compare profiles side by side.</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-none">
              <CardContent className="p-6">
                <Building2 className="mb-3 h-5 w-5 text-primary" />
                <h3 className="mb-2 text-lg font-semibold text-slate-900">For Households and Businesses</h3>
                <p className="text-sm leading-relaxed text-slate-600">Find domestic support for homes, offices, cafes, hospitality, and care environments.</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-none">
              <CardContent className="p-6">
                <BadgeCheck className="mb-3 h-5 w-5 text-primary" />
                <h3 className="mb-2 text-lg font-semibold text-slate-900">For Workers</h3>
                <p className="text-sm leading-relaxed text-slate-600">Showcase your full profile, verification status, skills, salary expectations, and availability.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="py-8">
        <div className="page-wrap flex flex-col items-center justify-between gap-3 text-sm text-slate-500 md:flex-row">
          <p>2026 Domestyx. All rights reserved.</p>
          <p>Global Service Region</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
