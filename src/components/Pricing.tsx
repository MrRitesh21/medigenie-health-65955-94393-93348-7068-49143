import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Basic",
    price: "₹2,000",
    period: "/month",
    description: "Perfect for small clinics starting their digital journey",
    features: [
      "Electronic Medical Records",
      "Appointment Management",
      "Digital Prescriptions",
      "Patient Records Storage",
      "Basic Analytics",
      "Email Support"
    ],
    popular: false
  },
  {
    name: "Professional",
    price: "₹8,000",
    period: "/month",
    description: "Most popular for growing medical practices",
    features: [
      "Everything in Basic",
      "Teleconsultation (Video Calls)",
      "Billing & Invoicing",
      "Pharmacy Integration",
      "SMS & WhatsApp Reminders",
      "Advanced Analytics",
      "Priority Support"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "₹15,000",
    period: "/month",
    description: "Complete solution for multi-doctor clinics",
    features: [
      "Everything in Professional",
      "AI Symptom Checker",
      "AI Prescription Assistant",
      "Voice-to-Text Dictation",
      "Medical Report Summarizer",
      "Multi-doctor Support",
      "Custom Integrations",
      "24/7 Dedicated Support"
    ],
    popular: false
  }
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent
            <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Choose the perfect plan for your clinic. All plans include free updates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-2xl border ${
                plan.popular
                  ? "border-primary shadow-2xl shadow-primary/20 scale-105"
                  : "border-border"
              } bg-card hover:border-primary/50 transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground mb-2">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-primary/10 mt-0.5">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/auth?mode=signup">
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Annual plans save 20%. Need a custom plan?{" "}
            <a href="#" className="text-primary hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </section>
  );
};
