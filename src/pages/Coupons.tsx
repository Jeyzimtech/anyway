import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Badge } from 'components/ui/badge';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select';
import { Ticket, Wifi, Gift, Copy } from 'lucide-react';

interface Coupon {
  id: number;
  code: string;
  type: "WiFi" | "Discount" | "Gift";
  value: string;
  usageLimit: number;
  usedCount: number;
  validUntil: string;
  active: boolean;
}

const DEMO_COUPONS: Coupon[] = [];

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>(DEMO_COUPONS);

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    type: "WiFi" as const,
    value: "",
    usageLimit: "",
    validUntil: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCoupon.code || !newCoupon.value || !newCoupon.usageLimit || !newCoupon.validUntil) {
      alert("Please fill in all fields");
      return;
    }

    const coupon: Coupon = {
      id: coupons.length + 1,
      code: newCoupon.code.toUpperCase(),
      type: newCoupon.type,
      value: newCoupon.value,
      usageLimit: parseInt(newCoupon.usageLimit),
      usedCount: 0,
      validUntil: newCoupon.validUntil,
      active: true,
    };

    setCoupons([coupon, ...coupons]);
    alert("Coupon created successfully");
    
    setNewCoupon({
      code: "",
      type: "WiFi",
      value: "",
      usageLimit: "",
      validUntil: "",
    });
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Coupon code copied to clipboard");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "WiFi":
        return <Wifi className="h-4 w-4" />;
      case "Gift":
        return <Gift className="h-4 w-4" />;
      default:
        return <Ticket className="h-4 w-4" />;
    }
  };

  return (


    <>
<main className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="space-y-4 md:space-y-6">
          {/* Page Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#1A202C' }}>Coupons</h1>
            <p className="text-xs sm:text-sm md:text-base mt-1 sm:mt-2" style={{ color: '#4A5568' }}>Create and manage promotional coupons</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" style={{ padding: '24px', paddingBottom: '8px' }}>
                <CardTitle className="text-sm font-semibold" style={{ color: '#718096' }}>Active Coupons</CardTitle>
                <Ticket className="h-4 w-4" style={{ color: '#38A169' }} />
              </CardHeader>
              <CardContent style={{ padding: '24px', paddingTop: '8px' }}>
                <div className="text-2xl font-bold" style={{ color: '#1A202C' }}>
                  {coupons.filter(c => c.active).length}
                </div>
                <p className="text-xs" style={{ color: '#718096' }}>Currently available</p>
              </CardContent>
            </Card>

            <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" style={{ padding: '24px', paddingBottom: '8px' }}>
                <CardTitle className="text-sm font-semibold" style={{ color: '#718096' }}>Total Usage</CardTitle>
                <Ticket className="h-4 w-4" style={{ color: '#0883A4' }} />
              </CardHeader>
              <CardContent style={{ padding: '24px', paddingTop: '8px' }}>
                <div className="text-2xl font-bold" style={{ color: '#1A202C' }}>
                  {coupons.reduce((sum, c) => sum + c.usedCount, 0)}
                </div>
                <p className="text-xs" style={{ color: '#718096' }}>Times redeemed</p>
              </CardContent>
            </Card>

            <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" style={{ padding: '24px', paddingBottom: '8px' }}>
                <CardTitle className="text-sm font-semibold" style={{ color: '#718096' }}>WiFi Coupons</CardTitle>
                <Wifi className="h-4 w-4" style={{ color: '#F59E0B' }} />
              </CardHeader>
              <CardContent style={{ padding: '24px', paddingTop: '8px' }}>
                <div className="text-2xl font-bold" style={{ color: '#1A202C' }}>
                  {coupons.filter(c => c.type === "WiFi").length}
                </div>
                <p className="text-xs" style={{ color: '#718096' }}>For customer access</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Coupon Form */}
            <div className="lg:col-span-1">
              <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
                <CardHeader style={{ padding: '24px', paddingBottom: '16px' }}>
                  <CardTitle className="text-lg font-bold" style={{ color: '#1A202C' }}>Create New Coupon</CardTitle>
                </CardHeader>
                <CardContent style={{ padding: '24px', paddingTop: '16px' }}>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="code" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                        Coupon Code <span style={{ color: '#E53E3E' }}>*</span>
                      </Label>
                      <Input
                        id="code"
                        value={newCoupon.code}
                        onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                        placeholder="e.g., WIFI2025"
                        required
                        className="h-11 border font-mono"
                        style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                        Type <span style={{ color: '#E53E3E' }}>*</span>
                      </Label>
                      <div 
                        className="h-11 border rounded flex items-center px-3" 
                        style={{ borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', color: '#4A5568' }}
                      >
                        <Wifi className="h-4 w-4 mr-2" />
                        WiFi Access Only
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="value" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                        WiFi Password <span style={{ color: '#E53E3E' }}>*</span>
                      </Label>
                      <Input
                        id="value"
                        value={newCoupon.value}
                        onChange={(e) => setNewCoupon({ ...newCoupon, value: e.target.value })}
                        placeholder="Enter WiFi password"
                        required
                        className="h-11 border"
                        style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="usageLimit" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                        Usage Limit <span style={{ color: '#E53E3E' }}>*</span>
                      </Label>
                      <Input
                        id="usageLimit"
                        type="number"
                        value={newCoupon.usageLimit}
                        onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })}
                        placeholder="0"
                        min="1"
                        required
                        className="h-11 border"
                        style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="validUntil" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                        Valid Until <span style={{ color: '#E53E3E' }}>*</span>
                      </Label>
                      <Input
                        id="validUntil"
                        type="date"
                        value={newCoupon.validUntil}
                        onChange={(e) => setNewCoupon({ ...newCoupon, validUntil: e.target.value })}
                        required
                        className="h-11 border"
                        style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 font-bold" 
                      style={{ backgroundColor: '#0883A4', color: '#FFFFFF', borderRadius: '8px' }}
                    >
                      Create Coupon
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Coupon List */}
            <div className="lg:col-span-2">
              <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
                <CardHeader style={{ padding: '24px', paddingBottom: '16px' }}>
                  <CardTitle className="text-lg font-bold" style={{ color: '#1A202C' }}>Coupon List</CardTitle>
                </CardHeader>
                <CardContent style={{ padding: '24px', paddingTop: '16px' }}>
                  <div className="space-y-3">
                    {coupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="flex items-center justify-between p-4 border transition-colors hover:bg-gray-50"
                        style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div 
                              className="p-2 rounded" 
                              style={{ 
                                backgroundColor: coupon.type === "WiFi" ? '#FEF3C7' : coupon.type === "Gift" ? '#DBEAFE' : '#D1FAE5',
                                color: coupon.type === "WiFi" ? '#F59E0B' : coupon.type === "Gift" ? '#3B82F6' : '#38A169',
                                borderRadius: '8px'
                              }}
                            >
                              {getTypeIcon(coupon.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold font-mono" style={{ color: '#1A202C' }}>{coupon.code}</h3>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => copyCouponCode(coupon.code)}
                                  style={{ color: '#718096' }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-sm" style={{ color: '#718096' }}>{coupon.type}</p>
                            </div>
                          </div>
                          <p className="text-sm mb-2" style={{ color: '#4A5568' }}>{coupon.value}</p>
                          <div className="flex items-center gap-4 text-xs" style={{ color: '#718096' }}>
                            <span>Used: {coupon.usedCount}/{coupon.usageLimit}</span>
                            <span>Valid until: {coupon.validUntil}</span>
                          </div>
                        </div>
                        <Badge 
                          variant={coupon.active ? "default" : "secondary"}
                          style={{
                            backgroundColor: coupon.active ? '#38A169' : '#E2E8F0',
                            color: coupon.active ? '#FFFFFF' : '#4A5568',
                            borderRadius: '12px',
                            padding: '4px 12px'
                          }}
                        >
                          {coupon.active ? "Active" : "Expired"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
