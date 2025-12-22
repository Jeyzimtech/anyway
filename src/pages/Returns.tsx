import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Badge } from 'components/ui/badge';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Textarea } from 'components/ui/textarea';
import { RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { createReturn, listReturns } from '../lib/api';

interface ReturnItem {
  id: number;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function Returns() {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [newReturn, setNewReturn] = useState({
    order_id: '',
    product_name: '',
    quantity: '',
    reason: '',
  });

  useEffect(() => {
    fetchReturns();
  }, []);

  async function fetchReturns() {
    setLoading(true);
    try {
      const { returns } = await listReturns();
      setReturns(returns);
    } catch (e) {
      console.error('Failed to load returns', e);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReturn.order_id || !newReturn.product_name || !newReturn.quantity) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await createReturn({
        order_id: newReturn.order_id,
        product_id: newReturn.product_name.toLowerCase().replace(/\s+/g, '_'),
        product_name: newReturn.product_name,
        quantity: parseInt(newReturn.quantity),
        reason: newReturn.reason,
      });
      alert('Return request submitted successfully');
      fetchReturns();
    } catch (e: any) {
      alert('Failed to submit return: ' + e.message);
    }
    
    setNewReturn({
      order_id: '',
      product_name: '',
      quantity: '',
      reason: '',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (


    <>
<div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Returns Management</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">Process customer returns and refunds</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
              <RotateCcw className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{returns.length}</div>
              <p className="text-xs text-gray-600">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {returns.filter(r => r.status === 'pending').length}
              </div>
              <p className="text-xs text-gray-600">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {returns.filter(r => r.status === 'approved').length}
              </div>
              <p className="text-xs text-green-600">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {returns.filter(r => r.status === 'rejected').length}
              </div>
              <p className="text-xs text-red-600">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Return Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>New Return Request</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitReturn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="order_id">Order ID</Label>
                    <Input id="order_id" value={newReturn.order_id} onChange={(e) => setNewReturn({ ...newReturn, order_id: e.target.value })} placeholder="ORD-XXX" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product_name">Product Name</Label>
                    <Input id="product_name" value={newReturn.product_name} onChange={(e) => setNewReturn({ ...newReturn, product_name: e.target.value })} placeholder="Enter product name" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newReturn.quantity}
                      onChange={(e) => setNewReturn({ ...newReturn, quantity: e.target.value })}
                      placeholder="0"
                      min="1"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Return (Optional)</Label>
                    <Textarea
                      id="reason"
                      value={newReturn.reason}
                      onChange={(e) => setNewReturn({ ...newReturn, reason: e.target.value })}
                      placeholder="Describe the reason..."
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Submit Return
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Return Requests List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Return Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading ? (
                    <p className="text-center text-muted-foreground py-8">Loading returns...</p>
                  ) : returns.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No returns found</p>
                  ) : returns.map((returnItem) => (
                    <div
                      key={returnItem.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-blue-50">
                          {getStatusIcon(returnItem.status)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{returnItem.product_name}</h3>
                          <p className="text-sm text-gray-600">
                            {returnItem.order_id} • Qty: {returnItem.quantity} • {new Date(returnItem.created_at).toLocaleDateString()}
                          </p>
                          {returnItem.reason && (
                            <p className="text-xs text-gray-500 mt-1">{returnItem.reason}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(returnItem.status)}>
                        {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
