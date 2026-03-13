import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Shield, Star } from "lucide-react";

const Index = () => {
 return (
   <div className="min-h-screen bg-app-bg">
    <header className="bg-white shadow-sm border-b">
      <div className="section-shell">
        <div className="stacked-header items-center justify-between py-4 md:py-3">
          <Link to="/" className="text-2xl font-bold text-primary">
            DomestyX
          </Link>
          <div className="flex flex-wrap items-center gap-2 justify-end w-full">
            <Link to="/worker/login">
              <Button size="sm" className="btn-primary px-6 py-2 tracking-wide">
                Worker Login
              </Button>
            </Link>
            <Link to="/employer/login">
              <Button size="sm" variant="outline" className="px-6 py-2">
                Employer Login
              </Button>
            </Link>
            <Link to="/agency/login">
              <Button size="sm" variant="ghost" className="px-6 py-2 border">
                Agency
              </Button>
            </Link>
            <Link to="/government/login">
              <Button size="sm" variant="ghost" className="px-6 py-2 border">
                Government
              </Button>
            </Link>
            <Link to="/support-provider/login">
              <Button size="sm" variant="ghost" className="px-6 py-2 border">
                Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>

    <main className="space-y-12 py-12">
      <section className="bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="section-shell">
          <div className="rounded-3xl bg-white/70 p-8 shadow-md shadow-slate-200 md:p-10">
            <div className="grid gap-10 md:grid-cols-[1.1fr,0.9fr] items-center">
              <div className="space-y-8 text-left">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Premium Domestic Help</p>
                  <h2 className="text-3xl md:text-5xl font-bold text-app-text mt-3 leading-tight">
                    Connect with Trusted <span className="text-primary">Domestic Workers</span>
                  </h2>
                </div>
                <p className="text-lg text-slate-600 max-w-3xl">
                  DomestyX bridges the gap between skilled domestic workers and families who need reliable help.
                  Find verified professionals or showcase your services with ease.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/worker/register">
                    <Button size="lg" className="btn-primary px-6 py-3 text-base tracking-wide">
                      I'm a Worker
                    </Button>
                  </Link>
                  <Link to="/employer/register">
                    <Button size="lg" variant="outline" className="px-6 py-3 text-base border-primary text-primary hover:bg-primary hover:text-white">
                      I'm an Employer
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="text-right">
                <div className="hidden md:block text-sm rounded-2xl border border-dashed border-slate-200 p-6">
                  <p className="text-slate-500">Need expert help fast?</p>
                  <p className="text-xl font-semibold text-primary mt-4">Schedule a call with our matching team</p>
                  <p className="text-slate-500 mt-2">We respond within 30 minutes on weekdays.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

       <section className="bg-white">
         <div className="section-shell text-center">
           <div className="mb-12">
             <h3 className="text-3xl font-bold text-app-text mb-4">Why Choose DomestyX?</h3>
             <p className="text-lg text-gray-600">Reliable connections, verified profiles, and secure transactions</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <Card className="text-center hover:shadow-lg transition-shadow duration-300">
               <CardHeader>
                 <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                   <Users className="h-6 w-6 text-primary" />
                 </div>
                 <CardTitle>Verified Profiles</CardTitle>
               </CardHeader>
               <CardContent className="p-6">
                 <CardDescription>
                   All workers go through our verification process to ensure quality and safety
                 </CardDescription>
               </CardContent>
             </Card>

             <Card className="text-center hover:shadow-lg transition-shadow duration-300">
               <CardHeader>
                 <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                   <Briefcase className="h-6 w-6 text-accent" />
                 </div>
                 <CardTitle>Wide Range of Services</CardTitle>
               </CardHeader>
               <CardContent className="p-6">
                 <CardDescription>
                   From cleaning to childcare, find the perfect match for your needs
                 </CardDescription>
               </CardContent>
             </Card>

             <Card className="text-center hover:shadow-lg transition-shadow duration-300">
               <CardHeader>
                 <div className="mx-auto w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-4">
                   <Shield className="h-6 w-6 text-success" />
                 </div>
                 <CardTitle>Secure Platform</CardTitle>
               </CardHeader>
               <CardContent className="p-6">
                 <CardDescription>
                   Your safety and privacy are our top priorities with secure transactions
                 </CardDescription>
               </CardContent>
             </Card>

             <Card className="text-center hover:shadow-lg transition-shadow duration-300">
               <CardHeader>
                 <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                   <Star className="h-6 w-6 text-primary" />
                 </div>
                 <CardTitle>Rated Reviews</CardTitle>
               </CardHeader>
               <CardContent className="p-6">
                 <CardDescription>
                   Read genuine reviews and ratings to make informed decisions
                 </CardDescription>
               </CardContent>
             </Card>
           </div>
         </div>
       </section>

      <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="section-shell py-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-3xl font-bold mb-2">Ready to Get Started?</h3>
              <p className="text-lg text-slate-200 max-w-2xl">
                Join thousands of families and workers trusting DomestyX to streamline domestic hiring.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/worker/register">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 px-6 py-3 text-base">
                  Register as Worker
                </Button>
              </Link>
              <Link to="/employer/register">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 px-6 py-3 text-base">
                  Find Workers
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
     </main>

     <footer className="bg-gray-800 text-white py-8">
       <div className="section-shell text-center">
         <p>&copy; 2024 DomestyX. All rights reserved.</p>
       </div>
     </footer>
   </div>
 );
};

export default Index;
