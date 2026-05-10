import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [showInterestForm, setShowInterestForm] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    companyName: '',
    companySize: '',
    phone: '',
    message: ''
  })
  const [formSubmitted, setFormSubmitted] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (showInterestForm) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showInterestForm])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Here you would typically send the data to your backend
    console.log('Form submitted:', formData)
    setFormSubmitted(true)

    // Reset form after 3 seconds and close modal
    setTimeout(() => {
      setShowInterestForm(false)
      setFormSubmitted(false)
      setFormData({
        fullName: '',
        email: '',
        companyName: '',
        companySize: '',
        phone: '',
        message: ''
      })
    }, 3000)
  }

  const openInterestForm = () => {
    setShowInterestForm(true)
  }

  const closeInterestForm = () => {
    setShowInterestForm(false)
    setFormSubmitted(false)
  }

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Strategic Alignment',
      description: 'Connect company-wide goals with day-to-day execution. Keep every team aligned with organizational objectives in real-time.'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Real-Time Visibility',
      description: 'Track progress across all initiatives with live dashboards. Make data-driven decisions with comprehensive analytics.'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Team Collaboration',
      description: 'Break down silos with seamless cross-functional collaboration. Unite teams around shared goals and outcomes.'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      title: 'Workflow Automation',
      description: 'Automate repetitive tasks and streamline processes. Focus on high-impact work while Braify handles the rest.'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Enterprise Security',
      description: 'Bank-level encryption and compliance standards. Your data is protected with advanced security protocols.'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      title: 'Performance Insights',
      description: 'Gain actionable insights with AI-powered analytics. Identify bottlenecks and optimize team performance.'
    }
  ]

  const testimonials = [
    {
      quote: "Braify transformed how our organization operates. We've seen a 40% increase in project delivery speed.",
      author: "Sarah Chen",
      role: "VP of Operations, TechCorp",
      avatar: "SC"
    },
    {
      quote: "The visibility Braify provides is game-changing. Our leadership team finally has real-time insight into execution.",
      author: "Michael Rodriguez",
      role: "CTO, InnovateLabs",
      avatar: "MR"
    },
    {
      quote: "Best investment we've made. Braify connects strategy to execution in a way no other platform does.",
      author: "Emily Thompson",
      role: "CEO, GrowthVentures",
      avatar: "ET"
    }
  ]

  const pricingPlans = [
    {
      name: "Starter",
      price: "$29",
      period: "/user/month",
      description: "Perfect for small teams getting started",
      features: [
        "Up to 10 team members",
        "Unlimited projects",
        "Basic analytics",
        "Email support",
        "Mobile apps"
      ],
      cta: "Start Free Trial",
      highlighted: false
    },
    {
      name: "Professional",
      price: "$79",
      period: "/user/month",
      description: "For growing teams that need more",
      features: [
        "Up to 50 team members",
        "Advanced analytics & reporting",
        "Priority support",
        "Custom workflows",
        "API access",
        "SSO integration"
      ],
      cta: "Start Free Trial",
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For large organizations with complex needs",
      features: [
        "Unlimited team members",
        "Dedicated success manager",
        "Advanced security & compliance",
        "Custom integrations",
        "SLA guarantees",
        "On-premise deployment"
      ],
      cta: "Contact Sales",
      highlighted: false
    }
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sticky Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-gray-900/95 backdrop-blur-lg shadow-lg border-b border-purple-500/20' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-600 blur-xl opacity-50"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">B</span>
                </div>
              </div>
              <span className="text-2xl font-bold text-white">Braify</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="text-gray-300 hover:text-white transition-colors font-medium"
              >
                Features
              </button>
              <button
                onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
                className="text-gray-300 hover:text-white transition-colors font-medium"
              >
                Pricing
              </button>
              <button
                onClick={() => navigate('/login')}
                className="text-gray-300 hover:text-white transition-colors font-medium"
              >
                Login
              </button>
              <button
                onClick={openInterestForm}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all duration-200"
              >
                Get Started
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold text-sm"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-1/3 -right-1/4 w-96 h-96 bg-purple-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
            <span className="text-purple-400 text-sm font-semibold">Enterprise Work Management Platform</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
            Connect Strategy
            <span className="block bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              to Execution
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Braify empowers organizations to work smarter by connecting company-wide goals, strategic initiatives, and execution in one unified platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={openInterestForm}
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>Start Free Trial</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-gray-800 text-white rounded-lg font-semibold text-lg border-2 border-gray-700 hover:border-purple-500 hover:bg-gray-800/50 transition-all duration-200"
            >
              Learn More
            </button>
          </div>

          {/* Hero Image/Product Preview */}
          <div className="max-w-6xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-400 rounded-2xl blur-3xl opacity-20"></div>
              <div className="relative bg-gray-800 rounded-2xl shadow-2xl p-2 border border-gray-700">
                <div className="aspect-video bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-xl flex items-center justify-center overflow-hidden">
                  <div className="text-center p-8">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="h-24 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg border border-purple-500/30"></div>
                      <div className="h-24 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg border border-purple-500/30"></div>
                      <div className="h-24 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg border border-purple-500/30"></div>
                    </div>
                    <p className="text-gray-400 font-medium">Unified Work Management Dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-900/50 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block mb-4 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
              <span className="text-purple-400 text-sm font-semibold">POWERFUL FEATURES</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Everything Your Team Needs
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Built for enterprise teams who demand excellence in execution
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block mb-4 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
              <span className="text-purple-400 text-sm font-semibold">TESTIMONIALS</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-400">
              See what our customers have to say
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-white">{testimonial.author}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block mb-4 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
              <span className="text-purple-400 text-sm font-semibold">PRICING</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-400">
              Choose the plan that's right for your team
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-2 ${
                  plan.highlighted
                    ? 'border-purple-500 shadow-2xl shadow-purple-500/20'
                    : 'border-gray-700 hover:border-purple-500/50'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-5 left-0 right-0 flex justify-center">
                    <span className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400 ml-2">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg className="w-6 h-6 text-purple-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={openInterestForm}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/50'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl p-12 sm:p-16 border border-purple-500/20 shadow-2xl">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Join thousands of teams already using Braify to connect strategy with execution and achieve their goals faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={openInterestForm}
                className="group px-10 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>Start Your Free Trial</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                onClick={() => window.open('https://www.braify.com', '_blank')}
                className="px-10 py-4 bg-gray-700 text-white rounded-lg font-semibold text-lg border-2 border-gray-600 hover:border-purple-500 hover:bg-gray-700/50 transition-all duration-200"
              >
                Visit braify.com
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-8">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-600 blur-lg opacity-50"></div>
                  <div className="relative w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">B</span>
                  </div>
                </div>
                <span className="text-xl font-bold text-white">Braify</span>
              </div>
              <p className="text-gray-400 text-sm">
                Empowering organizations to work smarter through unified work management.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button className="hover:text-purple-400 transition-colors">Features</button></li>
                <li><button className="hover:text-purple-400 transition-colors">Pricing</button></li>
                <li><button className="hover:text-purple-400 transition-colors">Security</button></li>
                <li><button className="hover:text-purple-400 transition-colors">Integrations</button></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button className="hover:text-purple-400 transition-colors">About</button></li>
                <li><button className="hover:text-purple-400 transition-colors">Careers</button></li>
                <li><button className="hover:text-purple-400 transition-colors">Blog</button></li>
                <li><button className="hover:text-purple-400 transition-colors">Contact</button></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button className="hover:text-purple-400 transition-colors">Documentation</button></li>
                <li><button className="hover:text-purple-400 transition-colors">Help Center</button></li>
                <li><button className="hover:text-purple-400 transition-colors">Community</button></li>
                <li><button className="hover:text-purple-400 transition-colors">Status</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 sm:mb-0">
              © {new Date().getFullYear()} Braify. All rights reserved.
            </p>
            <div className="flex space-x-6 text-gray-400 text-sm">
              <button className="hover:text-purple-400 transition-colors">Privacy Policy</button>
              <button className="hover:text-purple-400 transition-colors">Terms of Service</button>
              <button className="hover:text-purple-400 transition-colors">Cookie Policy</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Interest Form Modal */}
      {showInterestForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeInterestForm}
          ></div>

          {/* Modal */}
          <div className="relative bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30">
            {/* Close button */}
            <button
              onClick={closeInterestForm}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-8 sm:p-12">
              {!formSubmitted ? (
                <>
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">Start Your Free Trial</h3>
                    <p className="text-gray-400">Tell us about yourself and we'll get you started</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-semibold text-gray-300 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                          placeholder="John Doe"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
                          Work Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                          placeholder="john@company.com"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="companyName" className="block text-sm font-semibold text-gray-300 mb-2">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          id="companyName"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                          placeholder="Acme Corp"
                        />
                      </div>

                      <div>
                        <label htmlFor="companySize" className="block text-sm font-semibold text-gray-300 mb-2">
                          Company Size *
                        </label>
                        <select
                          id="companySize"
                          name="companySize"
                          value={formData.companySize}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        >
                          <option value="">Select size</option>
                          <option value="1-10">1-10 employees</option>
                          <option value="11-50">11-50 employees</option>
                          <option value="51-200">51-200 employees</option>
                          <option value="201-500">201-500 employees</option>
                          <option value="501-1000">501-1,000 employees</option>
                          <option value="1000+">1,000+ employees</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold text-gray-300 mb-2">
                        How can Braify help your organization?
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                        placeholder="Tell us about your goals and challenges..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-200"
                    >
                      Submit Interest
                    </button>

                    <p className="text-center text-gray-400 text-sm">
                      By submitting, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </form>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-3">Thank You!</h3>
                  <p className="text-gray-400 text-lg mb-2">
                    We've received your information.
                  </p>
                  <p className="text-gray-500">
                    Our team will reach out to you shortly to get you started with Braify.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
